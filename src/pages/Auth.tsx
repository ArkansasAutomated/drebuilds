import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useWhopUser } from "@/hooks/useWhopUser";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { Terminal, ArrowLeft } from "lucide-react";

const authSchema = z.object({
  email: z.string().trim().email("Invalid email format").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
});

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { user, signIn, signUp, isLoading } = useAuth();
  const { initiateWhopOAuth } = useWhopUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/admin");
    }
  }, [user, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      setError(`> auth.error: ${validation.error.errors[0].message}`);
      return;
    }

    setIsSubmitting(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        setError(`> auth.failed: ${error.message}`);
      }
    } else {
      const { error } = await signUp(email, password);
      if (error) {
        if (error.message.includes("already registered")) {
          setError("> auth.error: user.already_exists");
        } else {
          setError(`> auth.failed: ${error.message}`);
        }
      } else {
        setSuccessMessage("> auth.success: account_created ✓");
        setIsLogin(true);
      }
    }

    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="font-mono text-primary flex items-center gap-2">
          <span>&gt; loading_session</span>
          <BlinkingCursor />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", ...springConfig }}
      >
        {/* Back Link */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-mono text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>&gt; cd ..</span>
        </button>

        {/* Auth Card */}
        <div className="relative p-8 bg-card border border-border rounded-sm group">
          <CornerAccent position="tl" size={24} />
          <CornerAccent position="br" size={24} />

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 flex items-center justify-center bg-surface-elevated rounded-sm border border-primary/30">
              <Terminal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-mono text-lg text-foreground">
                &gt; BUILDER_LOGIN
              </h1>
              <p className="font-mono text-xs text-muted-foreground">
                // {isLogin ? "authenticate" : "register"}_session
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">
                  &gt; email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-sm px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="builder@domain.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="font-mono text-xs text-muted-foreground">
                  &gt; password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-elevated border border-border rounded-sm px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.p
                className="font-mono text-sm text-destructive"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {error}
              </motion.p>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.p
                className="font-mono text-sm text-success"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                {successMessage}
              </motion.p>
            )}

            {/* Submit Button */}
            <TextSwapButton
              type="submit"
              defaultText={isSubmitting ? "Processing..." : (isLogin ? "Login" : "Register")}
              hoverText={isSubmitting ? "> processing..." : (isLogin ? "auth.login()" : "auth.register()")}
              variant="primary"
              size="md"
              className="w-full"
            />
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground font-mono">
                // or
              </span>
            </div>
          </div>

          {/* Whop OAuth Button */}
          <TextSwapButton
            type="button"
            defaultText="[ CONNECT_WHOP ]"
            hoverText="> run oauth.sh"
            variant="outline"
            size="md"
            className="w-full"
            onClick={initiateWhopOAuth}
          />

          {/* Toggle Auth Mode */}
          <div className="mt-6 pt-6 border-t border-border">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccessMessage(null);
              }}
              className="w-full font-mono text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>&gt; new_builder? <span className="text-primary">register()</span></>
              ) : (
                <>&gt; existing_builder? <span className="text-primary">login()</span></>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
