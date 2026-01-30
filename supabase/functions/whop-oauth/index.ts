// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Allowed origins for CORS
// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  "https://drebuilds.online",
  "https://www.drebuilds.online",
  "https://drebuilds.lovable.app",
  "http://localhost:5173",
  "http://localhost:8080",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8080",
];

const getCorsHeaders = (origin: string | null) => {
  // Allow all origins for now to prevent CORS issues during dev/migration
  // In production, you might want to lock this down, but for hybrid local/remote dev it's safer to reflect
  const allowedOrigin = origin || ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Credentials": "true",
  };
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

// Expected redirect URIs for validation
// Expected redirect URIs for validation
const ALLOWED_REDIRECT_URIS = [
  "https://drebuilds.online/#/auth/whop/callback",
  "https://www.drebuilds.online/#/auth/whop/callback",
  "http://localhost:8080/#/auth/whop/callback",
  "http://localhost:5173/#/auth/whop/callback",
  "http://127.0.0.1:8080/#/auth/whop/callback",
  "http://127.0.0.1:5173/#/auth/whop/callback"
];

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
  // NOTE: No fallback - if decryption fails, users must re-authenticate
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { code, redirect_uri, code_verifier, grant_type } = await req.json();

    // Security logging
    console.log({
      timestamp: new Date().toISOString(),
      ip: clientIp,
      action: "whop_oauth_attempt",
      grant_type: grant_type || "authorization_code",
      has_code: !!code,
      redirect_uri: redirect_uri,
      has_verifier: !!code_verifier,
    });

    const clientId = Deno.env.get("WHOP_CLIENT_ID");
    const clientSecret = Deno.env.get("WHOP_API_KEY");
    const targetCompanyId = Deno.env.get("WHOP_COMPANY_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || req.headers.get("apikey") || ""; // Need anon key for user verification

    const isCodeGrant = !grant_type || grant_type === "authorization_code";

    if (isCodeGrant) {
      console.log("Diagnostic: Backend Exchange Parameters", {
        clientId: clientId,
        redirectUriReceived: redirect_uri,
        codeSnippet: code ? `${code.substring(0, 5)}...` : "missing",
        hasVerifier: !!code_verifier,
        verifierLength: code_verifier?.length
      });
    }

    if (!clientId || !clientSecret || !encryptionKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration missing" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // --- REFRESH TOKEN FLOW ---
    if (grant_type === "refresh_token") {
      // 1. Verify Requesting User
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify JWT manually or via getUser
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: userError } = await userClient.auth.getUser();

      if (userError || !user) {
        console.error("Invalid user token:", userError);
        return new Response(
          JSON.stringify({ success: false, error: "Invalid user session" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Refreshing token for user:", user.id);

      // 2. Fetch encrypted refresh token
      const { data: userData, error: fetchError } = await supabase
        .from("whop_users")
        .select("refresh_token")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !userData?.refresh_token) {
        return new Response(
          JSON.stringify({ success: false, error: "No refresh token found" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Decrypt refresh token
      let decryptedRefreshToken;
      try {
        decryptedRefreshToken = await decryptToken(userData.refresh_token, encryptionKey);
      } catch (err) {
        console.error("Decryption failed:", err);
        return new Response(
          JSON.stringify({ success: false, error: "Token decryption failed" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4. Call Whop API to refresh
      const refreshParams = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: decryptedRefreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });

      const refreshResponse = await fetch("https://api.whop.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: refreshParams,
      });

      const refreshData = await refreshResponse.json();

      if (!refreshData.access_token) {
        console.error("Whop refresh failed:", refreshData);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to refresh with provider" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 5. Encrypt and Update
      const newEncryptedAccess = await encryptToken(refreshData.access_token, encryptionKey);
      const newEncryptedRefresh = refreshData.refresh_token
        ? await encryptToken(refreshData.refresh_token, encryptionKey)
        : userData.refresh_token; // Keep old if not rotated (though Whop usually rotates)

      // Calculate new expires_at
      const expiresIn = refreshData.expires_in || 3600; // Default 1 hour
      const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();

      // We need to fetch current metadata to merge
      const { data: currentMeta } = await supabase
        .from("whop_users")
        .select("metadata")
        .eq("user_id", user.id)
        .single();

      const newMetadata = {
        ...(currentMeta?.metadata || {}),
        expires_at: expiresAt,
        last_synced: new Date().toISOString(),
      };

      await supabase
        .from("whop_users")
        .update({
          access_token: newEncryptedAccess,
          refresh_token: newEncryptedRefresh,
          metadata: newMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ success: true, expires_at: expiresAt }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- AUTHORIZATION CODE FLOW (DEFAULT) ---

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: "Authorization code is required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate redirect_uri matches allowed values
    if (redirect_uri && !ALLOWED_REDIRECT_URIS.includes(redirect_uri)) {
      console.warn(`Invalid redirect_uri attempt: ${redirect_uri}`);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid redirect URI" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // if (!clientId || !clientSecret) ... checked above

    console.log("Exchanging authorization code for access token...");

    // 1. Exchange code for access token using Body Params (per skill-whop-auth-setup.md)
    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
    });

    if (code_verifier) {
      tokenParams.append("code_verifier", code_verifier);
    }

    const tokenResponse = await fetch("https://api.whop.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: tokenParams,
    });

    const tokenData = await tokenResponse.json();
    console.log("Token exchange response status:", tokenResponse.status);

    if (!tokenData.access_token) {
      console.error("Token exchange failed DETAILS:", JSON.stringify(tokenData));
      return new Response(
        JSON.stringify({
          success: false,
          error: tokenData.error_description || tokenData.error || "Failed to obtain access token"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + (expiresIn * 1000)).toISOString();

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
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    // (Created above)

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
            expires_at: expiresAt, // Store expiry
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
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
            expires_at: expiresAt, // Store expiry
          },
        });

      if (insertError) {
        console.error("Failed to insert whop_users record:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to link Whop account" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        expires_at: expiresAt, // Return expiry to client
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Whop OAuth error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
