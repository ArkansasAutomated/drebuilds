// @ts-nocheck
/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Utility to verify Whop signature
const verifySignature = async (
  signature: string,
  secret: string,
  body: string
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = new Uint8Array(
    signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
  );

  return await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(body)
  );
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("whop-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 401, headers: corsHeaders });
    }

    const payload = await req.text();
    const webhookSecret = Deno.env.get("WHOP_WEBHOOK_SECRET");
    const n8nUrl = Deno.env.get("N8N_WEBHOOK_URL");

    if (!webhookSecret) {
      console.error("WHOP_WEBHOOK_SECRET is not set");
      return new Response("Server configuration error", { status: 500, headers: corsHeaders });
    }

    // Verify signature
    const isValid = await verifySignature(signature, webhookSecret, payload);
    if (!isValid) {
      console.error("Invalid Whop signature");
      return new Response("Invalid signature", { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(payload);
    console.log(`Received Whop event: ${event.type || "unknown"}`);

    // Relay to n8n if configured
    if (n8nUrl) {
      console.log(`Relaying to n8n: ${n8nUrl}`);
      try {
        const n8nResponse = await fetch(n8nUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Whop-Event": event.type || "unknown",
            "X-Relayed-From": "supabase-edge-function"
          },
          body: payload, // Forward exact payload
        });

        if (!n8nResponse.ok) {
          console.error(`n8n responded with ${n8nResponse.status}`);
        }
      } catch (err) {
        console.error("Failed to call n8n:", err);
      }
    } else {
      console.log("No N8N_WEBHOOK_URL set - processing locally (logging only)");
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    console.error("Webhook processing error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
