import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("WHOP_WEBHOOK_KEY")!;

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

  // Validate shared secret from n8n
  const incomingSecret = req.headers.get("x-webhook-secret");
  if (!incomingSecret || incomingSecret !== webhookSecret) {
    console.warn("Invalid or missing webhook secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const payload: WebhookPayload = await req.json();
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
          console.log("Payment succeeded event logged for analytics");
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
  } else {
    console.log(`Plan ${planId} was not in user ${whopUserId}'s plan_ids`);
  }
}
