import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Marquee } from "@/components/site/Marquee";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { Toaster } from "@/components/ui/sonner";
import { useCategories, useProducts } from "@/lib/products";
import { ProductGrid } from "@/components/site/ProductGrid";
import { CategoryCard } from "@/components/site/CategoryCard";
import { SmartImage } from "@/components/site/SmartImage";
import { pageJson, useCurrentCollection, usePage } from "@/lib/cms";
import { useSite } from "@/lib/settings";
import campaign1 from "@/assets/campaign-1.webp";
import campaign2 from "@/assets/campaign-2.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZZERKOFF" },
      {
        name: "description",
        content:
          "Shop the current ZZERKOFF collection: unisex chrome rings, chains, bracelets and alternative accessories.",
      },
      {
        property: "og:title",
        content: "ZZERKOFF — Objects for the Afterdark",
      },
      {
        property: "og:description",
        content:
          "Current ZZERKOFF objects. Unisex chrome accessories. Underground. Afterdark.",
      },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://zzerkoff.vercel.app/",
      },
      {
        rel: "preload",
        href: "/images/zzerkoff-logo.webp",
        as: "image",
        type: "image/webp",
        fetchPriority: "high",
      },
    ],
  }),
  component: Index,
});

type HomeSection = {
  id: string;
  type: string;
  enabled: boolean;
  title: string;
  body: string;
  image: string;
  button_label: string;
  button_href: string;
  product_ids?: string[];
  category_slug?: string;
  collection_id?: string;
  starts_at?: string;
  ends_at?: string;
};

type HomeJson = {
  hero_eyebrow?: string;
  hero_cta_label?: string;
  hero_cta_href?: string;
  show_current_drop?: boolean;
  show_featured?: boolean;
  show_categories?: boolean;
  statement_title?: string;
  statement_body?: string;
  about_title?: string;
  about_body?: string;
  archive_images?: string[];
  sections?: HomeSection[];
};

function SectionLabel({ children }: { children: string }) {
  return (
    <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
      {children}
    </span>
  );
}

function sectionIsLive(section: HomeSection) {
  if (!section.enabled) return false;

  const now = Date.now();
  const starts = section.starts_at ? new Date(section.starts_at).getTime() : null;
  const ends = section.ends_at ? new Date(section.ends_at).getTime() : null;

  if (starts && Number.isFinite(starts) && now < starts) return false;
  if (ends && Number.isFinite(ends) && now > ends) return false;
  return true;
}

