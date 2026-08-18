import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
        content: "The ZZERKOFF object directory. Limited chrome objects for the afterdark.",
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

function ShopPage() {
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading, error } = useProducts();
  const { page } = usePage("shop");
  const json = pageJson<ShopJson>(page);

  const [active, setActive] = useState("all");

  const filters = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(
        product.category,
        (counts.get(product.category) ?? 0) + 1,
      );
    }

    const visibleCategories = categories
      .filter((category) => (counts.get(category.slug) ?? 0) > 0)
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        count: counts.get(category.slug) ?? 0,
      }));

    const known = new Set(visibleCategories.map((category) => category.slug));

    for (const [slug, count] of counts.entries()) {
      if (!known.has(slug)) {
        visibleCategories.push({
          slug,
          name: prettyCategory(slug),
          count,
        });
      }
    }

    return [
      {
        slug: "all",
        name: "ALL",
        count: products.length,
      },
      ...visibleCategories,
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
              label={page?.label || "ZZ / DIRECTORY"}
              title={page?.title || "THE DIRECTORY"}
              sub={
                page?.subtitle ||
                "Every object is cast in limited numbers. Codes are permanent; stock is not."
              }
            />
          </Reveal>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          {(json.show_filters ?? true) && products.length > 0 && (
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
                    {filter.count}
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
            <div className={products.length > 0 ? "mt-12" : "mt-8"}>
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
