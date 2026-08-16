import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthSubmit, AuthQuietButton, authField, authLabel } from "@/components/admin/AuthShell";

export const Route = createFileRoute("/admin/verify-reset-code")({
  validateSearch: z.object({ email: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Verify Your Identity — ZZERKOFF" },
      { name: "description", content: "Verify the code sent to your ZZERKOFF administrator email." },
      { property: "og:title", content: "Verify Your Identity — ZZERKOFF" },
      { property: "og:description", content: "Verify the code sent to your ZZERKOFF administrator email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyResetCode,
});

const RESEND_SECONDS = 45;

function VerifyResetCode() {
  const { email: initialEmail } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    timer.current = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer.current);
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (!z.string().email().safeParse(email.trim()).success) {
      toast.error("Enter the email you requested the code for.");
      return;
    }
    if (token.length !== 6) {
      toast.error("Enter the 6-digit verification code.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token,
      type: "recovery",
    });
    setBusy(false);
    if (error) {
      const expired = /expire/i.test(error.message);
      toast.error(expired ? "This code has expired. Request a new one." : "Invalid verification code.");
      return;
    }
    navigate({ to: "/admin/reset-password", replace: true });
  };

  const resend = async () => {
    if (cooldown > 0) return;
    if (!z.string().email().safeParse(email.trim()).success) {
      toast.error("Enter a valid email address.");
      return;
    }
    setCooldown(RESEND_SECONDS);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    toast.success("If an account exists for this email, a new code has been sent.");
  };

  return (
    <AuthShell
      label="PRIVATE / STUDIO ONLY"
      title="VERIFY YOUR IDENTITY"
      intro="Enter the 6-digit verification code sent to your email."
    >
      <form onSubmit={verify} className="space-y-6">
        <div>
          <span className={authLabel}>Email address</span>
          <input
            className={authField}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="STUDIO@ZZERKOFF"
          />
        </div>
        <div>
          <span className={authLabel}>Verification code</span>
          <input
            className={`${authField} text-center text-lg tracking-[0.9em]`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="——————"
          />
        </div>
        <AuthSubmit disabled={busy}>{busy ? "Verifying…" : "Verify code"}</AuthSubmit>
        <AuthQuietButton onClick={resend} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </AuthQuietButton>
        <Link
          to="/admin/login"
          className="block text-center text-[9px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to login
        </Link>
      </form>
    </AuthShell>
  );
}
