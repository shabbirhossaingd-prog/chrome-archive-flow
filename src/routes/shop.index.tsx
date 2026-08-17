import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Layers3, ScanLine } from "lucide-react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { ProductGrid } from "@/components/site/ProductGrid";
import { useCategories, useProducts, prettyCategory } from "@/lib/products";
import { usePage, pageJson } from "@/lib/cms";

export const Route = createFileRoute("/shop/")({
  head: () => ({
    meta: [
      { title: "Shop the Objects — ZZERKOFF" },
      {
        name: "description",
        content:
          "The ZZERKOFF object directory: rings, bracelets, chains, pant chains, earrings and eyewear.",
      },
      { property: "og:title", content: "Shop the Objects — ZZERKOFF" },
      {
        property: "og:description",
        content: "Objects for the afterdark. Shop the ZZERKOFF directory.",
      },
    ],
  }),
  component: ShopPage,
});

type ShopJson = {
  show_filters?: boolean;
  per_section?: number;
};

const DEFAULT_FILTERS = [
  { slug: "rings", name: "RINGS" },
  { slug: "bracelets", name: "BRACELETS" },
  { slug: "chains", name: "CHAINS" },
  { slug: "pant-chains", name: "PANT CHAINS" },
  { slug: "earrings", name: "EARRINGS" },
  { slug: "eyewear", name: "EYEWEAR" },
];

function ShopPage() {
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading, error } = useProducts();
  const { page } = usePage("shop");
  const json = pageJson<ShopJson>(page);
  const [active, setActive] = useState("all");

  const filters = useMemo(() => {
    const map = new Map<string, string>();

    for (const row of DEFAULT_FILTERS) map.set(row.slug, row.name);
    for (const category of categories) map.set(category.slug, category.name);
    for (const product of products) {
      if (!map.has(product.category)) {
        map.set(product.category, prettyCategory(product.category));
      }
    }

    return [
      { slug: "all", name: "ALL" },
      ...Array.from(map.entries()).map(([slug, name]) => ({ slug, name })),
    ];
  }, [categories, products]);

  const filtered =
    active === "all"
      ? products
      : products.filter((product) => product.category === active);

  const visible = filtered.slice(
    0,
    Math.max(1, Number(json.per_section ?? 100)),
  );

  return (
    <PageShell>
      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome
          className="-left-40 top-10 h-[36rem] w-[36rem]"
          opacity={0.16}
        />
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <PageHeading
              label={page?.label || "ZZERKOFF / OBJECT DIRECTORY"}
              title={page?.title || "SHOP THE OBJECTS"}
              sub={page?.subtitle || "Published objects, live from the studio."}
            />
          </Reveal>

          <Reveal
            delay={100}
            className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-2xl"
          >
            <Link
              to="/shop-the-look"
              className="glass-panel flex items-center gap-4 rounded-[22px] p-4 transition-colors hover:border-chrome/50"
            >
              <ScanLine className="size-5 text-muted-foreground" />
              <div>
                <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
                  Styling
                </span>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground">
                  Shop the Look
                </p>
              </div>
            </Link>
            <Link
              to="/bundles"
              className="glass-panel flex items-center gap-4 rounded-[22px] p-4 transition-colors hover:border-chrome/50"
            >
              <Layers3 className="size-5 text-muted-foreground" />
              <div>
                <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">
                  Curated
                </span>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground">
                  Bundle Sets
                </p>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          {(json.show_filters ?? true) && (
            <Reveal className="flex gap-x-6 gap-y-3 overflow-x-auto border-y border-border/50 py-5 sm:flex-wrap">
              {filters.map((filter) => (
                <button
                  key={filter.slug}
                  type="button"
                  onClick={() => setActive(filter.slug)}
                  className={`shrink-0 text-[10px] uppercase tracking-[0.36em] transition-colors duration-500 ${
                    active === filter.slug
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-chrome"
                  }`}
                >
                  {filter.name}
                  <span className="ml-2 text-[8px] opacity-60">
                    {filter.slug === "all"
                      ? products.length
                      : products.filter(
                          (product) => product.category === filter.slug,
                        ).length}
                  </span>
                </button>
              ))}
            </Reveal>
          )}

          {error ? (
            <div className="glass-panel mt-12 rounded-[24px] p-8 text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                The object directory could not load. Try refreshing.
              </p>
            </div>
          ) : (
            <div className="mt-12">
              <ProductGrid
                products={visible}
                loading={isLoading}
                priorityCount={2}
                empty={
                  active === "all"
                    ? "No published objects yet."
                    : "No published objects in this category yet."
                }
              />
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
