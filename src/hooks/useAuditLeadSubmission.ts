import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const INDUSTRY_OPTIONS = [
  "Retail",
  "Restaurant",
  "Professional Services",
  "Health & Wellness",
  "Real Estate",
  "Construction",
  "Legal",
  "Other",
] as const;

export const TEAM_SIZE_OPTIONS = ["Just Me", "2-5", "6-15", "16+"] as const;

export const TOOL_OPTIONS = [
  "Google Workspace",
  "QuickBooks",
  "CRM/HubSpot",
  "Scheduling App",
  "Social Media",
  "Email Marketing",
  "None",
] as const;

export const BOTTLENECK_OPTIONS = [
  "Lead Generation",
  "Customer Follow-Up",
  "Scheduling & Bookings",
  "Data Entry",
  "Customer Service",
  "Bookkeeping",
  "Marketing",
  "Other",
] as const;

export const CONTACT_METHOD_OPTIONS = ["Email", "Text", "Phone Call"] as const;

// ============================================================
// Zod schema — single source of truth for validation.
// ============================================================
export const auditLeadSchema = z.object({
  // Step 1
  business_name: z
    .string()
    .min(1, "Business name is required")
    .max(200, "Business name is too long")
    .trim(),
  industry: z.enum(INDUSTRY_OPTIONS, {
    errorMap: () => ({ message: "Pick an industry" }),
  }),
  team_size: z.enum(TEAM_SIZE_OPTIONS, {
    errorMap: () => ({ message: "Pick a team size" }),
  }),

  // Step 2
  current_tools: z
    .array(z.enum(TOOL_OPTIONS))
    .min(1, "Pick at least one tool (or 'None')"),
  biggest_bottleneck: z.enum(BOTTLENECK_OPTIONS, {
    errorMap: () => ({ message: "Pick a bottleneck" }),
  }),

  // Step 3
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(200, "Name is too long")
    .trim(),
  email: z
    .string()
    .email("Enter a valid email")
    .max(255, "Email is too long")
    .transform((v) => v.toLowerCase().trim()),
  phone: z
    .string()
    .min(7, "Enter a valid phone number")
    .max(30, "Phone number is too long")
    .trim(),
  preferred_contact_method: z.enum(CONTACT_METHOD_OPTIONS, {
    errorMap: () => ({ message: "Pick a contact method" }),
  }),
});

export type AuditLeadInput = z.input<typeof auditLeadSchema>;
export type AuditLeadPayload = z.output<typeof auditLeadSchema>;

export type SubmitStatus = "idle" | "loading" | "success" | "error";

interface SubmitResult {
  status: SubmitStatus;
  errorMessage?: string;
}

export const useAuditLeadSubmission = () => {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const submit = async (raw: AuditLeadInput): Promise<SubmitResult> => {
    setStatus("loading");
    setErrorMessage(undefined);

    const parsed = auditLeadSchema.safeParse(raw);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      const msg = first?.message ?? "Please review the form fields.";
      setStatus("error");
      setErrorMessage(msg);
      return { status: "error", errorMessage: msg };
    }

    const data = parsed.data;

    try {
      // Capture lightweight provenance for the admin panel.
      const insertPayload = {
        business_name: data.business_name,
        industry: data.industry,
        team_size: data.team_size,
        current_tools: data.current_tools,
        biggest_bottleneck: data.biggest_bottleneck,
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        preferred_contact_method: data.preferred_contact_method,
        source: "audit_page",
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      };

      const { error } = await supabase
        .from("audit_leads")
        .insert(insertPayload);

      if (error) {
        // Constraint violations: surface the most likely cause to the user.
        if (error.code === "23514") {
          const msg = "One of the fields failed validation. Please double-check your inputs.";
          setStatus("error");
          setErrorMessage(msg);
          return { status: "error", errorMessage: msg };
        }
        throw error;
      }

      setStatus("success");
      return { status: "success" };
    } catch (err) {
      console.error("Audit lead submission failed:", err);
      const msg =
        err instanceof Error
          ? `> connection.failed (${err.message})`
          : "> connection.failed";
      setStatus("error");
      setErrorMessage(msg);
      return { status: "error", errorMessage: msg };
    }
  };

  const reset = () => {
    setStatus("idle");
    setErrorMessage(undefined);
  };

  return { status, errorMessage, submit, reset };
};