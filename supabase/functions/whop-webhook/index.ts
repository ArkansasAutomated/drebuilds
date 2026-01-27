import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WHOP_WEBHOOK_KEY")!;

/**
 * Verify HMAC signature from webhook payload
 * @param payload - Raw request body as string
 * @param signature - Signature from x-whop-signature header
 * @param secret - Webhook secret key
 * @returns Promise<boolean> - True if signature is valid
 */
async function verifyHmacSignature(
  payload: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) return false;

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }

    return result === 0;
  } catch (err) {
    console.error("HMAC verification error:", err);
    return false;
  }
}

interface WebhookPayload {
  action: string;
  data: {
    id: string;
    user?: {
      id: string;
      email?: string;
      username?: string;
    };
    plan?: {
      id: string;
    };
    membership?: {
      id: string;
      user: {
        id: string;
        email?: string;
        username?: string;
      };
      plan: {
        id: string;
      };
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    console.warn(`Method not allowed: ${req.method}`);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    );
  }

  // Get raw body for HMAC verification
  const rawBody = await req.text();

  // Validate webhook signature (HMAC) or fall back to shared secret
  const hmacSignature = req.headers.get("x-whop-signature");
  const sharedSecret = req.headers.get("x-webhook-secret");

  const isHmacValid = await verifyHmacSignature(rawBody, hmacSignature, webhookSecret);
  const isSharedSecretValid = sharedSecret === webhookSecret;

