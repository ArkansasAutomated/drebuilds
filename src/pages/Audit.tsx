import { useAuditLeadSubmission } from "@/hooks/useAuditLeadSubmission";
import { AuditHero } from "@/components/audit/AuditHero";
import { AuditForm } from "@/components/audit/AuditForm";
import { AuditSuccess } from "@/components/audit/AuditSuccess";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";

const Audit = () => {
  const { status, errorMessage, submit, reset } = useAuditLeadSubmission();

  return (
    <main className="relative min-h-screen bg-background bg-grid bg-noise">
      {/* Decorative background grid + noise */}

      <div className="relative z-10">
        {status !== "success" ? (
          <>
            <AuditHero />
            <section id="audit-form" className="py-16 md:py-24">
              <div className="container mx-auto px-6 max-w-3xl">
                <AuditForm onSubmit={submit} status={status} errorMessage={errorMessage} />
              </div>
            </section>
          </>
        ) : (
          <AuditSuccess onReset={reset} />
        )}

        {/* Footer hint */}
        <div className="container mx-auto px-6 max-w-3xl pb-12">
          <p className="font-mono text-xs text-muted-foreground text-center">
            <span className="text-primary/60">$</span> DREBUILDS &mdash; Arkansas AI Automation
            <BlinkingCursor className="align-middle" />
          </p>
        </div>
      </div>
    </main>
  );
};

export default Audit;