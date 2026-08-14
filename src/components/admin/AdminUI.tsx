import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const adminField =
  "w-full rounded-xl border border-border/70 bg-black/40 px-4 py-3 text-xs tracking-[0.12em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chrome/60";
export const adminLabel = "mb-2 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className={adminLabel}>{label}</span>
      {children}
    </label>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "rounded-xl border px-4 py-3 text-[9px] uppercase tracking-[0.3em] transition-colors",
        checked
          ? "border-chrome/70 bg-white/[0.06] text-foreground"
          : "border-border/60 text-muted-foreground",
      )}
    >
      {label}
    </button>
  );
}

export function AdminButton({
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
        "rounded-xl border px-5 py-3 text-[9px] uppercase tracking-[0.35em] transition-colors disabled:opacity-50",
        tone === "primary" && "border-chrome/60 bg-white/[0.05] text-foreground hover:bg-white/[0.1]",
        tone === "danger" && "border-destructive/50 text-destructive hover:bg-destructive/10",
        tone === "default" && "border-border/60 text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}