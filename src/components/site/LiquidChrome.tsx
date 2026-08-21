import type { CSSProperties } from "react";
import chromeBlob from "@/assets/chrome-blob.webp";
import "@/performance.css";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  opacity?: number;
  flip?: boolean;
  blur?: number;
  priority?: boolean;
};

export function LiquidChrome({
  className,
  opacity = 0.22,
  flip = false,
  blur = 22,
  priority = false,
}: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -z-10 select-none",
        className,
      )}
      style={{
        contain: "paint",
      }}
    >
      <img
        src={chromeBlob}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className="liquid-chrome-image h-full w-full object-cover animate-drift"
        style={
          {
            opacity,
            "--liquid-blur": `${blur}px`,
            transform: flip
              ? "scaleX(-1)"
              : undefined,

            maskImage:
              "radial-gradient(closest-side, #000 45%, transparent 100%)",

            WebkitMaskImage:
              "radial-gradient(closest-side, #000 45%, transparent 100%)",

            mixBlendMode:
              "screen",

            willChange:
              "transform, opacity",
          } as CSSProperties
        }
      />
    </div>
  );
}

export function GrainField() {
  return (
    <div
      aria-hidden="true"
      className="grain-overlay -z-10"
    />
  );
}
