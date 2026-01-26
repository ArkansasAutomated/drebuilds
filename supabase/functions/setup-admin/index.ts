import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get admin credentials from secrets (not hardcoded)
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    const adminPassword = Deno.env.get("ADMIN_PASSWORD");
    
    if (!adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "ADMIN_EMAIL and ADMIN_PASSWORD secrets must be configured" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user already exists by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users.find((u: any) => u.email === adminEmail);

    if (existingUser) {
      console.log("User exists, updating password...");
      
      // Update password to ensure it matches
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: adminPassword, email_confirm: true }
      );

      if (updateError) {
        console.error("Password update error:", updateError);
        throw updateError;
      }

      console.log("Password updated successfully");

      // Ensure admin role exists (upsert to avoid duplicates)
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert(
          { user_id: existingUser.id, role: "admin" },
          { onConflict: "user_id,role", ignoreDuplicates: true }
        );

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Role assignment error:", roleError);
        throw roleError;
      }

      console.log("Admin role verified");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Admin password reset and role verified",
          userId: existingUser.id 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new admin user if doesn't exist
    console.log("Creating new admin user...");
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("User creation failed - no user returned");
    }

    console.log("User created:", authData.user.id);

    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: authData.user.id, role: "admin" });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      throw roleError;
    }

    console.log("Admin role assigned successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin user created and role assigned",
        userId: authData.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Setup admin error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
