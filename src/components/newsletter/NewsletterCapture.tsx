import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { StatusDot } from "@/components/ui/StatusDot";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { TerminalConfetti } from "@/components/effects/TerminalConfetti";
import { useNewsletterSubscription } from "@/hooks/useNewsletterSubscription";
import { Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

export type NewsletterCaptureVariant = "full" | "compact";

interface NewsletterCaptureProps {
  /** Variant: "full" shows name + email; "compact" shows email-only inline. */
  variant?: NewsletterCaptureVariant;
  /** Slug of the newsletter list (defaults to "drebuilds_main"). */
  listSlug?: string;
  /** Source recorded against the subscription (defaults to "landing_page"). */
  source?: string;
  /** Heading shown above the form. Only used in "full" variant. */
  title?: React.ReactNode;
  /** Subtitle/description shown above the form. Only used in "full" variant. */
  subtitle?: React.ReactNode;
  /** Success state subtitle override. */
  successMessage?: string;
  /** Show privacy footer text. Defaults to true. */
  showPrivacyNote?: boolean;
  /** Optional additional CSS classes for the outer wrapper. */
  className?: string;
  /** Inline mode: removes the card wrapper and corner accents. */
  inline?: boolean;
}

/**
 * Reusable newsletter capture. Backed by useNewsletterSubscription so every
 * capture point — landing hero CTA, footer, future spoke sites — sends to
 * the same code path with the right list attribution.
 *
 * Variants:
 *   - full:    name + email with the full terminal aesthetic (card, confetti, corner accents)
 *   - compact: email-only inline form for tight slots (footer, secondary CTAs)
 */
export const NewsletterCapture = ({
  variant = "full",
  listSlug,
  source,
  title,
  subtitle,
  successMessage,
  showPrivacyNote = true,
  className,
  inline = false,
}: NewsletterCaptureProps) => {
  const isCompact = variant === "compact";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiOrigin, setConfettiOrigin] = useState({ x: 0, y: 0 });
  const formRef = useRef<HTMLFormElement>(null);

  const { subscribe, status, message, reset, listSlug: activeListSlug } =
    useNewsletterSubscription({
      listSlug,
      defaultSource: source ?? (isCompact ? "footer" : "landing_page"),
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (formRef.current) {
      const rect = formRef.current.getBoundingClientRect();
      setConfettiOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    const result = await subscribe({
      email,
      fullName: isCompact ? undefined : name || undefined,
      source: source ?? (isCompact ? "footer" : "landing_page"),
      metadata: {
        variant,
        captured_at: new Date().toISOString(),
      },
    });

    if (result.status === "success") {
      setShowConfetti(true);
      setEmail("");
      setName("");
      setTimeout(() => setShowConfetti(false), 2500);
    }
  };

  const handleTryAgain = () => {
    reset();
  };

  // ───────────────────────────── RENDER ─────────────────────────────

  const renderForm = () => (
    <>
      {/* Confetti Effect (full only — too noisy inline) */}
      {!isCompact && (
        <TerminalConfetti
          isActive={showConfetti}
          originX={confettiOrigin.x}
          originY={confettiOrigin.y}
        />
      )}

      {status === "idle" || status === "loading" ? (
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={cn(
            isCompact
              ? "flex flex-row gap-2 w-full"
              : "flex flex-col gap-4 max-w-md mx-auto",
          )}
        >
          {/* Name input — full variant only */}
          {!isCompact && (
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name (optional)"
                disabled={status === "loading"}
                maxLength={200}
                className="w-full pl-10 pr-4 py-3 bg-background border-2 border-primary/50 rounded-sm font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-amber-box transition-all disabled:opacity-50"
              />
            </div>
          )}

          <div className={cn("relative", isCompact ? "flex-1" : "")}>
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/60 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className={cn(
                "w-full pl-10 pr-4 bg-background border-2 border-primary/50 rounded-sm font-mono text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:glow-amber-box transition-all disabled:opacity-50",
                isCompact ? "py-2" : "py-3",
              )}
            />
          </div>

          {isCompact ? (
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-4 py-2 font-mono text-xs bg-primary text-primary-foreground hover:bg-primary-glow rounded-sm glow-amber-box disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          ) : (
            <TextSwapButton
              defaultText={status === "loading" ? "Processing..." : "Subscribe to the Log"}
              hoverText={status === "loading" ? "writing_to_db..." : "write_to_stdout"}
              variant="primary"
              size="md"
              type="submit"
            />
          )}
        </form>
      ) : status === "success" ? (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", ...springConfig }}
        >
          <StatusDot status="available" />
          <p className="font-mono text-primary">{message}</p>
          {successMessage && (
            <p className="text-sm text-muted-foreground">{successMessage}</p>
          )}
        </motion.div>
      ) : status === "duplicate" ? (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", ...springConfig }}
        >
          <StatusDot status="busy" />
          <p className="font-mono text-primary">{message}</p>
          <p className="text-sm text-muted-foreground">
            You're already on the list. Stay tuned.
          </p>
          <button
            onClick={handleTryAgain}
            className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
          >
            &gt; try_another_email<BlinkingCursor />
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", ...springConfig }}
        >
          <StatusDot status="offline" />
          <p className="font-mono text-destructive">{message}</p>
          <p className="text-sm text-muted-foreground">
            Something went wrong. Please try again.
          </p>
          <button
            onClick={handleTryAgain}
            className="text-xs text-muted-foreground hover:text-primary font-mono transition-colors"
          >
            &gt; retry_connection<BlinkingCursor />
          </button>
        </motion.div>
      )}

      {/* Privacy Note */}
      {showPrivacyNote && status !== "success" && (
        <p className={cn(
          "text-xs text-muted-foreground",
          isCompact ? "mt-1.5" : "mt-6",
        )}>
          <span className="font-mono text-primary/60">$</span> We respect your privacy. Unsubscribe anytime.
        </p>
      )}
    </>
  );

  // ───────────────────────────── LAYOUTS ─────────────────────────────

  if (isCompact) {
    return (
      <div className={cn("w-full", className)}>
        <div className="font-mono text-xs text-muted-foreground mb-1.5">
          &gt; subscribe_to <span className="text-primary">{activeListSlug}</span>
        </div>
        {renderForm()}
      </div>
    );
  }

  // Full variant — terminal card with corners + heading
  if (inline) {
    return (
      <div className={cn("w-full", className)}>
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {renderForm()}
      </div>
    );
  }

  return (
    <div className={cn(
      "relative p-8 md:p-12 bg-card border border-border rounded-sm",
      className,
    )}>
      <CornerAccent position="tl" size={28} />
      <CornerAccent position="br" size={28} />

      <div className="text-center">
        <motion.div
          className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-sm mb-6"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", ...springConfig, delay: 0.2 }}
        >
          <Mail className="w-8 h-8 text-primary" />
        </motion.div>

        {title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {subtitle}
          </p>
        )}

        {renderForm()}
      </div>
    </div>
  );
};