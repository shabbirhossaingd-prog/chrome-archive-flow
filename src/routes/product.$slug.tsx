import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { SmartImage } from "@/components/site/SmartImage";
import { Reveal } from "@/components/site/Reveal";
import { ProductCard } from "@/components/site/ProductCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  formatPrice,
  isSoldOut,
  productImages,
  useAllPublishedProducts,
  type Product,
} from "@/lib/products";
import { SITE, restockMessage } from "@/lib/site-config";
import { OrderModal } from "@/components/site/OrderModal";
import { useSite } from "@/lib/settings";

const pretty = (slug: string) => slug.replace(/-/g, " ").toUpperCase();

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => {
    const title = `${pretty(params.slug)} — ZZERKOFF`;
    const description = `${pretty(params.slug)} — a ZZERKOFF object for the afterdark. Unisex chrome accessories.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: products = [], isLoading } = useAllPublishedProducts();
  const product = products.find((p) => p.slug === slug);

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl px-5 pt-32 sm:px-8 sm:pt-40">
        <Link
          to="/shop"
          className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground"
        >
          ← Back to shop
        </Link>

        {isLoading && (
          <div className="glass-panel mt-10 h-[60vh] animate-pulse rounded-[28px] bg-white/[0.02]" />
        )}

        {!isLoading && !product && (
          <p className="py-32 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            This object is no longer available.
          </p>
        )}

        {product && <ProductDetail product={product} products={products} />}
      </div>
    </PageShell>
  );
}

function ProductDetail({ product, products }: { product: Product; products: Product[] }) {
  const site = useSite();
  const images = productImages(product);
  const sizes = product.sizes ?? [];
  const finishes = product.finish ?? [];
  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const [finish, setFinish] = useState<string>(finishes[0] ?? "");
  const [qty, setQty] = useState(1);
  const [orderOpen, setOrderOpen] = useState(false);
  const soldOut = isSoldOut(product);

  const delivery =
    product.delivery ||
    site.settings?.default_delivery ||
    SITE.delivery;
  const care = product.care || site.settings?.default_care || "";
  const sizeGuide = product.size_guide || site.settings?.default_size_guide || "";
  const details = product.details_content || product.full_description;
  const material = product.material_content || product.material;

  const sections = [
    { label: "DETAILS", body: details },
    { label: "SIZE GUIDE", body: sizeGuide },
    { label: "MATERIAL", body: material },
    { label: "CARE", body: care },
    { label: "DELIVERY", body: delivery },
  ].filter((s) => !!s.body);

  const related = useMemo(() => {
    const published = products.filter((p) => p.id !== product.id && p.published);
    const manual = (product.related_product_ids ?? [])
      .map((id) => published.find((p) => p.id === id))
      .filter((p): p is Product => !!p)
      .slice(0, 2);
    if (manual.length) return manual;

    const productTags = new Set((product.tags ?? []).map((t) => t.toLowerCase()));
    return published
      .map((p) => {
        let score = 0;
        if (p.category === product.category) score += 5;
        if (product.collection_id && p.collection_id === product.collection_id) score += 3;
        for (const tag of p.tags ?? []) {
          if (productTags.has(tag.toLowerCase())) score += 1;
        }
        if (!isSoldOut(p)) score += 1;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.p);
  }, [product, products]);

  const pill = (active: boolean) =>
    `rounded-xl border px-4 py-3 text-[9px] uppercase tracking-[0.3em] transition-colors ${
      active ? "border-chrome/70 text-foreground" : "border-border/60 text-muted-foreground"
    }`;

  return (
    <>
      <div className="relative mt-10 grid gap-12 pb-24 lg:grid-cols-[58fr_42fr] lg:gap-16">
        <LiquidChrome className="-left-40 top-20 h-[38rem] w-[38rem]" opacity={0.16} />

        <Reveal className="space-y-4">
          <div className="glass-panel relative overflow-hidden rounded-[28px]">
            <SmartImage
              src={images[0]}
              alt={product.name}
              width={1024}
              height={1280}
              eager
              className="aspect-4/5 w-full object-cover grayscale"
            />
            <div className="grain-overlay" />
            {soldOut && (
              <span className="absolute left-5 top-5 rounded-full border border-chrome/50 bg-black/70 px-4 py-2 text-[9px] uppercase tracking-[0.35em] text-foreground backdrop-blur-md">
                Sold out
              </span>
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {images.slice(1).map((src, i) => (
                <div key={`${src}-${i}`} className="glass-panel overflow-hidden rounded-[22px]">
                  <SmartImage
                    src={src}
                    alt={`${product.name} view ${i + 2}`}
                    width={1024}
                    height={1024}
                    className="aspect-square w-full object-cover grayscale"
                  />
                </div>
              ))}
            </div>
          )}
        </Reveal>

        <Reveal delay={120} className="lg:sticky lg:top-32 lg:self-start">
          <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
            {product.product_code}
          </span>
          <h1 className="mt-5 font-display text-2xl leading-tight tracking-[0.12em] text-foreground sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-4 text-sm tracking-[0.25em] text-chrome">
            {formatPrice(product.price, site.currencySymbol)}
            {product.old_price ? (
              <span className="ml-3 text-muted-foreground line-through">
                {formatPrice(product.old_price, site.currencySymbol)}
              </span>
            ) : null}
          </p>

          <div className="mt-8 space-y-2 border-y border-border/60 py-6">
            {product.short_description
              .split(/[.\n]/)
              .filter(Boolean)
              .map((s) => (
                <p
                  key={s}
                  className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground"
                >
                  {s.trim()}
                </p>
              ))}
            {product.fit_gender && (
              <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                {product.fit_gender}
              </p>
            )}
            <p className="pt-2 text-[10px] uppercase tracking-[0.35em] text-chrome">
              {product.stock_status}
            </p>
          </div>

          {sizes.length > 0 && (
            <div className="mt-8">
              <span className="mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                Size
              </span>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={pill(size === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {product.size_description && (
                <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                  {product.size_description}
                </p>
              )}
            </div>
          )}

          {finishes.length > 0 && (
            <div className="mt-6">
              <span className="mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                Finish
              </span>
              <div className="flex flex-wrap gap-2">
                {finishes.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFinish(f)}
                    className={pill(finish === f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <span className="mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Quantity
            </span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQty((n) => Math.max(1, n - 1))}
                className="grid size-10 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                −
              </button>
              <span className="text-xs tracking-[0.3em] text-foreground">{qty}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() =>
                  setQty((n) =>
                    product.quantity_available > 0
                      ? Math.min(product.quantity_available, n + 1)
                      : n + 1,
                  )
                }
                className="grid size-10 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>

          <p className="mt-8 font-editorial text-lg leading-relaxed text-muted-foreground">
            {product.full_description}
          </p>

          <Accordion type="single" collapsible className="mt-8">
            {sections.map((s) => (
              <AccordionItem key={s.label} value={s.label} className="border-border/60">
                <AccordionTrigger className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground hover:no-underline">
                  {s.label}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-xs leading-relaxed tracking-[0.1em] text-muted-foreground">
                  {s.body}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-10 space-y-3">
            {soldOut ? (
              <>
                <div className="w-full rounded-full border border-border/60 px-8 py-5 text-center text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                  Sold out
                </div>
                <a
                  href={site.wa(restockMessage(product.name, product.product_code))}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full rounded-full border border-chrome/40 px-8 py-5 text-center text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors duration-500 hover:border-chrome hover:bg-white/[0.06]"
                >
                  Ask about restock →
                </a>
              </>
            ) : (
              product.whatsapp_available && (
                <button
                  type="button"
                  onClick={() => setOrderOpen(true)}
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-6 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
                >
                  Place order
                  <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              )
            )}
          </div>
        </Reveal>
      </div>

      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        productId={product.id}
        productName={product.name}
        productCode={product.product_code}
        unitPrice={Number(product.price)}
        currencySymbol={site.currencySymbol}
        size={size}
        finish={finish}
        quantity={qty}
      />

      {related.length > 0 && (
        <section className="pb-32">
          <Reveal className="border-y border-border/50 py-5">
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              RELATED OBJECTS
            </span>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
