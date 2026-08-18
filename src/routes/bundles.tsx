import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Layers3 } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { SmartImage } from "@/components/site/SmartImage";
import { supabase } from "@/integrations/supabase/client";
import { isSoldOut, useProducts } from "@/lib/products";
import { useSite } from "@/lib/settings";
import { addCartItem } from "@/lib/commerce";

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Bundles — ZZERKOFF" },
      {
        name: "description",
        content: "ZZERKOFF curated object bundles and sets.",
      },
    ],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  const site = useSite();
  const { data: products = [], isLoading: productsLoading } = useProducts();

  const bundlesQuery = useQuery({
    queryKey: ["commerce-bundles-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_bundles")
        .select("*")
        .eq("active", true)
        .order("sort_order")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const bundles = (bundlesQuery.data ?? [])
    .map((bundle: any) => {
      const ids = (bundle.product_ids ?? []) as string[];
      const items = products.filter((product) => ids.includes(product.id));
      const available =
        ids.length > 0 &&
        items.length === ids.length &&
        items.every((product) => !isSoldOut(product));

      return { bundle, items, available };
    })
    .filter((entry: any) => entry.available);

  return (
    <PageShell>
      <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <PageHeading
            label="ZZERKOFF / CURATED SETS"
            title="BUNDLES"
            sub="Curated objects built as one look."
          />

          {bundlesQuery.error ? (
            <div className="glass-panel mt-12 rounded-[28px] p-10 text-center">
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Bundles could not load. Try refreshing.
              </p>
            </div>
          ) : !productsLoading &&
            !bundlesQuery.isLoading &&
            bundles.length === 0 ? (
            <div className="glass-panel mt-12 rounded-[28px] p-10 text-center">
              <Layers3 className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                No available bundles yet
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.34em] text-foreground"
              >
                Shop individual objects
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {bundles.map(({ bundle, items }: any) => {
                const hero =
                  bundle.hero_image ||
                  items[0]?.primary_image ||
                  "/images/zzerkoff-logo.png";

                return (
                  <article
                    key={bundle.id}
                    className="glass-panel overflow-hidden rounded-[28px]"
                  >
                    <div className="relative">
                      <SmartImage
                        src={hero}
                        alt={bundle.name}
                        width={1200}
                        height={900}
                        className="aspect-4/3 w-full object-cover grayscale"
                      />
                      <div className="grain-overlay" />
                      <span className="absolute left-5 top-5 rounded-full border border-border/60 bg-black/65 px-4 py-2 text-[8px] uppercase tracking-[0.3em] text-foreground backdrop-blur-md">
                        {bundle.code}
                      </span>
                    </div>

                    <div className="p-5 sm:p-6">
                      <h2 className="font-display text-lg tracking-[0.14em] text-foreground">
                        {bundle.name}
                      </h2>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        {bundle.description}
                      </p>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {items.map((product: any) => (
                          <Link
                            key={product.id}
                            to="/product/$slug"
                            params={{ slug: product.slug }}
                            className="rounded-full border border-border/50 px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
                          >
                            {product.product_code} · {product.name}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border/45 pt-5">
                        <span className="text-sm tracking-[0.12em] text-chrome">
                          {site.price(bundle.bundle_price)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            addCartItem({
                              key: `bundle:${bundle.id}`,
                              kind: "bundle",
                              id: bundle.id,
                              name: bundle.name,
                              code: bundle.code,
                              image: hero,
                              price: Number(bundle.bundle_price || 0),
                              quantity: 1,
                              productIds: bundle.product_ids ?? [],
                            });
                            toast.success("Bundle added to Cart.");
                          }}
                          className="rounded-full border border-chrome/50 bg-white/[0.035] px-6 py-4 text-[8px] uppercase tracking-[0.3em] text-foreground"
                        >
                          Add bundle to cart
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
