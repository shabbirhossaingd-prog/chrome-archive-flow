import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const PREFIX = "storage:";

export const toStorageRef = (
  path: string,
) => `${PREFIX}${path}`;


export function resolveSmartImageUrl(
  src: string | null | undefined,
) {
  if (!src) return "";

  if (!src.startsWith(PREFIX)) {
    return src;
  }

  const path =
    src.slice(
      PREFIX.length,
    );

  if (!path) {
    return "";
  }

  const { data } =
    supabase.storage
      .from(
        "product-images",
      )
      .getPublicUrl(
        path,
      );

  return (
    data.publicUrl ?? ""
  );
}


export function absoluteSmartImageUrl(
  src: string | null | undefined,
  origin =
    "https://zzerkoff.vercel.app",
) {
  const resolved =
    resolveSmartImageUrl(
      src,
    );

  if (!resolved) {
    return `${origin}/images/zzerkoff-logo.png`;
  }

  if (
    /^https?:\/\//i.test(
      resolved,
    )
  ) {
    return resolved;
  }

  return `${origin}${
    resolved.startsWith("/")
      ? ""
      : "/"
  }${resolved}`;
}


export function SmartImage({
  src,
  alt,
  className,
  width,
  height,
  eager = false,
}: {
  src:
    | string
    | null
    | undefined;

  alt: string;

  className?: string;

  width?: number;

  height?: number;

  eager?: boolean;
}) {
  const resolved =
    useMemo(
      () =>
        resolveSmartImageUrl(
          src,
        ),
      [src],
    );


  const [
    failed,
    setFailed,
  ] =
    useState(false);


  useEffect(() => {
    setFailed(false);
  }, [resolved]);


  if (
    !resolved ||
    failed
  ) {
    return (
      <div
        className={cn(
          "relative grid place-items-center overflow-hidden bg-white/[0.03]",
          className,
        )}
        aria-label={alt}
        role="img"
      >
        <span className="select-none text-[8px] uppercase tracking-[0.28em] text-muted-foreground/60">
          ZZERKOFF
        </span>
      </div>
    );
  }


  return (
    <img
      src={resolved}
      alt={alt}

      width={width}
      height={height}

      loading={
        eager
          ? "eager"
          : "lazy"
      }

      fetchPriority={
        eager
          ? "high"
          : "low"
      }

      decoding="async"

      onError={() =>
        setFailed(true)
      }

      className={className}

      style={{
        contentVisibility:
          eager
            ? "visible"
            : "auto",
      }}
    />
  );
}
