import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhopPayment {
  id: string;
  amount: number;
  status: string;
  created_at: number;
  currency: string;
}

interface WhopPaymentsResponse {
  data: WhopPayment[];
  pagination?: {
    current_page: number;
    total_page: number;
  };
}

interface DailyRevenue {
  date: string;
  amount: number;
  count: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user and verify admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[whop-revenue] Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role using the has_role function
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      console.warn(`[whop-revenue] Non-admin access attempt by user: ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const WHOP_API_KEY = Deno.env.get("WHOP_API_KEY");
    const WHOP_COMPANY_ID = Deno.env.get("WHOP_COMPANY_ID");

    if (!WHOP_API_KEY || !WHOP_COMPANY_ID) {
      console.error("[whop-revenue] Missing WHOP_API_KEY or WHOP_COMPANY_ID");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date range (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const createdAfter = Math.floor(thirtyDaysAgo.getTime() / 1000);

    console.log(`[whop-revenue] Fetching payments since ${thirtyDaysAgo.toISOString()}`);

    // Fetch payments from Whop API
    const response = await fetch(
      `https://api.whop.com/api/v5/company/payments?created_after=${createdAfter}&status=paid&per_page=100`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[whop-revenue] Whop API error:", response.status, errorText);
      
      // Return empty data structure for graceful degradation
      return new Response(
        JSON.stringify({
          dailyRevenue: [],
          totalRevenue: 0,
          averageDaily: 0,
          peakDay: { date: null, amount: 0 },
          paymentCount: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data: WhopPaymentsResponse = await response.json();
    console.log(`[whop-revenue] Fetched ${data.data?.length || 0} payments`);

    // Aggregate payments by day
    const dailyMap = new Map<string, DailyRevenue>();
    
    for (const payment of data.data || []) {
      if (payment.status !== "paid") continue;
      
      const date = new Date(payment.created_at * 1000).toISOString().split("T")[0];
      const amount = payment.amount / 100; // Convert cents to dollars

      if (dailyMap.has(date)) {
        const existing = dailyMap.get(date)!;
        existing.amount += amount;
        existing.count += 1;
      } else {
        dailyMap.set(date, { date, amount, count: 1 });
      }
    }

    // Convert to sorted array
    const dailyRevenue = Array.from(dailyMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Fill in missing days with zero revenue
    const filledRevenue: DailyRevenue[] = [];
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const existing = dailyRevenue.find((r) => r.date === dateStr);
      filledRevenue.push(existing || { date: dateStr, amount: 0, count: 0 });
    }

    // Calculate stats
    const totalRevenue = filledRevenue.reduce((sum, day) => sum + day.amount, 0);
    const averageDaily = totalRevenue / 30;
    const peakDay = filledRevenue.reduce(
      (max, day) => (day.amount > max.amount ? day : max),
      { date: null as string | null, amount: 0, count: 0 }
    );
    const paymentCount = (data.data || []).filter((p) => p.status === "paid").length;

    console.log(`[whop-revenue] Total: $${totalRevenue.toFixed(2)}, Avg: $${averageDaily.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        dailyRevenue: filledRevenue,
        totalRevenue,
        averageDaily,
        peakDay: { date: peakDay.date, amount: peakDay.amount },
        paymentCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[whop-revenue] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
