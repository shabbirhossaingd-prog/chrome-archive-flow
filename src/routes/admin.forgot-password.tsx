import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, AuthSubmit, authField, authLabel } from "@/components/admin/AuthShell";

export const Route = createFileRoute("/admin/forgot-password")({
  head: () => ({
    meta: [
      { title: "Recover Access — ZZERKOFF" },
      { name: "description", content: "Recover access to the ZZERKOFF studio panel." },
      { property: "og:title", content: "Recover Access — ZZERKOFF" },
      { property: "og:description", content: "Recover access to the ZZERKOFF studio panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPassword,
});

const schema = z.string().trim().email().max(255);

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    // Errors are intentionally swallowed so the response never reveals
    // whether an account exists for this address.
    await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setBusy(false);
    toast.success("If an account exists for this email, a verification code has been sent.");
    navigate({ to: "/admin/verify-reset-code", search: { email: parsed.data } });
  };

  return (
    <AuthShell
      label="PRIVATE / STUDIO ONLY"
      title="RECOVER ACCESS"
      intro="Enter your administrator email and we'll send you a verification code."
    >
      <form onSubmit={submit} className="space-y-6">
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
        <AuthSubmit disabled={busy}>{busy ? "Sending…" : "Send code"}</AuthSubmit>
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
