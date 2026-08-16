import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { CategoryCard } from "@/components/site/CategoryCard";
import { ProductGrid } from "@/components/site/ProductGrid";
import { useCategories, useProducts } from "@/lib/products";
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
  show_categories?: boolean;
  per_section?: number;
};

function ShopPage() {
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();
  const { page } = usePage("shop");
  const json = pageJson<ShopJson>(page);
  const [active, setActive] = useState<string>("all");

  const filters = [{ slug: "all", name: "ALL" }, ...categories];
  const filtered = active === "all" ? products : products.filter((p) => p.category === active);
  const perSection = Math.max(1, Number(json.per_section ?? 100));
  const visible = filtered.slice(0, perSection);
  const showCategories = json.show_categories ?? true;
  const showFilters = json.show_filters ?? true;

  return (
    <PageShell>
      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-left-40 top-10 h-[36rem] w-[36rem]" opacity={0.16} />
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <PageHeading
              label={page?.label || "ZZERKOFF / OBJECT DIRECTORY"}
              title={page?.title || "SHOP THE OBJECTS"}
            />
            {page?.subtitle && (
              <p className="mt-6 max-w-2xl font-editorial text-lg italic text-muted-foreground">
                {page.subtitle}
              </p>
            )}
          </Reveal>

          {showCategories && (
            <div className="mt-14 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c, i) => (
                <Reveal key={c.slug} delay={i * 110}>
                  <CategoryCard
                    category={c}
                    index={i}
                    count={products.filter((p) => p.category === c.slug).length}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="relative px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          {showFilters && (
            <Reveal className="flex flex-wrap items-center gap-x-6 gap-y-3 border-y border-border/50 py-5">
              {filters.map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => setActive(f.slug)}
                  className={`text-[10px] uppercase tracking-[0.4em] transition-colors duration-500 ${
                    active === f.slug
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-chrome"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </Reveal>
          )}

          <div className={showFilters ? "mt-12" : ""}>
            <ProductGrid products={visible} loading={isLoading} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
