import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("LEAD_CAPTURE_ALLOWED_ORIGINS") || "https://drebuilds.online,https://www.drebuilds.online")
  .split(",")
  .map((origin) => origin.trim());

const cors = (origin: string | null) => ({
  ...(origin && allowedOrigins.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (request.method !== "POST" || (origin && !allowedOrigins.includes(origin))) {
    return new Response(JSON.stringify({ error: "Not allowed" }), { status: 403, headers: { ...cors(origin), "Content-Type": "application/json" } });
  }

  try {
    const body = await request.json();
    const required = ["business_name", "industry", "team_size", "bottleneck", "full_name", "email", "phone"];
    if (required.some((key) => !String(body[key] || "").trim())) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...cors(origin), "Content-Type": "application/json" } });
    }

    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error } = await client.from("audit_leads").insert({
      business_name: String(body.business_name).slice(0, 200),
      industry: String(body.industry).slice(0, 100),
      team_size: String(body.team_size).slice(0, 50),
      current_tools: Array.isArray(body.current_tools) ? body.current_tools.slice(0, 20) : [],
      bottleneck: String(body.bottleneck).slice(0, 100),
      full_name: String(body.full_name).slice(0, 200),
      email: String(body.email).trim().toLowerCase().slice(0, 255),
      phone: String(body.phone).slice(0, 30),
      preferred_contact: String(body.preferred_contact || "email").slice(0, 20),
      source: String(body.source || "cross_site").slice(0, 200),
      utm_source: body.utm_source ? String(body.utm_source).slice(0, 200) : null,
      utm_medium: body.utm_medium ? String(body.utm_medium).slice(0, 200) : null,
      utm_campaign: body.utm_campaign ? String(body.utm_campaign).slice(0, 200) : null,
    });
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true }), { status: 201, headers: { ...cors(origin), "Content-Type": "application/json" } });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Unable to capture lead" }), { status: 500, headers: { ...cors(origin), "Content-Type": "application/json" } });
  }
});
