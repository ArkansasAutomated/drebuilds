import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CornerAccent } from "@/components/decorative/CornerAccent";
import { BlinkingCursor } from "@/components/ui/BlinkingCursor";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusDot } from "@/components/ui/StatusDot";
import {
  AuditLeadInput,
  BOTTLENECK_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  INDUSTRY_OPTIONS,
  SubmitStatus,
  TEAM_SIZE_OPTIONS,
  TOOL_OPTIONS,
} from "@/hooks/useAuditLeadSubmission";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const springConfig = {
  mass: 1,
  stiffness: 120,
  damping: 14,
};

const STEP_LABELS = ["Your Business", "Your Pain", "Contact"] as const;

interface AuditFormProps {
  onSubmit: (data: AuditLeadInput) => Promise<{ status: SubmitStatus; errorMessage?: string }>;
  status: SubmitStatus;
  errorMessage?: string;
}

interface FormState {
  business_name: string;
  industry: string;
  team_size: string;
  current_tools: string[];
  biggest_bottleneck: string;
  full_name: string;
  email: string;
  phone: string;
  preferred_contact_method: string;
}

const EMPTY_FORM: FormState = {
  business_name: "",
  industry: "",
  team_size: "",
  current_tools: [],
  biggest_bottleneck: "",
  full_name: "",
  email: "",
  phone: "",
  preferred_contact_method: "",
};

