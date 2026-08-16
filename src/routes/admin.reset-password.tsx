import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AuthShell,
  AuthSubmit,
  authField,
  authLabel,
} from "@/components/admin/AuthShell";

export const Route = createFileRoute("/admin/reset-password")({
  head: () => ({
    meta: [
      { title: "Set New Password — ZZERKOFF" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const checks = useMemo(
    () => ({
      length: password.length >= 10,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match: password.length > 0 && password === confirmPassword,
    }),
    [password, confirmPassword],
  );

  const valid = Object.values(checks).every(Boolean);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error("Complete all password requirements.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast.error("Your recovery session has expired. Request a new code.");
      navigate({ to: "/admin/forgot-password", replace: true });
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      toast.error(error.message || "Could not update password.");
      return;
    }

    setDone(true);
    toast.success("PASSWORD UPDATED");
  };

  if (done) {
    return (
      <AuthShell
        label="PRIVATE / STUDIO ONLY"
        title="PASSWORD UPDATED"
        intro="Your ZZERKOFF Studio password has been changed successfully."
      >
        <button
          type="button"
          onClick={() => navigate({ to: "/admin", replace: true })}
          className="w-full rounded-xl border border-chrome/60 bg-white/[0.04] py-4 text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:bg-white/[0.08]"
        >
          Return to admin
        </button>
      </AuthShell>
    );
  }

  const requirements = [
    ["length", "Minimum 10 characters"],
    ["upper", "Uppercase letter"],
    ["lower", "Lowercase letter"],
    ["number", "Number"],
    ["special", "Special character"],
    ["match", "Passwords match"],
  ] as const;

  return (
    <AuthShell
      label="PRIVATE / STUDIO ONLY"
      title="SET NEW PASSWORD"
      intro="Choose a strong new password for ZZERKOFF Studio."
    >
      <form onSubmit={submit} className="space-y-6">
        <div>
          <span className={authLabel}>New password</span>
          <div className="relative">
            <input
              className={`${authField} pr-14`}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              aria-label={show ? "Hide password" : "Show password"}
              onClick={() => setShow(!show)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <span className={authLabel}>Confirm new password</span>
          <input
            className={authField}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <div className="grid gap-2 rounded-xl border border-border/50 p-4">
          {requirements.map(([key, label]) => (
            <span
              key={key}
              className={`text-[8px] uppercase tracking-[0.25em] ${
                checks[key] ? "text-chrome" : "text-muted-foreground"
              }`}
            >
              {checks[key] ? "✓" : "—"} {label}
            </span>
          ))}
        </div>

        <AuthSubmit disabled={busy}>
          {busy ? "Updating…" : "Update password"}
        </AuthSubmit>
      </form>
    </AuthShell>
  );
}
