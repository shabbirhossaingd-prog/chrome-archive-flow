import { Link } from "@tanstack/react-router";
import zzLogo from "@/assets/zz-logo.jpg.asset.json";
import { LiquidChrome } from "./LiquidChrome";
import { SITE, whatsappUrl } from "@/lib/site-config";

const LINKS = [
  { label: "SHOP", to: "/shop" as const },
  { label: "NEW COLLECTION", to: "/collection" as const },
  { label: "ARCHIVE", to: "/archive" as const },
  { label: "ABOUT", to: "/about" as const },
  { label: "CONTACT", to: "/contact" as const },
];

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden pt-32">
      <LiquidChrome className="-bottom-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2" opacity={0.14} />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center">
          <img
            src={zzLogo.url}
            alt="ZZERKOFF chrome monogram"
            loading="lazy"
            width={220}
            height={220}
            className="w-32 animate-float-slow mix-blend-lighten contrast-125 sm:w-44"
          />
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
            >
              INSTAGRAM
            </a>
            <a
              href={whatsappUrl(`Hi ${SITE.brand},`)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
            >
              WHATSAPP
            </a>
            <a
              href={`mailto:${SITE.email}`}
              className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
            >
              EMAIL
            </a>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-3 border-t border-border/50 py-8 text-[10px] uppercase tracking-[0.4em] text-muted-foreground sm:flex-row sm:justify-between">
          <span>{SITE.location}</span>
          <span className="font-editorial text-xs normal-case italic tracking-[0.2em] text-chrome/70">
            {SITE.tagline}
          </span>
          <span>© 2026 {SITE.brand}</span>
        </div>
      </div>

      <div className="relative -mt-4 overflow-hidden">
        <p className="chrome-text pointer-events-none select-none whitespace-nowrap text-center font-display text-[19vw] leading-[0.8] opacity-[0.13]">
          ZZERKOFF
        </p>
      </div>
    </footer>
  );
}
