import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Marquee } from "@/components/site/Marquee";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";
import { Toaster } from "@/components/ui/sonner";
import { products, categories, upcomingCategories, formatPrice } from "@/lib/products";
import zzLogo from "@/assets/zz-logo.jpg.asset.json";
import campaign1 from "@/assets/campaign-1.jpg";
import campaign2 from "@/assets/campaign-2.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZZERKOFF — Objects for the Afterdark" },
      {
        name: "description",
        content:
          "Drop 001: chrome rings, chains and bracelets. A unisex alternative accessories archive from Dhaka.",
      },
      { property: "og:title", content: "ZZERKOFF — Objects for the Afterdark" },
      {
        property: "og:description",
        content: "Drop 001: chrome rings, chains and bracelets. Unisex. Underground. Afterdark.",
      },
    ],
  }),
  component: Index,
});

const featured = products[0]!;

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">{children}</span>
  );
}

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Header />

      {/* HERO */}
      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2"
          opacity={0.3}
          blur={30}
        />
        <LiquidChrome className="-right-32 bottom-0 h-[30rem] w-[30rem]" opacity={0.12} flip />
        <div className="grain-overlay" />

        <Reveal>
          <img
            src={zzLogo.url}
            alt="ZZERKOFF liquid chrome ZZ monogram"
            width={720}
            height={720}
            className="mx-auto w-[68vw] max-w-[34rem] animate-float-slow mix-blend-lighten contrast-125"
          />
        </Reveal>

        <Reveal delay={200} className="mt-2">
          <h1 className="chrome-text font-display text-3xl tracking-[0.3em] sm:text-5xl">
            ZZERKOFF
          </h1>
          <p className="mt-6 font-editorial text-lg italic text-chrome/80 sm:text-2xl">
            Objects for the Afterdark.
          </p>
          <p className="mt-6 text-[9px] uppercase tracking-[0.5em] text-muted-foreground sm:text-[10px]">
            Unisex / Chrome / Vintage / Underground
          </p>
        </Reveal>

        <Reveal delay={420} className="mt-12">
          <Link
            to="/"
            hash="drop"
            className="group inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground backdrop-blur-md transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
          >
            Enter Drop 001
            <span className="transition-transform duration-700 group-hover:translate-x-1">→</span>
          </Link>
        </Reveal>
      </section>

      <Marquee />

      {/* DROP 001 */}
      <section id="drop" className="relative isolate scroll-mt-28 px-5 py-28 sm:px-8 sm:py-36">
        <LiquidChrome className="-left-48 top-24 h-[34rem] w-[34rem]" opacity={0.14} />
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionLabel>ZZ / COLLECTION</SectionLabel>
              <h2 className="mt-5 font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
                DROP 001
              </h2>
              <p className="mt-4 font-editorial text-lg italic text-muted-foreground">
                Objects selected for the afterdark.
              </p>
            </div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Rings / Chains / Bracelets
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 120}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="relative isolate overflow-hidden px-5 py-24 sm:px-8">
        <LiquidChrome className="-right-40 top-0 h-[42rem] w-[42rem]" opacity={0.2} flip />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className="glass-panel relative overflow-hidden rounded-[28px]">
            <img
              src={featured.image}
              alt={featured.name}
              loading="lazy"
              width={1024}
              height={1280}
              className="aspect-4/5 w-full object-cover grayscale"
            />
            <div className="grain-overlay" />
          </Reveal>

          <Reveal delay={150}>
            <SectionLabel>DROP 001 / 01</SectionLabel>
            <h2 className="mt-5 font-display text-2xl tracking-[0.18em] text-foreground sm:text-4xl">
              {featured.name}
            </h2>
            <p className="mt-5 text-sm tracking-[0.25em] text-chrome">
              {formatPrice(featured.price)}
            </p>
            <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Polished metal. Adjustable. Unisex.
            </p>
            <Link
              to="/product/$slug"
              params={{ slug: featured.slug }}
              className="group mt-12 inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
            >
              View object
              <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* SHOP BY OBJECT */}
      <section className="relative px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <SectionLabel>SHOP BY OBJECT</SectionLabel>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:gap-6 lg:grid-cols-3">
            {categories.map((c, i) => (
              <Reveal key={c.slug} delay={i * 140}>
                <Link
                  to="/"
                  hash="drop"
                  className="group glass-panel relative block overflow-hidden rounded-[26px]"
                >
                  <img
                    src={c.image}
                    alt={`${c.name} category`}
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-3/4 w-full object-cover grayscale brightness-75 transition-transform duration-[1800ms] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="grain-overlay" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-display text-lg tracking-[0.25em] text-foreground">
                      {c.name}
                    </h3>
                    <span className="mt-3 block text-[9px] uppercase tracking-[0.4em] text-chrome opacity-0 transition-opacity duration-700 group-hover:opacity-100">
                      Explore →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10">
            <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Coming to the archive — {upcomingCategories.join(" / ")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* STATEMENT */}
      <section className="relative isolate overflow-hidden px-5 py-36 sm:px-8 sm:py-48">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2"
          opacity={0.16}
        />
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="chrome-text font-display text-4xl leading-[1.1] tracking-[0.08em] sm:text-6xl lg:text-7xl">
              NOT MADE
              <br />
              TO BLEND IN.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-12 max-w-xl font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              ZZERKOFF explores metal, distortion, vintage forms and underground culture through
              unisex accessories.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ARCHIVE */}
      <section id="archive" className="relative scroll-mt-28 px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
              THE ARCHIVE
            </h2>
            <SectionLabel>ZZ / VISUAL SERIES 001</SectionLabel>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                <img
                  src={campaign1}
                  alt="Hands wearing chrome rings, flash photography"
                  loading="lazy"
                  width={1200}
                  height={1504}
                  className="aspect-4/5 w-full object-cover grayscale"
                />
                <div className="grain-overlay" />
              </figure>
            </Reveal>

            <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-5">
              <Reveal delay={140}>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  <img
                    src={campaign2}
                    alt="Model in dark outfit with chrome chains"
                    loading="lazy"
                    width={1200}
                    height={912}
                    className="aspect-4/3 w-full object-cover grayscale"
                  />
                  <div className="grain-overlay" />
                </figure>
              </Reveal>
              <Reveal delay={260}>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  <img
                    src={products[1]!.image}
                    alt="Chrome curb chain on black"
                    loading="lazy"
                    width={1024}
                    height={1280}
                    className="aspect-square w-full object-cover grayscale"
                  />
                  <div className="grain-overlay" />
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="relative isolate scroll-mt-28 px-5 py-32 sm:px-8">
        <LiquidChrome className="-left-32 bottom-0 h-[30rem] w-[30rem]" opacity={0.12} />
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.2em] text-foreground sm:text-4xl">
              THIS IS ZZERKOFF.
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-10 space-y-6 font-editorial text-lg leading-relaxed text-muted-foreground">
              <p>
                Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic
                fashion, Y2K and underground street culture.
              </p>
              <p>Created for people who prefer bold identities over ordinary trends.</p>
              <p className="text-chrome">For those who don't blend in.</p>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
      <Toaster />
    </div>
  );
}
