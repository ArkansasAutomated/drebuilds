import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://drebuilds.online",
  "https://drebuilds.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
];

const getCorsHeaders = (origin: string | null) => {
  // Allow Lovable preview origins dynamically
  const isLovablePreview = origin?.endsWith('.lovableproject.com');
  const isAllowed = ALLOWED_ORIGINS.includes(origin || "") || isLovablePreview;
  
  const allowedOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin!,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
};

// Rate limiting map (IP -> { count, resetTime })
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// v5 API plans response structure
interface WhopPlan {
  id: string;
  company: { id: string; title: string };
  product: { id: string; title: string };
  plan_type: string;
  visibility: string;
  billing_period: number | null;
  initial_price: number;
  renewal_price: number | null;
  title: string | null;
  description: string | null;
  purchase_url: string;
}

interface WhopPlansResponse {
  data: WhopPlan[];
  page_info?: {
    has_next_page: boolean;
    end_cursor: string | null;
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = req.headers.get("x-forwarded-for") || "unknown";

  // Rate limiting
  if (!checkRateLimit(clientIp)) {
    console.warn(`[whop-products] Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const WHOP_API_KEY = Deno.env.get("WHOP_API_KEY");
    const WHOP_COMPANY_ID = Deno.env.get("WHOP_COMPANY_ID");

    if (!WHOP_API_KEY || !WHOP_COMPANY_ID) {
      console.error("[whop-products] Missing WHOP_API_KEY or WHOP_COMPANY_ID");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // GET /plans - Fetch active plans from Whop
    if (req.method === "GET" && path === "plans") {
      console.log("[whop-products] Fetching plans for company:", WHOP_COMPANY_ID);

      // Use v2 API endpoint with company_id as query param
      const response = await fetch(
        `https://api.whop.com/api/v2/plans?company_id=${WHOP_COMPANY_ID}&expand=product`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${WHOP_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[whop-products] Whop API error:", response.status, errorText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch plans from Whop", details: errorText }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      console.log(`[whop-products] Fetched ${data.data?.length || data.length || 0} plans`);

      // Filter to visible plans and map to simplified structure
      // v2 API returns data at root level or in data array
      const plansArray = Array.isArray(data) ? data : (data.data || []);
      const plans = plansArray
        .filter((plan: WhopPlan) => plan.visibility === "visible")
        .map((plan: WhopPlan) => ({
          id: plan.id,
          name: plan.product?.title || plan.title || plan.description || `Plan ${plan.id}`,
          description: plan.description || '',
          price: plan.initial_price || 0, // v2 API returns prices in dollars already
          renewal_price: plan.renewal_price || null,
          billing_period: plan.billing_period,
          direct_link: plan.purchase_url || `https://whop.com/checkout/${plan.id}`,
        }));

      return new Response(JSON.stringify({ plans }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST /checkout - Create checkout configuration (proper SDK pattern)
    if (req.method === "POST" && path === "checkout") {
      const authHeader = req.headers.get("Authorization");
      
      // Optional: Validate JWT for authenticated users
      let userId: string | null = null;
      if (authHeader) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      }

      const body = await req.json();
      const { plan_id, redirect_url, price, plan_type } = body;

      if (!plan_id) {
        return new Response(
          JSON.stringify({ error: "plan_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`[whop-products] Creating checkout config for plan: ${plan_id}, user: ${userId || "anonymous"}`);

      // Use checkoutConfigurations.create pattern from Whop SDK
      // This creates a checkout configuration that returns a purchase URL
      const checkoutResponse = await fetch(
        "https://api.whop.com/api/v5/checkout_configurations",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${WHOP_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_id: WHOP_COMPANY_ID,
            plan_id: plan_id,
            redirect_url: redirect_url || "https://drebuilds.online/#/vault",
            metadata: userId ? { supabase_user_id: userId } : undefined,
          }),
        }
      );

      if (!checkoutResponse.ok) {
        const errorText = await checkoutResponse.text();
        console.error("[whop-products] Checkout config creation failed:", checkoutResponse.status, errorText);
        
        // Fallback: If checkout_configurations fails, use the plan's direct purchase URL
        console.log("[whop-products] Attempting fallback to direct checkout URL...");
        
        const planResponse = await fetch(
          `https://api.whop.com/api/v2/plans/${plan_id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${WHOP_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (planResponse.ok) {
          const planData = await planResponse.json();
          if (planData.purchase_url) {
            console.log("[whop-products] Using plan purchase_url as fallback");
            return new Response(
              JSON.stringify({
                checkout_url: planData.purchase_url,
                session_id: `fallback_${plan_id}`,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }

        return new Response(
          JSON.stringify({ error: "Failed to create checkout configuration", details: errorText }),
          { status: checkoutResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const checkoutData = await checkoutResponse.json();
      console.log("[whop-products] Checkout configuration created:", checkoutData.id);

      return new Response(
        JSON.stringify({
          checkout_url: checkoutData.purchase_url || checkoutData.url || checkoutData.checkout_url,
          session_id: checkoutData.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[whop-products] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
