import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { ProductGrid } from "@/components/site/ProductGrid";
import { useProducts } from "@/lib/products";
import { useWishlist } from "@/lib/commerce";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist — ZZERKOFF" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "Saved ZZERKOFF objects.",
      },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const ids = useWishlist();
  const { data: products = [], isLoading } = useProducts();
  const saved = products.filter((product) => ids.includes(product.id));

  return (
    <PageShell>
      <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-7xl">
          <PageHeading
            label="ZZERKOFF / SAVED OBJECTS"
            title="WISHLIST"
            sub="Kept on this device."
          />

          {ids.length === 0 ? (
            <div className="glass-panel mt-12 rounded-[28px] p-10 text-center">
              <Heart className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Nothing saved yet
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.34em] text-foreground"
              >
                Find objects
              </Link>
            </div>
          ) : (
            <div className="mt-12">
              <ProductGrid
                products={saved}
                loading={isLoading}
                empty="Saved objects are no longer published."
              />
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
