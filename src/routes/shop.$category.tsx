import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { ProductGrid } from "@/components/site/ProductGrid";
import { useCategories, useProducts } from "@/lib/products";

const pretty = (slug: string) => slug.replace(/-/g, " ").toUpperCase();

export const Route = createFileRoute("/shop/$category")({
  head: ({ params }) => {
    const title = `${pretty(params.category)} — ZZERKOFF`;
    const description = `ZZERKOFF ${pretty(params.category).toLowerCase()}: unisex chrome objects for the afterdark.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const current = categories.find((c) => c.slug === category);
  const list = products.filter((p) => p.category === category);
  const index = categories.findIndex((c) => c.slug === category);
  const loading = categoriesLoading || productsLoading;

  return (
    <PageShell>
      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-right-40 top-0 h-[34rem] w-[34rem]" opacity={0.15} flip />
        <div className="mx-auto max-w-7xl">
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Object directory
          </Link>

          {!loading && (!current || list.length === 0) ? (
            <div className="py-24 text-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                ZZ / DIRECTORY
              </span>
              <h1 className="mt-6 font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
                NOTHING HERE YET
              </h1>
              <p className="mx-auto mt-5 max-w-xl font-editorial text-lg text-muted-foreground">
                This object category is not currently available.
              </p>
              <Link
                to="/shop"
                className="mt-10 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.35em] text-foreground"
              >
                Back to directory
              </Link>
            </div>
          ) : (
            <>
              <Reveal className="mt-8">
                <PageHeading
                  label={`ZZ / OBJECT / ${String(index >= 0 ? index + 1 : 1).padStart(2, "0")}`}
                  title={current?.name ?? pretty(category)}
                  sub={`${list.length} ${list.length === 1 ? "object" : "objects"} in this series.`}
                />
              </Reveal>

              <div className="mt-16 pb-28">
                <ProductGrid
                  products={list}
                  loading={loading}
                  empty="Objects for this series are still in the workshop."
                />
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
