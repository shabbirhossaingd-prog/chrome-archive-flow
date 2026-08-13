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
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts();

  const current = categories.find((c) => c.slug === category);
  const list = products.filter((p) => p.category === category);
  const index = categories.findIndex((c) => c.slug === category);

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
              loading={isLoading}
              empty="Objects for this series are still in the workshop."
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}