// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================
// capture-lead edge function
// ============================================================
// Accepts a lead from any spoke site (or the hub itself), writes
// it to the correct table (audit_leads or
// newsletter_subscriptions), and bumps the lead_sources rollup.
//
// CORS allowlist is configurable via the SPOKE_ORIGINS env var
// (comma-separated). Defaults to the drebuilds.online + lovable
// domains plus localhost for dev. Add real spoke domains as
// they're deployed (e.g. fortsmithdirectory.com, doseofproof.com).
//
// Request body:
//   {
//     lead_type: "audit" | "newsletter",
//     list_slug?: string,            // required when lead_type=newsletter
//     fields: { ... },                // audit: business_name/email/phone/...
//                                      // newsletter: email, full_name
//     source:   string,               // utm_source or derived
//     medium:   string,
//     campaign: string,
//     content:  string,
//     source_url: string,
//     referrer: string,
//     user_agent?: string,
//     meta?: Record<string, string>,  // free-form extra metadata
//   }
//
// Response:
//   200 { success: true, lead_id: "...", source_id: "..." }
//   400 { success: false, error: "validation_error", details: ... }
//   404 { success: false, error: "list_not_found" }
//   405 { success: false, error: "method_not_allowed" }
//   429 { success: false, error: "rate_limited" }
//   500 { success: false, error: "..." }
// ============================================================

// Configurable origin allowlist. Comma-separated in the env var.
// Default covers the hub + dev origins; spokes are added as they
// go live.
const DEFAULT_ALLOWED_ORIGINS = [
  "https://drebuilds.online",
  "https://www.drebuilds.online",
  "https://drebuilds.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];

const parseAllowedOrigins = (raw: string | null): string[] => {
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? list : DEFAULT_ALLOWED_ORIGINS;
};

const ALLOWED_ORIGINS = parseAllowedOrigins(
  Deno.env.get("SPOKE_ORIGINS") ?? null,
);

const getCorsHeaders = (origin: string | null) => {
  // Reflect matching origin, fall back to the first default so
  // a CORS preflight still gets a valid ACAO header.
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
};

// Per-IP rate limit (in-memory, resets on function restart).
// Tight enough to deflect spam, loose enough for real spokes to
// batch-submit during launch bursts.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_WINDOW_MS = 60_000;

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  record.count += 1;
  if (record.count > RATE_LIMIT_MAX) return true;
  return false;
};

// Light validation — the client-side zod schema is the primary
// gate, this is just defense-in-depth.
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isValidEmail = (s: unknown): s is string =>
  typeof s === "string" && s.length >= 5 && s.length <= 255 && EMAIL_RE.test(s);

const isValidString = (v: unknown, min: number, max: number): v is string =>
  typeof v === "string" && v.length >= min && v.length <= max;

const getClientIp = (req: Request): string => {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
};

// Lead-type specific field validation. Returns a cleaned payload
// or an error message.
const validateAudit = (fields: any): { ok: true; data: any } | { ok: false; error: string } => {
  if (!fields || typeof fields !== "object") return { ok: false, error: "fields_missing" };
  const f = fields as Record<string, unknown>;

  const requiredStrings: Array<[string, number, number]> = [
    ["business_name", 1, 200],
    ["industry", 1, 100],
    ["team_size", 1, 50],
    ["biggest_bottleneck", 1, 100],
    ["full_name", 1, 200],
    ["preferred_contact_method", 1, 50],
  ];
  for (const [key, min, max] of requiredStrings) {
    if (!isValidString(f[key], min, max)) {
      return { ok: false, error: `invalid_${key}` };
    }
  }
  if (!isValidEmail(f.email)) return { ok: false, error: "invalid_email" };
  if (!isValidString(f.phone, 7, 30)) return { ok: false, error: "invalid_phone" };
  if (!Array.isArray(f.current_tools) || f.current_tools.length === 0) {
    return { ok: false, error: "invalid_current_tools" };
  }

  return {
    ok: true,
    data: {
      business_name: String(f.business_name).trim(),
      industry: String(f.industry).trim(),
      team_size: String(f.team_size).trim(),
      biggest_bottleneck: String(f.biggest_bottleneck).trim(),
      full_name: String(f.full_name).trim(),
      email: String(f.email).toLowerCase().trim(),
      phone: String(f.phone).trim(),
      preferred_contact_method: String(f.preferred_contact_method).trim(),
      current_tools: f.current_tools.map((t: unknown) => String(t)),
    },
  };
};

