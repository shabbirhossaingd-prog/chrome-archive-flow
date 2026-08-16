import type { ReactNode } from "react";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";

export function PolicyLayout({
  label,
  title,
  intro,
  children,
}: {
  label: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <PageShell>
      <main className="relative isolate mx-auto min-h-[70vh] max-w-5xl px-5 pb-28 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-left-40 top-10 h-[34rem] w-[34rem]" opacity={0.12} />
        <Reveal>
          <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
            {label}
          </span>
          <h1 className="mt-5 max-w-4xl font-display text-2xl tracking-[0.16em] text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-7 max-w-3xl font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {intro}
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="glass-panel mt-12 space-y-10 rounded-[28px] p-6 sm:p-10">
            {children}
          </div>
        </Reveal>
      </main>
    </PageShell>
  );
}

export function PolicySection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-sm tracking-[0.22em] text-foreground">{title}</h2>
      <div className="mt-4 space-y-3 text-xs leading-7 tracking-[0.05em] text-muted-foreground">
        {children}
      </div>
    </section>
  );
}
