import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { SmartImage } from "@/components/site/SmartImage";
import { supabase } from "@/integrations/supabase/client";
import { useProducts } from "@/lib/products";

export const Route = createFileRoute("/shop-the-look")({
  head: () => ({
    meta: [
      { title: "Shop the Look — ZZERKOFF" },
      {
        name: "description",
        content: "Curated ZZERKOFF looks built from rings, chains, bracelets and metal objects.",
      },
    ],
  }),
  component: ShopTheLookPage,
});

function ShopTheLookPage() {
  const { data: products = [], isLoading } = useProducts();
  const looksQuery = useQuery({
    queryKey: ["commerce-shop-looks-public"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_shop_looks")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const looks =
    (looksQuery.data ?? []).length > 0
      ? looksQuery.data ?? []
      : products.length >= 2
        ? [
            {
              id: "auto-look",
              title: "AFTERDARK SET",
              tagline: "A live edit from the current object directory.",
              image_url:
                products.find((product) => product.featured)?.primary_image ||
                products[0]?.primary_image ||
                "",
              product_ids: products.slice(0, 4).map((product) => product.id),
            },
          ]
        : [];

  return (
    <PageShell>
      <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <PageHeading
            label="ZZERKOFF / STYLING"
            title="SHOP THE LOOK"
            sub="Objects designed to move together."
          />

          {looks.length === 0 ? (
            <p className="py-20 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Looks appear when published objects are available.
            </p>
          ) : (
            <div className="mt-12 space-y-20">
              {looks.map((look: any, lookIndex: number) => {
                const items = products.filter((product) =>
                  (look.product_ids ?? []).includes(product.id),
                );
                return (
                  <section key={look.id}>
                    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
                      <div className="glass-panel overflow-hidden rounded-[28px]">
                        <SmartImage
                          src={look.image_url || items[0]?.primary_image}
                          alt={look.title}
                          width={1100}
                          height={1400}
                          className="aspect-[4/5] w-full object-cover grayscale"
                          eager={lookIndex === 0}
                        />
                      </div>

                      <div className="pb-2">
                        <span className="text-[8px] uppercase tracking-[0.4em] text-muted-foreground">
                          LOOK {String(lookIndex + 1).padStart(2, "0")}
                        </span>
                        <h2 className="mt-4 font-display text-2xl tracking-[0.14em] text-foreground sm:text-3xl">
                          {look.title}
                        </h2>
                        <p className="mt-4 max-w-xl font-editorial text-lg italic leading-relaxed text-muted-foreground">
                          {look.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="mt-8">
                      <ProductGrid
                        products={items}
                        loading={isLoading}
                        empty="No published objects are attached to this look."
                      />
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