const validateNewsletter = (
  fields: any,
): { ok: true; data: { email: string; full_name: string | null } } | { ok: false; error: string } => {
  if (!fields || typeof fields !== "object") return { ok: false, error: "fields_missing" };
  const f = fields as Record<string, unknown>;
  if (!isValidEmail(f.email)) return { ok: false, error: "invalid_email" };
  const fullName =
    typeof f.full_name === "string" && f.full_name.trim().length > 0
      ? f.full_name.trim().slice(0, 200)
      : null;
  return {
    ok: true,
    data: {
      email: String(f.email).toLowerCase().trim(),
      full_name: fullName,
    },
  };
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "method_not_allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Rate limit
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ success: false, error: "rate_limited" }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Parse + validate body
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "invalid_json" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const leadType = body?.lead_type;
  if (leadType !== "audit" && leadType !== "newsletter") {
    return new Response(
      JSON.stringify({ success: false, error: "invalid_lead_type" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "server_misconfigured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Pull the attribution envelope off the request.
  const attribution = {
    source: typeof body.source === "string" ? body.source : "",
    medium: typeof body.medium === "string" ? body.medium : "",
    campaign: typeof body.campaign === "string" ? body.campaign : "",
    content: typeof body.content === "string" ? body.content : "",
    source_url: typeof body.source_url === "string" ? body.source_url : "",
    referrer: typeof body.referrer === "string" ? body.referrer : "",
    user_agent:
      typeof body.user_agent === "string"
        ? body.user_agent
        : req.headers.get("user-agent") || null,
  };

  try {
    if (leadType === "audit") {
      const v = validateAudit(body.fields);
      if (!v.ok) {
        return new Response(
          JSON.stringify({ success: false, error: v.error }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const utmParams = {
        utm_source: attribution.source,
        utm_medium: attribution.medium,
        utm_campaign: attribution.campaign,
        utm_content: attribution.content,
        lead_type: "audit",
        referrer: attribution.referrer,
        ...(body.meta && typeof body.meta === "object" ? body.meta : {}),
      };

      const { data: inserted, error: insertErr } = await supabase
        .from("audit_leads")
        .insert({
          ...v.data,
          source: attribution.source || "audit_page",
          source_url: attribution.source_url,
          utm_params: utmParams,
          user_agent: attribution.user_agent,
          referrer: attribution.referrer || null,
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("audit_leads insert failed:", insertErr);
        return new Response(
          JSON.stringify({ success: false, error: "insert_failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Bump the rollup via SECURITY DEFINER RPC.
      const { data: sourceId } = await supabase.rpc("capture_lead_source", {
        p_source: attribution.source,
        p_medium: attribution.medium,
        p_campaign: attribution.campaign,
        p_content: attribution.content,
        p_lead_type: "audit",
      });

      return new Response(
        JSON.stringify({
          success: true,
          lead_id: inserted.id,
          source_id: sourceId ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Newsletter
    const v = validateNewsletter(body.fields);
    if (!v.ok) {
      return new Response(
        JSON.stringify({ success: false, error: v.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const listSlug = typeof body.list_slug === "string" ? body.list_slug.trim() : "";
    if (!listSlug) {
      return new Response(
        JSON.stringify({ success: false, error: "list_slug_required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Resolve list_slug → list_id
    const { data: list, error: listErr } = await supabase
      .from("newsletter_lists")
      .select("id")
      .eq("slug", listSlug)
      .eq("is_active", true)
      .maybeSingle();

    if (listErr || !list) {
      return new Response(
        JSON.stringify({ success: false, error: "list_not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const utmParams = {
      utm_source: attribution.source,
      utm_medium: attribution.medium,
      utm_campaign: attribution.campaign,
      utm_content: attribution.content,
      lead_type: "newsletter",
      referrer: attribution.referrer,
      list_slug: listSlug,
      ...(body.meta && typeof body.meta === "object" ? body.meta : {}),
    };

    // Idempotent: ON CONFLICT DO NOTHING via the unique
    // (list_id, email) constraint. If the lead is a duplicate,
    // surface that to the caller so the spoke can show a
    // friendly "already subscribed" UI.
    const { data: inserted, error: insertErr } = await supabase
      .from("newsletter_subscriptions")
      .insert({
        email: v.data.email,
        list_id: list.id,
        full_name: v.data.full_name,
        source: attribution.source || listSlug,
        source_url: attribution.source_url,
        utm_params: utmParams,
      })
      .select("id")
      .maybeSingle();

    if (insertErr) {
      // 23505 = unique_violation → already subscribed
      if (insertErr.code === "23505") {
        return new Response(
          JSON.stringify({ success: true, duplicate: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      console.error("newsletter_subscriptions insert failed:", insertErr);
      return new Response(
        JSON.stringify({ success: false, error: "insert_failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: sourceId } = await supabase.rpc("capture_lead_source", {
      p_source: attribution.source,
      p_medium: attribution.medium,
      p_campaign: attribution.campaign,
      p_content: attribution.content,
      p_lead_type: "newsletter",
    });

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: inserted?.id ?? null,
        source_id: sourceId ?? null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("capture-lead unhandled error:", err);
    const message = err instanceof Error ? err.message : "unknown_error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
