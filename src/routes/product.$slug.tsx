import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { OrderDialog } from "@/components/site/OrderDialog";
import { Reveal } from "@/components/site/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { products, formatPrice, WHATSAPP_NUMBER } from "@/lib/products";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = products.find((p) => p.slug === params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.product.name ?? "OBJECT";
    const title = `${name} — ZZERKOFF`;
    const description =
      loaderData?.product.description ?? "A ZZERKOFF object for the afterdark.";
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
  const { product } = Route.useLoaderData();
  const sections = [
    { label: "DETAILS", body: product.details },
    { label: "SIZE", body: product.size },
    { label: "CARE", body: product.care },
    { label: "DELIVERY", body: product.delivery },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Header />

      <main className="mx-auto max-w-7xl px-5 pt-32 sm:px-8 sm:pt-40">
        <Link
          to="/"
          hash="drop"
          className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:text-foreground"
        >
          ← Back to Drop 001
        </Link>

        <div className="relative mt-10 grid gap-12 lg:grid-cols-[60fr_40fr] lg:gap-16">
          <LiquidChrome className="-left-40 top-20 h-[38rem] w-[38rem]" opacity={0.16} />

          <Reveal className="space-y-4">
            <div className="glass-panel relative overflow-hidden rounded-[28px]">
              <img
                src={product.image}
                alt={product.name}
                width={1024}
                height={1280}
                className="aspect-4/5 w-full object-cover grayscale"
              />
              <div className="grain-overlay" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {products
                .filter((p) => p.slug !== product.slug)
                .map((p) => (
                  <div key={p.slug} className="glass-panel overflow-hidden rounded-[24px]">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      width={1024}
                      height={1280}
                      className="aspect-square w-full object-cover grayscale"
                    />
                  </div>
                ))}
            </div>
          </Reveal>

          <Reveal delay={120} className="lg:sticky lg:top-32 lg:self-start">
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              ZZ / {product.number}
            </span>
            <h1 className="mt-5 font-display text-2xl leading-tight tracking-[0.12em] text-foreground sm:text-3xl">
              {product.name}
            </h1>
            <p className="mt-4 text-sm tracking-[0.25em] text-chrome">
              {formatPrice(product.price)}
            </p>

            <ul className="mt-8 space-y-2 border-y border-border/60 py-6">
              {product.specs.map((s) => (
                <li key={s} className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  {s}
                </li>
              ))}
            </ul>

            <p className="mt-6 font-editorial text-lg leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <Accordion type="single" collapsible className="mt-8">
              {sections.map((s) => (
                <AccordionItem key={s.label} value={s.label} className="border-border/60">
                  <AccordionTrigger className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground hover:no-underline hover:text-foreground">
                    {s.label}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs leading-relaxed tracking-[0.1em] text-muted-foreground">
                    {s.body}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 space-y-3">
              <OrderDialog product={product}>
                <button
                  type="button"
                  className="group flex w-full items-center justify-center gap-3 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
                >
                  Order now
                  <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </button>
              </OrderDialog>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                  `ZZERKOFF — I want to order ${product.name} (ZZ / ${product.number}).`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-full border border-border/60 px-8 py-5 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors duration-700 hover:border-chrome/50 hover:text-foreground"
              >
                Order via WhatsApp
              </a>
            </div>
          </Reveal>
        </div>
      </main>

      <Footer />
    </div>
  );
}