function productsForSection(section: HomeSection, products: any[]) {
  const ids = section.product_ids ?? [];

  if (ids.length > 0) {
    const order = new Map(ids.map((id, index) => [id, index]));
    return products
      .filter((product) => order.has(product.id))
      .sort(
        (a, b) =>
          (order.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
          (order.get(b.id) ?? Number.MAX_SAFE_INTEGER),
      );
  }

  if (section.category_slug) {
    return products.filter(
      (product) => product.category === section.category_slug,
    );
  }

  if (section.collection_id) {
    return products.filter(
      (product) => product.collection_id === section.collection_id,
    );
  }

  return [];
}

function Index() {
  const [catalogReady, setCatalogReady] = useState(false);

  useEffect(() => {
    let finished = false;
    const activate = () => {
      if (finished) return;
      finished = true;
      setCatalogReady(true);
    };

    const timer = window.setTimeout(activate, 850);
    window.addEventListener("scroll", activate, { passive: true, once: true });
    window.addEventListener("pointerdown", activate, { passive: true, once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", activate);
      window.removeEventListener("pointerdown", activate);
    };
  }, []);

  const { data: products = [], isLoading } = useProducts(catalogReady);
  const { data: categories = [] } = useCategories(catalogReady);
  const { data: currentCollection } = useCurrentCollection();
  const { page: homePage } = usePage("home");
  const home = pageJson<HomeJson>(homePage);
  const site = useSite();

  // Never mix objects from another drop under a current collection heading.
  const newDrop = currentCollection
    ? products.filter(
        (product) => product.collection_id === currentCollection.id,
      )
    : products.filter((product) => product.new_collection);

  const dropCode =
    currentCollection?.collection_code ||
    (currentCollection?.drop_number
      ? `DROP ${String(currentCollection.drop_number).padStart(3, "0")}`
      : "CURRENT DROP");

  const dropTagline =
    currentCollection?.tagline || "Objects selected for the afterdark.";

  const objectTypes =
    Array.from(
      new Set(
        newDrop.map((product) =>
          product.category.replace(/-/g, " ").toUpperCase(),
        ),
      ),
    ).join(" / ") || "OBJECTS";

  const featuredFromDrop =
    newDrop.find((product) => product.featured) ?? newDrop[0] ?? null;

  const featured =
    featuredFromDrop ??
    products.find((product) => product.featured) ??
    null;

  const featuredLabel = featuredFromDrop
    ? `${dropCode} / 01`
    : "ZZ / FEATURED";

  const visibleCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          count: products.filter((product) => product.category === category.slug).length,
        }))
        .filter((item) => item.count > 0),
    [categories, products],
  );

  const catalogLoaded = catalogReady && !isLoading;
  const showDrop =
    (home.show_current_drop ?? true) && catalogLoaded && newDrop.length > 0;
  const showFeatured =
    (home.show_featured ?? true) && catalogLoaded && !!featured;
  const showCategories =
    (home.show_categories ?? true) &&
    catalogLoaded &&
    visibleCategories.length > 0;

  const hasDropTarget = newDrop.length > 0;
  const heroCtaLabel =
    home.hero_cta_label?.trim() ||
    (hasDropTarget ? `ENTER ${dropCode}` : "SHOP OBJECTS");
  const heroCtaHref =
    home.hero_cta_href?.trim() || (hasDropTarget ? "/collection" : "/shop");

  const statementTitle = (home.statement_title ?? "NOT MADE\nTO BLEND IN.").split("\n");
  const aboutBody = (
    home.about_body ??
    "Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic fashion, Y2K and underground street culture.\n\nCreated for people who prefer bold identities over ordinary trends.\n\nFor those who don't blend in."
  )
    .split("\n\n")
    .filter(Boolean);

  const archiveImages = home.archive_images ?? [];
  const customSections = (home.sections ?? []).filter(sectionIsLive);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Header />

      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2"
          opacity={0.3}
          blur={30}
        />
        <LiquidChrome
          className="-right-32 bottom-0 h-[30rem] w-[30rem]"
          opacity={0.12}
          flip
        />
        <div className="grain-overlay" />

        <Reveal immediate>
          <img
            src="/images/zzerkoff-logo.webp"
            alt="ZZERKOFF liquid chrome ZZ monogram"
            width={720}
            height={720}
            fetchPriority="high"
            decoding="async"
            className="mx-auto w-[68vw] max-w-[34rem] animate-float-slow mix-blend-lighten contrast-125"
          />
        </Reveal>

        <Reveal delay={200} className="mt-2">
          <h1 className="chrome-text font-display text-3xl tracking-[0.3em] sm:text-5xl">
            {homePage?.title || "Zzerkoff"}
          </h1>
          <p className="mt-6 font-editorial text-lg italic text-chrome/80 sm:text-2xl">
            {homePage?.subtitle || "Objects for the Afterdark."}
          </p>
          <p className="mt-6 text-[9px] uppercase tracking-[0.5em] text-muted-foreground sm:text-[10px]">
            {home.hero_eyebrow || "Unisex / Chrome / Vintage / Underground"}
          </p>
        </Reveal>

        <Reveal delay={420} className="mt-12">
          <a
            href={heroCtaHref}
            className="group inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground backdrop-blur-md transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
          >
            {heroCtaLabel}
            <span className="transition-transform duration-700 group-hover:translate-x-1">
              →
            </span>
          </a>
        </Reveal>
      </section>

      <Marquee />

      {showDrop && (
        <section
          id="drop"
          className="perf-below-fold relative isolate scroll-mt-28 px-5 py-28 sm:px-8 sm:py-36"
        >
          <LiquidChrome
            className="-left-48 top-24 h-[34rem] w-[34rem]"
            opacity={0.14}
          />
          <div className="mx-auto max-w-7xl">
            <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionLabel>ZZ / COLLECTION</SectionLabel>
                <h2 className="mt-5 font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
                  {dropCode}
                </h2>
                <p className="mt-4 font-editorial text-lg italic text-muted-foreground">
                  {dropTagline}
                </p>
              </div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                {objectTypes}
              </p>
            </Reveal>
            <div className="mt-14">
              <ProductGrid products={newDrop} loading={false} />
            </div>
          </div>
        </section>
      )}

      {showFeatured && featured && (
        <section className="perf-below-fold relative isolate overflow-hidden px-5 py-24 sm:px-8">
          <LiquidChrome
            className="-right-40 top-0 h-[42rem] w-[42rem]"
            opacity={0.2}
            flip
          />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal className="glass-panel relative overflow-hidden rounded-[28px]">
              <SmartImage
                src={featured.primary_image}
                alt={featured.name}
                width={1024}
                height={1280}
                className="aspect-4/5 w-full object-cover grayscale"
              />
              <div className="grain-overlay" />
            </Reveal>

            <Reveal delay={150}>
              <SectionLabel>{featuredLabel}</SectionLabel>
              <h2 className="mt-5 font-display text-2xl tracking-[0.18em] text-foreground sm:text-4xl">
                {featured.name}
              </h2>
              <p className="mt-5 text-sm tracking-[0.25em] text-chrome">
                {site.price(featured.price)}
              </p>
              {featured.short_description && (
                <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                  {featured.short_description}
                </p>
              )}
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
      )}

      {showCategories && (
        <section className="perf-below-fold relative px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionLabel>SHOP BY OBJECT</SectionLabel>
            </Reveal>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {visibleCategories.map(({ category, count }, index) => (
                <Reveal key={category.slug} delay={index * 120}>
                  <CategoryCard category={category} index={index} count={count} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {customSections.map((section, index) => {
        const selectedProducts = productsForSection(section, products);
        const productDriven = [
          "shop-look",
          "shop-teaser",
          "featured-products",
          "collection",
        ].includes(section.type);

        if (productDriven && selectedProducts.length === 0) {
          return null;
        }

        if (section.type === "announcement") {
          return (
            <section
              key={section.id}
              className="perf-below-fold border-y border-border/50 px-5 py-12 text-center sm:px-8"
            >
              <div className="mx-auto max-w-4xl">
                <SectionLabel>ANNOUNCEMENT</SectionLabel>

                {section.title && (
                  <h2 className="mt-4 font-display text-2xl tracking-[0.18em] text-foreground">
                    {section.title}
                  </h2>
                )}

                {section.body && (
                  <p className="mt-4 font-editorial text-lg text-muted-foreground">
                    {section.body}
                  </p>
                )}

                {section.button_label && section.button_href && (
                  <a
                    href={section.button_href}
                    className="mt-6 inline-flex rounded-full border border-chrome/50 px-6 py-3 text-[9px] uppercase tracking-[0.3em] text-foreground"
                  >
                    {section.button_label}
                  </a>
                )}
              </div>
            </section>
          );
        }

        if (
          section.type === "shop-look" ||
          section.type === "shop-teaser" ||
          section.type === "featured-products" ||
          section.type === "collection"
        ) {
          return (
            <section
              key={section.id}
              className="perf-below-fold relative isolate px-5 py-24 sm:px-8"
            >
              <div className="mx-auto max-w-7xl">
                <Reveal>
                  <SectionLabel>
                    {section.type.replace(/-/g, " ").toUpperCase()}
                  </SectionLabel>

                  {section.title && (
                    <h2 className="mt-5 font-display text-3xl tracking-[0.16em] text-foreground sm:text-5xl">
                      {section.title}
                    </h2>
                  )}

                  {section.body && (
                    <p className="mt-5 max-w-2xl font-editorial text-lg leading-relaxed text-muted-foreground">
                      {section.body}
                    </p>
                  )}
                </Reveal>

                {section.image && (
                  <Reveal
                    delay={100}
                    className="glass-panel mt-10 overflow-hidden rounded-[26px]"
                  >
                    <SmartImage
                      src={section.image}
                      alt={section.title || `Home section ${index + 1}`}
                      width={1600}
                      height={900}
                      className="aspect-[16/7] w-full object-cover grayscale"
                    />
                  </Reveal>
                )}

                <div className="mt-10">
                  <ProductGrid
                    products={selectedProducts.slice(0, 8)}
                    loading={false}
                  />
                </div>

                {section.button_label && section.button_href && (
                  <a
                    href={section.button_href}
                    className="mt-10 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.35em] text-foreground"
                  >
                    {section.button_label}
                  </a>
                )}
              </div>
            </section>
          );
        }

        return (
          <section
            key={section.id}
            className="perf-below-fold relative isolate px-5 py-20 sm:px-8 sm:py-28"
          >
            <div
              className={`mx-auto max-w-7xl ${
                section.image
                  ? "grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                  : "max-w-4xl text-center"
              }`}
            >
              {section.image && (
                <Reveal className="glass-panel overflow-hidden rounded-[26px]">
                  <SmartImage
                    src={section.image}
                    alt={section.title || `Home section ${index + 1}`}
                    width={1200}
                    height={1400}
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                </Reveal>
              )}

              <Reveal delay={section.image ? 120 : 0}>
                <SectionLabel>
                  {section.type.replace(/-/g, " ").toUpperCase()}
                </SectionLabel>

                {section.title && (
                  <h2 className="mt-5 font-display text-3xl tracking-[0.16em] text-foreground sm:text-5xl">
                    {section.title}
                  </h2>
                )}

                {section.body && (
                  <p className="mt-6 whitespace-pre-line font-editorial text-lg leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                )}

                {section.button_label && section.button_href && (
                  <a
                    href={section.button_href}
                    className="mt-8 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.35em] text-foreground"
                  >
                    {section.button_label}
                  </a>
                )}
              </Reveal>
            </div>
          </section>
        );
      })}

      <section className="perf-below-fold relative isolate overflow-hidden px-5 py-36 sm:px-8 sm:py-48">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2"
          opacity={0.16}
        />
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="chrome-text font-display text-4xl leading-[1.1] tracking-[0.08em] sm:text-6xl lg:text-7xl">
              {statementTitle.map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-12 max-w-xl font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {home.statement_body ||
                "ZZERKOFF explores metal, distortion, vintage forms and underground culture through unisex accessories."}
            </p>
          </Reveal>
        </div>
      </section>

      <section
        id="archive"
        className="perf-below-fold relative scroll-mt-28 px-5 py-24 sm:px-8"
      >
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
                {archiveImages[0] ? (
                  <SmartImage
                    src={archiveImages[0]}
                    alt="ZZERKOFF archive image"
                    width={1200}
                    height={1504}
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                ) : (
                  <img
                    src={campaign1}
                    alt="Hands wearing chrome rings, flash photography"
                    loading="lazy"
                    width={1200}
                    height={1504}
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                )}
                <div className="grain-overlay" />
              </figure>
            </Reveal>

            <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-5">
              <Reveal delay={140}>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  {archiveImages[1] ? (
                    <SmartImage
                      src={archiveImages[1]}
                      alt="ZZERKOFF archive image"
                      width={1200}
                      height={912}
                      className="aspect-4/3 w-full object-cover grayscale"
                    />
                  ) : (
                    <img
                      src={campaign2}
                      alt="Model in dark outfit with chrome chains"
                      loading="lazy"
                      width={1200}
                      height={912}
                      className="aspect-4/3 w-full object-cover grayscale"
                    />
                  )}
                  <div className="grain-overlay" />
                </figure>
              </Reveal>

              <Reveal delay={260}>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  {archiveImages[2] ? (
                    <SmartImage
                      src={archiveImages[2]}
                      alt="ZZERKOFF archive image"
                      width={1024}
                      height={1024}
                      className="aspect-square w-full object-cover grayscale"
                    />
                  ) : products[1]?.primary_image ? (
                    <SmartImage
                      src={products[1].primary_image}
                      alt={products[1].name}
                      width={1024}
                      height={1024}
                      className="aspect-square w-full object-cover grayscale"
                    />
                  ) : (
                    <img
                      src={campaign2}
                      alt="ZZERKOFF campaign"
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="aspect-square w-full object-cover grayscale"
                    />
                  )}
                  <div className="grain-overlay" />
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section
        id="about"
        className="perf-below-fold relative isolate scroll-mt-28 px-5 py-32 sm:px-8"
      >
        <LiquidChrome
          className="-left-32 bottom-0 h-[30rem] w-[30rem]"
          opacity={0.12}
        />
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.2em] text-foreground sm:text-4xl">
              {home.about_title || "THIS IS ZZERKOFF."}
            </h2>
          </Reveal>
          <Reveal delay={160}>
            <div className="mt-10 space-y-6 font-editorial text-lg leading-relaxed text-muted-foreground">
              {aboutBody.map((paragraph, index) => (
                <p
                  key={`${paragraph}-${index}`}
                  className={index === aboutBody.length - 1 ? "text-chrome" : ""}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
      <Toaster />
    </div>
  );
}
