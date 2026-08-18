import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { SmartImage } from "@/components/site/SmartImage";
import { useSite } from "@/lib/settings";
import {
  removeCartItem,
  updateCartQuantity,
  useCart,
} from "@/lib/commerce";
import { isSoldOut, useProducts } from "@/lib/products";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Cart — ZZERKOFF" },
      { name: "robots", content: "noindex,nofollow" },
      {
        name: "description",
        content: "ZZERKOFF cart.",
      },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const site = useSite();
  const { data: products = [] } = useProducts();

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <PageShell>
      <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-5xl">
          <PageHeading
            label="ZZERKOFF / CART"
            title="CART"
            sub="Saved objects stay here until you remove them."
          />

          {items.length === 0 ? (
            <div className="glass-panel mt-12 rounded-[28px] p-10 text-center">
              <ShoppingBag className="mx-auto size-6 text-muted-foreground" />
              <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                Your cart is empty
              </p>
              <Link
                to="/shop"
                className="mt-6 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.34em] text-foreground"
              >
                Shop objects
              </Link>
            </div>
          ) : (
            <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {items.map((item) => {
                  const product =
                    item.kind === "product"
                      ? products.find((row) => row.id === item.id)
                      : null;

                  const bundleIds = item.kind === "bundle"
                    ? item.productIds ?? []
                    : [];

                  const bundleProducts = bundleIds
                    .map((id) => products.find((row) => row.id === id))
                    .filter(Boolean);

                  const bundleReady =
                    item.kind === "bundle" &&
                    bundleIds.length > 0 &&
                    bundleProducts.length === bundleIds.length &&
                    bundleProducts.every((row) => row && !isSoldOut(row));

                  const colorStock =
                    (product?.color_stock ?? {}) as Record<string, number>;

                  const maxByColor =
                    product && item.color
                      ? Number(colorStock[item.color] ?? 0)
                      : product?.quantity_available ?? 0;

                  const productMax = product
                    ? Math.max(
                        0,
                        Math.min(product.quantity_available, maxByColor),
                      )
                    : 0;

                  const bundleMax = bundleReady
                    ? Math.max(
                        0,
                        Math.min(
                          ...bundleProducts.map(
                            (row) => row?.quantity_available ?? 0,
                          ),
                        ),
                      )
                    : 0;

                  const maxAvailable =
                    item.kind === "product" ? productMax : bundleMax;

                  const unavailable =
                    item.kind === "product"
                      ? !product || isSoldOut(product) || maxAvailable <= 0
                      : !bundleReady || maxAvailable <= 0;

                  const atLimit =
                    Number.isFinite(maxAvailable) &&
                    item.quantity >= maxAvailable;

                  return (
                    <article
                      key={item.key}
                      className="glass-panel flex gap-4 rounded-[24px] p-4"
                    >
                      <SmartImage
                        src={item.image}
                        alt={item.name}
                        width={180}
                        height={220}
                        className="h-28 w-24 shrink-0 rounded-2xl object-cover grayscale"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
                          {item.code} · {item.kind}
                        </span>

                        <h2 className="mt-2 truncate font-display text-sm tracking-[0.12em] text-foreground">
                          {item.name}
                        </h2>

                        <p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                          {[item.color, item.size, item.finish]
                            .filter(Boolean)
                            .join(" / ") || "STANDARD"}
                        </p>

                        <p className="mt-3 text-xs tracking-[0.12em] text-chrome">
                          {site.price(item.price)}
                        </p>

                        {unavailable && (
                          <p className="mt-3 text-[8px] uppercase tracking-[0.25em] text-chrome">
                            This item is no longer available. Remove it from cart.
                          </p>
                        )}

                        {!unavailable &&
                          item.kind === "product" &&
                          Number.isFinite(maxAvailable) && (
                            <p className="mt-2 text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                              {maxAvailable} available
                            </p>
                          )}

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartQuantity(item.key, item.quantity - 1)
                            }
                            className="grid size-8 place-items-center rounded-full border border-border/60 text-muted-foreground"
                          >
                            <Minus className="size-3" />
                          </button>

                          <span className="min-w-8 text-center text-[10px] text-foreground">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            disabled={unavailable || atLimit}
                            onClick={() =>
                              updateCartQuantity(item.key, item.quantity + 1)
                            }
                            className="grid size-8 place-items-center rounded-full border border-border/60 text-muted-foreground disabled:opacity-30"
                          >
                            <Plus className="size-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item.key)}
                            className="ml-auto inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
                          >
                            <Trash2 className="size-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <aside className="glass-panel h-fit rounded-[26px] p-5 lg:sticky lg:top-32">
                <span className="text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
                  Cart summary
                </span>

                <div className="mt-5 flex items-center justify-between border-b border-border/50 pb-4">
                  <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                    Subtotal
                  </span>
                  <span className="text-sm tracking-[0.12em] text-foreground">
                    {site.price(subtotal)}
                  </span>
                </div>

                <p className="mt-5 text-[9px] leading-relaxed text-muted-foreground">
                  Cart respects current object availability. Order behavior is unchanged.
                </p>
              </aside>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