export const AuditForm = ({ onSubmit, status, errorMessage }: AuditFormProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<FormState>(EMPTY_FORM);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setFieldError(null);
  };

  const toggleTool = (tool: string) => {
    setData((prev) => {
      const has = prev.current_tools.includes(tool);
      let next: string[];
      if (tool === "None") {
        // Selecting "None" clears other selections (mutually exclusive).
        next = has ? [] : ["None"];
      } else {
        next = has
          ? prev.current_tools.filter((t) => t !== tool)
          : [...prev.current_tools.filter((t) => t !== "None"), tool];
      }
      return { ...prev, current_tools: next };
    });
    setFieldError(null);
  };

  const validateStep = (s: 1 | 2 | 3): string | null => {
    if (s === 1) {
      if (!data.business_name.trim()) return "Business name is required.";
      if (!data.industry) return "Pick an industry.";
      if (!data.team_size) return "Pick a team size.";
    }
    if (s === 2) {
      if (data.current_tools.length === 0) return "Pick at least one tool (or 'None').";
      if (!data.biggest_bottleneck) return "Pick your biggest bottleneck.";
    }
    if (s === 3) {
      if (!data.full_name.trim()) return "Full name is required.";
      if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return "Enter a valid email address.";
      }
      if (!data.phone.trim() || data.phone.trim().length < 7) {
        return "Enter a valid phone number.";
      }
      if (!data.preferred_contact_method) return "Pick a preferred contact method.";
    }
    return null;
  };

  const next = () => {
    const err = validateStep(step);
    if (err) {
      setFieldError(err);
      return;
    }
    setFieldError(null);
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  };

  const back = () => {
    setFieldError(null);
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep(step);
    if (err) {
      setFieldError(err);
      return;
    }
    await onSubmit({
      business_name: data.business_name.trim(),
      industry: data.industry as AuditLeadInput["industry"],
      team_size: data.team_size as AuditLeadInput["team_size"],
      current_tools: data.current_tools as AuditLeadInput["current_tools"],
      biggest_bottleneck:
        data.biggest_bottleneck as AuditLeadInput["biggest_bottleneck"],
      full_name: data.full_name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      preferred_contact_method:
        data.preferred_contact_method as AuditLeadInput["preferred_contact_method"],
    });
  };

  const progressPct = useMemo(() => ((step - 1) / 2) * 100, [step]);

  return (
    <motion.div
      className="relative p-6 md:p-10 bg-card border border-border rounded-sm"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", ...springConfig }}
    >
      <CornerAccent position="tl" size={28} />
      <CornerAccent position="br" size={28} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 font-mono text-xs text-primary mb-2">
          <span>&gt;_ audit.intake</span>
          <StatusDot status={status === "error" ? "offline" : "available"} />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Tell us about your <span className="text-primary glow-amber">business</span>
          <BlinkingCursor />
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-2">
          step {step} / 3 &middot; {STEP_LABELS[step - 1]}
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-2">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = (idx + 1) as 1 | 2 | 3;
            const isDone = step > stepNum;
            const isCurrent = step === stepNum;
            return (
              <div
                key={label}
                className={
                  isCurrent
                    ? "text-primary"
                    : isDone
                      ? "text-success"
                      : "text-muted-foreground/50"
                }
              >
                [{stepNum}] {label.toLowerCase()}
              </div>
            );
          })}
        </div>
        <div className="h-1 bg-surface-elevated rounded-sm overflow-hidden border border-border">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ type: "spring", ...springConfig }}
          />
        </div>
      </div>

      {/* Steps */}
      <form onSubmit={handleSubmit} noValidate>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepFrame key="step-1">
              <div className="space-y-5">
                <FieldGroup label="Business name" required>
                  <Input
                    value={data.business_name}
                    onChange={(e) => update("business_name", e.target.value)}
                    placeholder="Acme Co."
                    maxLength={200}
                    className="font-mono"
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Industry" required>
                  <Select
                    value={data.industry}
                    onValueChange={(v) => update("industry", v)}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="-- pick_industry --" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>

                <FieldGroup label="Team size" required>
                  <Select
                    value={data.team_size}
                    onValueChange={(v) => update("team_size", v)}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="-- pick_team_size --" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
            </StepFrame>
          )}

          {step === 2 && (
            <StepFrame key="step-2">
              <div className="space-y-6">
                <FieldGroup label="Current tools (select all that apply)" required>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TOOL_OPTIONS.map((tool) => {
                      const checked = data.current_tools.includes(tool);
                      return (
                        <label
                          key={tool}
                          className="flex items-center gap-3 p-3 bg-surface-elevated border border-border rounded-sm cursor-pointer hover:border-primary/40 transition-colors"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleTool(tool)}
                            aria-label={tool}
                          />
                          <span className="font-mono text-sm">{tool}</span>
                        </label>
                      );
                    })}
                  </div>
                </FieldGroup>

                <FieldGroup label="Biggest bottleneck" required>
                  <Select
                    value={data.biggest_bottleneck}
                    onValueChange={(v) => update("biggest_bottleneck", v)}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="-- pick_bottleneck --" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOTTLENECK_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
            </StepFrame>
          )}

          {step === 3 && (
            <StepFrame key="step-3">
              <div className="space-y-5">
                <FieldGroup label="Full name" required>
                  <Input
                    value={data.full_name}
                    onChange={(e) => update("full_name", e.target.value)}
                    placeholder="Jane Doe"
                    maxLength={200}
                    className="font-mono"
                    autoFocus
                  />
                </FieldGroup>

                <FieldGroup label="Email" required>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="you@business.com"
                    maxLength={255}
                    className="font-mono"
                  />
                </FieldGroup>

                <FieldGroup label="Phone" required>
                  <Input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(479) 555-0100"
                    maxLength={30}
                    className="font-mono"
                  />
                </FieldGroup>

                <FieldGroup label="Preferred contact method" required>
                  <Select
                    value={data.preferred_contact_method}
                    onValueChange={(v) => update("preferred_contact_method", v)}
                  >
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="-- pick_contact_method --" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_METHOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="font-mono">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldGroup>
              </div>
            </StepFrame>
          )}
        </AnimatePresence>

        {/* Error display */}
        {fieldError && (
          <motion.p
            className="mt-4 font-mono text-xs text-destructive"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            &gt; {fieldError}
          </motion.p>
        )}
        {status === "error" && errorMessage && !fieldError && (
          <motion.p
            className="mt-4 font-mono text-xs text-destructive"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            &gt; {errorMessage}
          </motion.p>
        )}

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 1 ? (
            <TextSwapButton
              type="button"
              defaultText="Back"
              hoverText="cd .."
              variant="outline"
              size="md"
              icon={<ArrowLeft size={16} />}
              onClick={back}
            />
          ) : (
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-primary/60">$</span> step 1 of 3
            </span>
          )}

          {step < 3 ? (
            <TextSwapButton
              type="button"
              defaultText="Continue"
              hoverText="next_step()"
              variant="primary"
              size="md"
              icon={<ArrowRight size={16} />}
              onClick={next}
            />
          ) : (
            <TextSwapButton
              type="submit"
              defaultText={status === "loading" ? "Submitting..." : "Send My Audit Request"}
              hoverText={status === "loading" ? "writing_to_db..." : "submit.lead()"}
              variant="primary"
              size="md"
              icon={<Check size={16} />}
            />
          )}
        </div>
      </form>
    </motion.div>
  );
};

// ---------- Sub-components ----------

const StepFrame = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 30 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -30 }}
    transition={{ type: "spring", ...springConfig }}
  >
    {children}
  </motion.div>
);

const FieldGroup = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <Label className="font-mono text-xs text-muted-foreground">
      &gt; {label}
      {required && <span className="text-primary ml-1">*</span>}
    </Label>
    {children}
  </div>
);