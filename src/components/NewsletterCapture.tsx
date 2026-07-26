import { FormEvent, useState } from "react";
import { TextSwapButton } from "@/components/ui/TextSwapButton";
import { StatusDot } from "@/components/ui/StatusDot";
import { useNewsletterSubscription } from "@/hooks/useNewsletterSubscription";

interface NewsletterCaptureProps {
  listSlug?: string;
  mode?: "compact" | "full";
}

export const NewsletterCapture = ({ listSlug = "drebuilds_main", mode = "compact" }: NewsletterCaptureProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const { subscribe, status, message, reset } = useNewsletterSubscription(listSlug);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await subscribe(email, fullName);
    if (result.status === "success") {
      setEmail("");
      setFullName("");
    }
  };

  if (!["idle", "loading"].includes(status)) {
    return (
      <div className="flex flex-col items-center gap-3">
        <StatusDot status={status === "success" ? "available" : status === "duplicate" ? "busy" : "offline"} />
        <p className={`font-mono text-sm ${status === "error" ? "text-destructive" : "text-primary"}`}>{message}</p>
        {status !== "success" && <button onClick={reset} className="font-mono text-xs text-muted-foreground hover:text-primary">&gt; try_again</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className={`mx-auto grid max-w-xl gap-3 ${mode === "compact" ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-2"}`}>
      {mode === "full" && <label className="space-y-2 text-left"><span className="font-mono text-xs text-muted-foreground">&gt; name</span><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-border bg-background px-4 py-3 font-mono text-sm outline-none focus:border-primary" /></label>}
      <label className="space-y-2 text-left"><span className={mode === "compact" ? "sr-only" : "font-mono text-xs text-muted-foreground"}>&gt; email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required className="w-full border border-primary/50 bg-background px-4 py-3 font-mono text-sm outline-none focus:border-primary" /></label>
      <TextSwapButton type="submit" disabled={status === "loading"} defaultText={status === "loading" ? "Processing..." : "Subscribe"} hoverText="write_to_list()" variant="primary" size="md" className={mode === "full" ? "sm:col-span-2" : ""} />
    </form>
  );
};
