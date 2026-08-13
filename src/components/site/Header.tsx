import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Instagram, Menu, X } from "lucide-react";
import { SmartImage } from "./SmartImage";
import { formatPrice, matchesSearch, useProducts } from "@/lib/products";
import { SITE } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "SHOP", to: "/shop" as const },
  { label: "NEW COLLECTION", to: "/collection" as const },
  { label: "ARCHIVE", to: "/archive" as const },
  { label: "ABOUT", to: "/about" as const },
  { label: "CONTACT", to: "/contact" as const },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data: products = [] } = useProducts();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const results = products.filter((p) => matchesSearch(p, q));

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <div
          className={cn(
            "glass-panel mx-auto flex max-w-7xl items-center gap-4 rounded-3xl px-4 py-3 transition-all duration-700 sm:px-6",
            scrolled ? "bg-black/60" : "bg-black/25",
          )}
        >
          <Link to="/" className="font-display text-[13px] tracking-[0.32em] text-foreground sm:text-sm">
            ZZERKOFF
          </Link>

          <nav className="mx-auto hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                activeProps={{ className: "text-foreground" }}
                className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground transition-colors duration-500 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground"
            >
              <Search className="size-4" />
            </button>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground"
            >
              <Instagram className="size-4" />
            </a>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen(true)}
              className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground lg:hidden"
            >
              <Menu className="size-4" />
            </button>
          </div>
        </div>
      </header>

      {/* FULLSCREEN SEARCH */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-2xl">
          <div className="grain-overlay" />
          <div className="mx-auto flex h-full max-w-3xl flex-col px-5 pt-28 sm:px-8">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                SEARCH THE ARCHIVE
              </span>
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="grid size-10 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="NAME / CODE / CATEGORY"
              className="mt-10 w-full border-b border-border/60 bg-transparent pb-5 font-display text-xl tracking-[0.2em] text-foreground outline-none placeholder:text-muted-foreground focus:border-chrome/60 sm:text-3xl"
            />
            <div className="mt-8 flex-1 overflow-y-auto pb-16">
              {q.trim() && results.length === 0 && (
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  No objects found
                </p>
              )}
              <ul className="space-y-3">
                {results.map((p) => (
                  <li key={p.id}>
                    <Link
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onClick={() => {
                        setSearchOpen(false);
                        setQ("");
                      }}
                      className="glass-panel flex items-center gap-5 rounded-2xl p-3 transition-colors hover:border-chrome/60"
                    >
                      <SmartImage
                        src={p.primary_image}
                        alt={p.name}
                        width={120}
                        height={120}
                        className="size-16 shrink-0 rounded-xl object-cover grayscale"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[9px] tracking-[0.4em] text-muted-foreground">
                          {p.product_code}
                        </span>
                        <span className="mt-1 block truncate text-[11px] uppercase tracking-[0.3em] text-foreground">
                          {p.name}
                        </span>
                      </span>
                      <span className="text-[11px] tracking-[0.2em] text-chrome">
                        {formatPrice(p.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-2xl lg:hidden">
          <div className="grain-overlay" />
          <div className="flex h-full flex-col px-5 pt-28 sm:px-8">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="ml-auto grid size-10 place-items-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <nav className="mt-12 flex flex-col gap-8">
              {NAV.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-xl tracking-[0.3em] text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-auto pb-16 text-[10px] uppercase tracking-[0.45em] text-muted-foreground"
            >
              INSTAGRAM {SITE.instagramHandle}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
