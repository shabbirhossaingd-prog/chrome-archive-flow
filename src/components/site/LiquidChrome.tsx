import type { CSSProperties } from "react";
import chromeBlob from "@/assets/chrome-blob.webp";
import "@/performance.css";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** 0 - 1 */
  opacity?: number;
  flip?: boolean;
  blur?: number;
};

/** Reusable decorative liquid chrome fragment. Purely presentational. */
export function LiquidChrome({
  className,
  opacity = 0.22,
  flip = false,
  blur = 22,
}: Props) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute -z-10 select-none", className)}
    >
      <img
        src={chromeBlob}
        alt=""
        loading="lazy"
        decoding="async"
        className="liquid-chrome-image h-full w-full object-cover animate-drift"
        style={
          {
            opacity,
            "--liquid-blur": `${blur}px`,
            transform: flip ? "scaleX(-1)" : undefined,
            maskImage:
              "radial-gradient(closest-side, #000 18%, rgba(0,0,0,0.45) 55%, transparent 92%)",
            WebkitMaskImage:
              "radial-gradient(closest-side, #000 18%, rgba(0,0,0,0.45) 55%, transparent 92%)",
            mixBlendMode: "screen",
          } as CSSProperties
        }
      />
    </div>
  );
}

export function GrainField() {
  return <div aria-hidden className="grain-overlay -z-10" />;
}
