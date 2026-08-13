import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Menu, X } from "lucide-react";
import { products, formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "SHOP", to: "/", hash: "drop" },
  { label: "DROP 001", to: "/", hash: "drop" },
  { label: "ARCHIVE", to: "/", hash: "archive" },
  { label: "ABOUT", to: "/", hash: "about" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const results = q.trim()
    ? products.filter((p) => (p.name + p.category).toLowerCase().includes(q.trim().toLowerCase()))
    : [];

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
      <div
        className={cn(
          "glass-panel mx-auto flex max-w-7xl items-center gap-4 rounded-3xl px-4 py-3 transition-all duration-700 sm:px-6",
          scrolled ? "bg-black/60" : "bg-black/25",
        )}
      >
        <Link
          to="/"
          className="font-display text-[13px] tracking-[0.32em] text-foreground sm:text-sm"
        >
          ZZERKOFF
        </Link>

        <nav className="mx-auto hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              hash={item.hash}
              className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors duration-500 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground"
          >
            {searchOpen ? <X className="size-4" /> : <Search className="size-4" />}
          </button>
          <Link
            to="/"
            hash="drop"
            aria-label="Cart"
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground"
          >
            <ShoppingBag className="size-4" />
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-500 hover:text-foreground md:hidden"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-3xl bg-black/70 p-4">
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="SEARCH THE ARCHIVE"
            className="w-full bg-transparent text-[11px] uppercase tracking-[0.4em] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {results.length > 0 && (
            <ul className="mt-4 space-y-2 border-t border-border/60 pt-3">
              {results.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground"
                  >
                    <span>{p.name}</span>
                    <span>{formatPrice(p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {menuOpen && (
        <div className="glass-panel mx-auto mt-2 max-w-7xl rounded-3xl bg-black/70 p-6 md:hidden">
          <nav className="flex flex-col gap-5">
            {NAV.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                onClick={() => setMenuOpen(false)}
                className="text-xs uppercase tracking-[0.45em] text-muted-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}