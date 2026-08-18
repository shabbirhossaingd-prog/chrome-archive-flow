import { Link } from "@tanstack/react-router";
import { LiquidChrome } from "./LiquidChrome";
import { SITE } from "@/lib/site-config";
import { useSite } from "@/lib/settings";
import { useCommerceAvailability } from "@/lib/commerce-availability";

const BASE_LINKS = [
  { label: "SHOP", to: "/shop" as const },
  { label: "NEW COLLECTION", to: "/collection" as const },
  { label: "ARCHIVE", to: "/archive" as const },
  { label: "WISHLIST", to: "/wishlist" as const },
  { label: "ACCOUNT", to: "/account" as const },
  { label: "TRACK ORDER", to: "/track-order" as const },
  { label: "SHIPPING", to: "/shipping" as const },
  { label: "RETURNS", to: "/returns" as const },
  { label: "SIZE GUIDE", to: "/size-guide" as const },
  { label: "CARE GUIDE", to: "/care-guide" as const },
  { label: "FAQ", to: "/faq" as const },
  { label: "PRIVACY", to: "/privacy" as const },
  { label: "TERMS", to: "/terms" as const },
];

export function Footer() {
  const site = useSite();
  const { hasShopLooks, hasBundles } = useCommerceAvailability();

  const links = [
    BASE_LINKS[0],
    ...(hasShopLooks
      ? [{ label: "SHOP THE LOOK", to: "/shop-the-look" as const }]
      : []),
    ...(hasBundles ? [{ label: "BUNDLES", to: "/bundles" as const }] : []),
    ...BASE_LINKS.slice(1),
  ];

  return (
    <footer className="relative isolate overflow-hidden pt-32">
      <LiquidChrome
        className="-bottom-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2"
        opacity={0.14}
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-center">
          <img
            src="/images/zzerkoff-logo.webp"
            alt="ZZERKOFF chrome monogram"
            loading="lazy"
            decoding="async"
            width={220}
            height={220}
            className="w-32 animate-float-slow mix-blend-lighten contrast-125 sm:w-44"
          />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}

            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground transition-colors hover:text-foreground"
            >
              INSTAGRAM
            </a>

            <a
              href={site.wa(`Hi ${site.brand},`)}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground transition-colors hover:text-foreground"
            >
              WHATSAPP
            </a>

            <a
              href={site.emailHref}
              className="text-[10px] uppercase tracking-[0.36em] text-muted-foreground transition-colors hover:text-foreground"
            >
              EMAIL
            </a>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center gap-3 border-t border-border/50 py-8 text-[10px] uppercase tracking-[0.4em] text-muted-foreground sm:flex-row sm:justify-between">
          <span>{site.location}</span>
          <span className="font-editorial text-xs normal-case italic tracking-[0.2em] text-chrome/70">
            {SITE.tagline}
          </span>
          <span>© 2026 {site.brand}</span>
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
