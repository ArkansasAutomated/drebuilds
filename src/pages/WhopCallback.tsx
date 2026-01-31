import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { TerminalTypingText } from "@/components/ui/TerminalTypingText";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { Terminal, CheckCircle, XCircle } from "lucide-react";

const getRedirectUri = () => {
  const origin = window.location.origin;
  // Use clean paths (no hash) for OAuth 2.1 compliance
  if (
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    origin === "https://drebuilds.online" ||
    origin === "https://www.drebuilds.online"
  ) {
    return `${origin}/auth/whop/callback`;
  }
  return "https://drebuilds.online/auth/whop/callback";
};

const WhopCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("initializing_oauth_flow");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const processingRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // With BrowserRouter, params come directly in window.location.search
      const urlParams = new URLSearchParams(window.location.search);

      // Read code from URL params (works correctly with BrowserRouter)
      const code = urlParams.get("code") || searchParams.get("code");
      const returnedState = urlParams.get("state") || searchParams.get("state");

      // Prevent double-execution (React Strict Mode or Remounts)
      if (!code || processingRef.current || window.sessionStorage.getItem(`whop_code_processed_${code}`)) {
        return;
      }
      processingRef.current = true;
      window.sessionStorage.setItem(`whop_code_processed_${code}`, "true");

      const error = urlParams.get("error") || searchParams.get("error");
      const errorDescription = urlParams.get("error_description") || searchParams.get("error_description");

      if (error) {
        console.error("OAuth error from Whop:", error, errorDescription);
        setStatus("error");
        setMessage("oauth_denied");
        setErrorDetail(errorDescription || error);
        return;
      }

      if (!code) {
        setStatus("error");
        setMessage("no_auth_code");
        setErrorDetail("Authorization code was not received from Whop");
        return;
      }

      // Validate state parameter for CSRF protection
      const savedState = window.sessionStorage.getItem("whop_oauth_state");
      if (!returnedState || returnedState !== savedState) {
        console.error("CSRF: State parameter mismatch", { returnedState, savedState });
        setStatus("error");
        setMessage("state_mismatch");
        setErrorDetail("Security validation failed. Please try again.");
        return;
      }
      window.sessionStorage.removeItem("whop_oauth_state");

      setMessage("exchanging_tokens");

      try {
        const codeVerifier = window.localStorage.getItem("whop_code_verifier");
        const origin = window.location.origin;
        const redirectUri = getRedirectUri();

        console.log("Diagnostic: Starting token exchange", {
          current_origin: origin,
          code_received: !!code,
          code_length: code?.length,
          verifier_present: !!codeVerifier,
          verifier_length: codeVerifier?.length,
          redirect_uri: redirectUri
        });

        if (!codeVerifier) {
          console.error("Critical: PKCE Verifier missing from storage. This will cause an invalid_grant error.");
        }

        // Call Edge Function to handle OAuth token exchange
        const { data, error: fnError } = await supabase.functions.invoke("whop-oauth", {
          body: {
            code,
            redirect_uri: redirectUri,
            code_verifier: codeVerifier, // Pass PKCE verifier
          },
        });

        // Clean up verifier
        window.localStorage.removeItem("whop_code_verifier");

        if (fnError) {
          console.error("Edge function error:", fnError);
          setStatus("error");
          setMessage("token_exchange_failed");
          setErrorDetail(fnError.message);
          return;
        }

        if (!data?.success) {
          console.error("OAuth failed:", data?.error);
          setStatus("error");
          setMessage("oauth_failed");
          setErrorDetail(data?.error || "Unknown error occurred");
          return;
        }

        setMessage("auth_successful");
        setStatus("success");

        // If we have a magic link, use it to sign in
        if (data.magic_link) {
          // Extract the token from magic link and sign in
          const url = new URL(data.magic_link);
          const token = url.searchParams.get("token");
          const type = url.searchParams.get("type");

          if (token && type === "magiclink") {
            const { error: signInError } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: "magiclink",
            });

            if (signInError) {
              console.error("Magic link sign in failed:", signInError);
              // Still redirect, user can sign in manually
            }
          }
        }

        // Short delay to show success, then redirect
        setTimeout(() => {
          if (data.hasAdminAccess) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }, 1500);
      } catch (err) {
        console.error("Callback handling error:", err);
        setStatus("error");
        setMessage("unexpected_error");
        setErrorDetail(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", mass: 1, stiffness: 120, damping: 14 }}
      >
        <div className="relative p-8 bg-card border border-border rounded-sm">
          <CornerAccent position="tl" size={24} />
          <CornerAccent position="br" size={24} />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-10 h-10 flex items-center justify-center rounded-sm border ${status === "processing"
              ? "bg-surface-elevated border-primary/30"
              : status === "success"
                ? "bg-success/10 border-success/30"
                : "bg-destructive/10 border-destructive/30"
              }`}>
              {status === "processing" && <Terminal className="w-5 h-5 text-primary" />}
              {status === "success" && <CheckCircle className="w-5 h-5 text-success" />}
              {status === "error" && <XCircle className="w-5 h-5 text-destructive" />}
            </div>
            <div>
              <h1 className="font-mono text-lg text-foreground">
                &gt; WHOP_OAUTH
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                // {status === "processing" ? "processing" : status === "success" ? "completed" : "failed"}
              </p>
            </div>
          </div>

          {/* Status Display */}
          <div className="space-y-4">
            <div className="font-mono text-sm text-foreground">
              {status === "processing" ? (
                <TerminalTypingText
                  text={`> ${message}`}
                  speed={20}
                  showCursor={true}
                />
              ) : (
                <span>&gt; {message}</span>
              )}
            </div>

            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-mono text-sm text-success"
              >
                &gt; redirecting...
              </motion.div>
            )}

            {status === "error" && errorDetail && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <p className="font-mono text-sm text-destructive">
                  &gt; error: {errorDetail}
                </p>
                <button
                  onClick={() => navigate("/auth")}
                  className="font-mono text-sm text-primary hover:underline"
                >
                  &gt; return_to_login()
                </button>
              </motion.div>
            )}
          </div>

          {/* Progress Indicator */}
          {status === "processing" && (
            <div className="mt-6 pt-6 border-t border-border">
              <div className="h-1 bg-surface-elevated rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3, ease: "easeInOut" }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default WhopCallback;