  if (!isHmacValid && !isSharedSecretValid) {
    console.warn("Invalid or missing webhook authentication");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: WebhookPayload = JSON.parse(rawBody);
    const eventType = payload.action;
    const eventId = payload.data?.id || crypto.randomUUID();

    console.log(`Received webhook event: ${eventType}, event_id: ${eventId}`);
    console.log(`Payload: ${JSON.stringify(payload)}`);

    // Check for duplicate event
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingEvent) {
      console.log(`Duplicate event detected: ${eventId}`);
      return new Response(
        JSON.stringify({ success: true, message: "Duplicate event ignored" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract resource ID based on event type
    let resourceId: string | null = null;
    if (payload.data?.membership?.id) {
      resourceId = payload.data.membership.id;
    } else if (payload.data?.id) {
      resourceId = payload.data.id;
    }

    // Log the event
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({
        event_id: eventId,
        event_type: eventType,
        resource_id: resourceId,
        payload: payload,
        processed: false,
      });

    if (insertError) {
      console.error("Failed to log webhook event:", insertError);
      throw new Error(`Failed to log event: ${insertError.message}`);
    }

    // Process event based on type
    let processingError: string | null = null;

    try {
      switch (eventType) {
        case "membership.activated":
        case "membership.went_valid":
          await handleMembershipActivation(supabase, payload);
          break;

        case "membership.deactivated":
        case "membership.went_invalid":
          await handleMembershipDeactivation(supabase, payload);
          break;

        case "payment.succeeded":
          await handlePaymentSucceeded(supabase, payload, eventId);
          break;

        case "checkout.completed":
          console.log("Checkout completed event logged for analytics");
          break;

        default:
          console.log(`Unhandled event type: ${eventType}`);
      }
    } catch (err) {
      processingError = err instanceof Error ? err.message : String(err);
      console.error(`Error processing ${eventType}:`, processingError);
    }

    // Update event as processed
    await supabase
      .from("webhook_events")
      .update({
        processed: !processingError,
        error_message: processingError,
      })
      .eq("event_id", eventId);

    if (processingError) {
      return new Response(
        JSON.stringify({ success: false, error: processingError }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully processed event: ${eventType}`);
    return new Response(
      JSON.stringify({ success: true, event_type: eventType }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Webhook processing failed:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// deno-lint-ignore no-explicit-any
async function handlePaymentSucceeded(
  supabase: any,
  payload: WebhookPayload,
  eventId: string
) {
  const paymentData = payload.data;
  const amount = (paymentData?.amount as number) || 0;
  const currency = (paymentData?.currency as string) || "usd";
  const planId = paymentData?.plan?.id || paymentData?.membership?.plan?.id || null;
  const userId = paymentData?.user?.id || paymentData?.membership?.user?.id || null;

  console.log(`Processing payment: $${amount / 100} ${currency.toUpperCase()}`);

  // Insert revenue telemetry event
  const { error: telemetryError } = await supabase
    .from("telemetry_events")
    .insert({
      event_type: "revenue",
      element_id: eventId,
      metadata: {
        amount,
        currency,
        plan_id: planId,
        user_id: userId,
        timestamp: new Date().toISOString(),
        raw_event_type: "payment.succeeded",
      },
    });

  if (telemetryError) {
    console.error("Failed to insert revenue telemetry:", telemetryError);
  } else {
    console.log("Revenue telemetry event recorded");
  }

  // Broadcast to admin_updates channel
  await broadcastToAdminChannel(supabase, "payment.succeeded", {
    amount,
    currency,
    plan_id: planId,
    user_id: userId,
    event_id: eventId,
  });
}

// deno-lint-ignore no-explicit-any
async function broadcastToAdminChannel(
  supabase: any,
  eventType: string,
  data: Record<string, unknown>
) {
  try {
    const channel = supabase.channel("admin_updates");

    await channel.send({
      type: "broadcast",
      event: "webhook_event",
      payload: {
        id: crypto.randomUUID(),
        event_type: eventType,
        element_id: data.event_id || null,
        metadata: data,
        created_at: new Date().toISOString(),
      },
    });

    console.log(`Broadcasted ${eventType} to admin_updates channel`);
  } catch (err) {
    console.error("Failed to broadcast to admin channel:", err);
  }
}

// deno-lint-ignore no-explicit-any
async function handleMembershipActivation(
  supabase: any,
  payload: WebhookPayload
) {
  const membership = payload.data?.membership;
  if (!membership?.user?.id || !membership?.plan?.id) {
    console.warn("Missing membership user or plan data:", JSON.stringify(payload.data));
    return;
  }

  const whopUserId = membership.user.id;
  const planId = membership.plan.id;

  console.log(`Activating plan ${planId} for Whop user ${whopUserId}`);

  // Find user by whop_user_id and add plan_id if not present
  const { data: whopUser, error: fetchError } = await supabase
    .from("whop_users")
    .select("id, plan_ids")
    .eq("whop_user_id", whopUserId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch whop_user: ${fetchError.message}`);
  }

  if (!whopUser) {
    console.warn(`No whop_users record found for whop_user_id: ${whopUserId}`);
    return;
  }

  const currentPlanIds = whopUser.plan_ids || [];

  // Only add if not already present
  if (!currentPlanIds.includes(planId)) {
    const { error: updateError } = await supabase
      .from("whop_users")
      .update({ plan_ids: [...currentPlanIds, planId] })
      .eq("id", whopUser.id);

    if (updateError) {
      throw new Error(`Failed to update plan_ids: ${updateError.message}`);
    }

    console.log(`Added plan ${planId} to user ${whopUserId}`);

    // Broadcast membership activation
    await broadcastToAdminChannel(supabase, "membership.activated", {
      plan_id: planId,
      whop_user_id: whopUserId,
    });
  } else {
    console.log(`Plan ${planId} already exists for user ${whopUserId}`);
  }
}

// deno-lint-ignore no-explicit-any
async function handleMembershipDeactivation(
  supabase: any,
  payload: WebhookPayload
) {
  const membership = payload.data?.membership;
  if (!membership?.user?.id || !membership?.plan?.id) {
    console.warn("Missing membership user or plan data:", JSON.stringify(payload.data));
    return;
  }

  const whopUserId = membership.user.id;
  const planId = membership.plan.id;

  console.log(`Deactivating plan ${planId} for Whop user ${whopUserId}`);

  // Find user by whop_user_id and remove plan_id
  const { data: whopUser, error: fetchError } = await supabase
    .from("whop_users")
    .select("id, plan_ids")
    .eq("whop_user_id", whopUserId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Failed to fetch whop_user: ${fetchError.message}`);
  }

  if (!whopUser) {
    console.warn(`No whop_users record found for whop_user_id: ${whopUserId}`);
    return;
  }

  const currentPlanIds = whopUser.plan_ids || [];
  const updatedPlanIds = currentPlanIds.filter((id: string) => id !== planId);

  if (currentPlanIds.length !== updatedPlanIds.length) {
    const { error: updateError } = await supabase
      .from("whop_users")
      .update({ plan_ids: updatedPlanIds })
      .eq("id", whopUser.id);

    if (updateError) {
      throw new Error(`Failed to update plan_ids: ${updateError.message}`);
    }

    console.log(`Removed plan ${planId} from user ${whopUserId}`);

    // Broadcast membership deactivation
    await broadcastToAdminChannel(supabase, "membership.deactivated", {
      plan_id: planId,
      whop_user_id: whopUserId,
    });
  } else {
    console.log(`Plan ${planId} was not in user ${whopUserId}'s plan_ids`);
  }
}
