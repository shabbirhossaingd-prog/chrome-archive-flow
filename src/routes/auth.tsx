import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Studio Access — ZZERKOFF" },
      { name: "description", content: "Private studio access for the ZZERKOFF team." },
      { property: "og:title", content: "Studio Access — ZZERKOFF" },
      { property: "og:description", content: "Private studio access for the ZZERKOFF team." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Minimum 6 characters").max(72),
});

const field =
  "w-full rounded-xl border border-border/70 bg-black/40 px-4 py-4 text-xs tracking-[0.15em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chrome/60";
const label = "mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your details");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/auth` },
        });
        if (error) throw error;
        toast.success("Account created. Signing you in…");
      }
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <section className="relative isolate px-5 pb-32 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-right-40 top-0 h-[34rem] w-[34rem]" opacity={0.14} flip />
        <div className="mx-auto max-w-md">
          <Reveal>
            <PageHeading label="PRIVATE / STUDIO ONLY" title="STUDIO ACCESS" />
          </Reveal>
          <Reveal delay={120}>
            <form onSubmit={submit} className="glass-panel mt-12 space-y-6 rounded-[26px] p-7">
              <div>
                <span className={label}>Email</span>
                <input
                  className={field}
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="STUDIO@ZZERKOFF"
                />
              </div>
              <div>
                <span className={label}>Password</span>
                <input
                  className={field}
                  type="password"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl border border-chrome/60 bg-white/[0.04] py-4 text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-50"
              >
                {busy ? "Working…" : mode === "signin" ? "Enter studio" : "Create access"}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="w-full text-[9px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {mode === "signin" ? "Need access? Create account" : "Have access? Sign in"}
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}