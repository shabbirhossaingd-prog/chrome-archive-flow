import type { ReactNode } from "react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";

export const authField =
  "w-full rounded-xl border border-border/70 bg-black/40 px-4 py-4 text-xs tracking-[0.15em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chrome/60";
export const authLabel =
  "mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground";

export function AuthShell({
  label,
  title,
  intro,
  children,
}: {
  label: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <section className="relative isolate px-5 pb-32 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-right-40 top-0 h-[34rem] w-[34rem]" opacity={0.14} flip />
        <div className="mx-auto max-w-md">
          <Reveal>
            <PageHeading label={label} title={title} />
          </Reveal>
          {intro && (
            <Reveal delay={80}>
              <p className="mt-6 text-[11px] leading-relaxed tracking-[0.14em] text-muted-foreground">
                {intro}
              </p>
            </Reveal>
          )}
          <Reveal delay={120}>
            <div className="glass-panel mt-10 space-y-6 rounded-[26px] p-7">{children}</div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}

export function AuthSubmit({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full rounded-xl border border-chrome/60 bg-white/[0.04] py-4 text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:bg-white/[0.08] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function AuthQuietButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full text-[9px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  );
}
