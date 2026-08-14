import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { SmartImage } from "@/components/site/SmartImage";
import { Reveal } from "@/components/site/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatPrice, isSoldOut, productImages, useProducts, type Product } from "@/lib/products";
import { SITE, orderMessage, restockMessage, whatsappUrl } from "@/lib/site-config";

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
  const { data: products = [], isLoading } = useProducts();
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
            This object is no longer in the archive.
          </p>
        )}

        {product && <ProductDetail product={product} />}
      </div>
    </PageShell>
  );
}

function ProductDetail({ product }: { product: Product }) {
  const images = productImages(product);
  const sizes = product.sizes ?? [];
  const finishes = product.finish ?? [];
  const [size, setSize] = useState<string>(sizes[0] ?? "");
  const [finish, setFinish] = useState<string>(finishes[0] ?? "");
  const [qty, setQty] = useState(1);
  const soldOut = isSoldOut(product);

  const sections = [
    { label: "DETAILS", body: product.full_description },
    { label: "SIZE GUIDE", body: product.size_guide },
    { label: "MATERIAL", body: product.material },
    { label: "CARE", body: product.care },
    { label: "DELIVERY", body: product.delivery || SITE.delivery },
  ].filter((s) => !!s.body);

  const orderHref = whatsappUrl(
    orderMessage({
      name: product.name,
      code: product.product_code,
      category: product.category,
      price: Number(product.price) * qty,
      size: [size, finish].filter(Boolean).join(" / "),
      quantity: qty,
    }),
  );

  const pill = (active: boolean) =>
    `rounded-xl border px-4 py-3 text-[9px] uppercase tracking-[0.3em] transition-colors ${
      active ? "border-chrome/70 text-foreground" : "border-border/60 text-muted-foreground"
    }`;

  return (
    <div className="relative mt-10 grid gap-12 pb-32 lg:grid-cols-[58fr_42fr] lg:gap-16">
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
              <div key={i} className="glass-panel overflow-hidden rounded-[22px]">
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
          {formatPrice(product.price)}
          {product.old_price ? (
            <span className="ml-3 text-muted-foreground line-through">
              {formatPrice(product.old_price)}
            </span>
          ) : null}
        </p>

        <div className="mt-8 space-y-2 border-y border-border/60 py-6">
          {product.short_description.split(/[.\n]/).filter(Boolean).map((s) => (
            <p key={s} className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              {s.trim()}
            </p>
          ))}
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
                <button key={s} type="button" onClick={() => setSize(s)} className={pill(size === s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {finishes.length > 0 && (
          <div className="mt-6">
            <span className="mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Finish
            </span>
            <div className="flex flex-wrap gap-2">
              {finishes.map((f) => (
                <button key={f} type="button" onClick={() => setFinish(f)} className={pill(finish === f)}>
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
              onClick={() => setQty((n) => n + 1)}
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
              <AccordionContent className="text-xs leading-relaxed tracking-[0.1em] text-muted-foreground">
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
                href={whatsappUrl(restockMessage(product.name, product.product_code))}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-full border border-chrome/40 px-8 py-5 text-center text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors duration-500 hover:border-chrome hover:bg-white/[0.06]"
              >
                Ask about restock →
              </a>
            </>
          ) : (
            product.whatsapp_available && (
              <a
                href={orderHref}
                target="_blank"
                rel="noreferrer"
                className="group flex w-full items-center justify-center gap-3 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-6 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
              >
                Order via WhatsApp
                <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            )
          )}
        </div>
      </Reveal>
    </div>
  );
}
