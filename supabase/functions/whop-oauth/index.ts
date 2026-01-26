import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
};

// Expected redirect URI for validation
const EXPECTED_REDIRECT_URI = "https://drebuilds.online/#/auth/whop/callback";

// Token encryption utilities using AES-256-GCM
const encryptToken = async (token: string, keyHex: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  // Generate random IV (12 bytes for GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from hex string (must be 32 bytes / 64 hex chars for AES-256)
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

const decryptToken = async (encryptedToken: string, keyHex: string): Promise<string> => {
  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedToken).split("").map(c => c.charCodeAt(0))
    );
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    // Derive key from hex string
    const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    // Return original if decryption fails (for backward compatibility with unencrypted tokens)
    console.warn("Token decryption failed, may be unencrypted legacy token");
    return encryptedToken;
  }
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  
  if (isRateLimited(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ success: false, error: "Too many requests. Please try again later." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { code, redirect_uri } = await req.json();

    // Security logging
    console.log({
      timestamp: new Date().toISOString(),
      ip: clientIp,
      action: "whop_oauth_attempt",
      has_code: !!code,
      redirect_uri: redirect_uri,
    });

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization code is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate redirect_uri matches expected value
    if (redirect_uri && redirect_uri !== EXPECTED_REDIRECT_URI) {
      console.warn(`Invalid redirect_uri attempt: ${redirect_uri}`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid redirect URI" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const clientId = Deno.env.get("WHOP_CLIENT_ID");
    const clientSecret = Deno.env.get("WHOP_API_KEY");
    const targetCompanyId = Deno.env.get("WHOP_COMPANY_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");

    if (!clientId || !clientSecret) {
      console.error("Missing WHOP_CLIENT_ID or WHOP_API_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "OAuth credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!encryptionKey || encryptionKey.length !== 64) {
      console.error("TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
      return new Response(
        JSON.stringify({ success: false, error: "Token encryption not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Exchanging authorization code for access token...");

    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log("Token exchange response status:", tokenResponse.status);

    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: tokenData.error_description || tokenData.error || "Failed to obtain access token" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Access token obtained, fetching user info...");

    // 2. Fetch user info from Whop
    const userInfoResponse = await fetch("https://api.whop.com/oauth/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userInfo = await userInfoResponse.json();
    console.log("User info response status:", userInfoResponse.status);

    if (!userInfo.id) {
      console.error("Failed to fetch user info:", userInfo);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch user information" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Whop user ID:", userInfo.id, "Username:", userInfo.username);

    // 3. Extract company IDs and plan IDs from memberships
    const companyIds: string[] = [];
    const planIds: string[] = [];
    
    if (userInfo.memberships && Array.isArray(userInfo.memberships)) {
      for (const membership of userInfo.memberships) {
        if (membership.company_id && !companyIds.includes(membership.company_id)) {
          companyIds.push(membership.company_id);
        }
        if (membership.plan_id && !planIds.includes(membership.plan_id)) {
          planIds.push(membership.plan_id);
        }
      }
    }

    // Also check company_ids array if provided directly
    if (userInfo.company_ids && Array.isArray(userInfo.company_ids)) {
      for (const cid of userInfo.company_ids) {
        if (!companyIds.includes(cid)) {
          companyIds.push(cid);
        }
      }
    }

    console.log("Company IDs:", companyIds);
    console.log("Plan IDs:", planIds);

    // 4. Check if user belongs to the target company
    const hasAdminAccess = targetCompanyId ? companyIds.includes(targetCompanyId) : false;
    console.log("Has admin access:", hasAdminAccess, "Target company:", targetCompanyId);

    // 5. Create Supabase admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 6. Check if a Supabase user with this Whop ID exists
    let userId: string;

    const { data: existingWhopUser } = await supabase
      .from("whop_users")
      .select("user_id")
      .eq("whop_user_id", userInfo.id)
      .maybeSingle();

    if (existingWhopUser) {
      // User already linked, update their tokens
      userId = existingWhopUser.user_id;
      console.log("Existing Whop user found, updating tokens for user:", userId);

      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
      const encryptedRefreshToken = tokenData.refresh_token 
        ? await encryptToken(tokenData.refresh_token, encryptionKey) 
        : null;

      await supabase
        .from("whop_users")
        .update({
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          company_ids: companyIds,
          plan_ids: planIds,
          username: userInfo.username || null,
          email: userInfo.email || null,
          profile_pic_url: userInfo.profile_pic_url || null,
          metadata: {
            plan_ids: planIds,
            memberships: userInfo.memberships || [],
            last_synced: new Date().toISOString(),
            tokens_encrypted: true,
          },
        })
        .eq("whop_user_id", userInfo.id);
    } else {
      // Create new Supabase user with Whop email
      const whopEmail = userInfo.email || `${userInfo.id}@whop.user`;
      const tempPassword = crypto.randomUUID();

      console.log("Creating new Supabase user for Whop user...");

      // Check if email already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === whopEmail);

      if (existingUser) {
        userId = existingUser.id;
        console.log("Email already exists in auth, linking to existing user:", userId);
      } else {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: whopEmail,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            whop_user_id: userInfo.id,
            username: userInfo.username,
            provider: "whop",
          },
        });

        if (createError) {
          console.error("Failed to create Supabase user:", createError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to create user account" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        userId = newUser.user.id;
        console.log("Created new Supabase user:", userId);
      }

      // Encrypt tokens before storing
      const encryptedAccessToken = await encryptToken(tokenData.access_token, encryptionKey);
      const encryptedRefreshToken = tokenData.refresh_token 
        ? await encryptToken(tokenData.refresh_token, encryptionKey) 
        : null;

      // Create whop_users record
      const { error: insertError } = await supabase
        .from("whop_users")
        .insert({
          user_id: userId,
          whop_user_id: userInfo.id,
          access_token: encryptedAccessToken,
          refresh_token: encryptedRefreshToken,
          company_ids: companyIds,
          plan_ids: planIds,
          username: userInfo.username || null,
          email: userInfo.email || null,
          profile_pic_url: userInfo.profile_pic_url || null,
          metadata: {
            plan_ids: planIds,
            memberships: userInfo.memberships || [],
            last_synced: new Date().toISOString(),
            tokens_encrypted: true,
          },
        });

      if (insertError) {
        console.error("Failed to insert whop_users record:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to link Whop account" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 7. If user has admin access via Whop company, grant admin role
    if (hasAdminAccess) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        console.log("Granting admin role to Whop user...");
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
      }
    }

    // 8. Generate a session for the user
    const { data: session, error: sessionError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: userInfo.email || `${userInfo.id}@whop.user`,
    });

    if (sessionError) {
      console.error("Failed to generate session link:", sessionError);
    }

    console.log("OAuth flow completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        whop_user: {
          id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email,
          profile_pic_url: userInfo.profile_pic_url,
        },
        hasAdminAccess,
        plan_ids: planIds,
        company_ids: companyIds,
        magic_link: session?.properties?.action_link || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Whop OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
