import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const erpField =
  "w-full rounded-2xl border border-border/60 bg-black/35 px-4 py-3.5 text-xs tracking-[0.08em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-chrome/60";

export function ErpLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-[8px] uppercase tracking-[0.34em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ErpPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "glass-panel rounded-[26px] border border-border/50 p-5 sm:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ErpMetric({
  label,
  value,
  note,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-panel rounded-[22px] border p-4 sm:p-5",
        emphasis
          ? "border-chrome/45 bg-white/[0.035]"
          : "border-border/45 bg-white/[0.015]",
      )}
    >
      <ErpLabel>{label}</ErpLabel>
      <p
        className={cn(
          "mt-3 font-display text-lg tracking-[0.1em] sm:text-xl",
          emphasis ? "text-chrome" : "text-foreground",
        )}
      >
        {value}
      </p>
      {note ? (
        <p className="mt-2 text-[9px] leading-relaxed tracking-[0.05em] text-muted-foreground">
          {note}
        </p>
      ) : null}
    </div>
  );
}

export function ErpButton({
  children,
  onClick,
  type = "button",
  disabled,
  tone = "default",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  tone?: "default" | "primary" | "danger";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-2xl border px-5 py-3.5 text-[8px] uppercase tracking-[0.3em] transition-colors disabled:opacity-50",
        tone === "primary" &&
          "border-chrome/55 bg-white/[0.05] text-foreground hover:bg-white/[0.09]",
        tone === "danger" &&
          "border-destructive/50 text-destructive hover:bg-destructive/10",
        tone === "default" &&
          "border-border/55 text-muted-foreground hover:border-chrome/40 hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
