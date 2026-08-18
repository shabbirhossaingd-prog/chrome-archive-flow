import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Marquee } from "@/components/site/Marquee";
import { Reveal } from "@/components/site/Reveal";
import { ProductGrid } from "@/components/site/ProductGrid";
import { ProductCard } from "@/components/site/ProductCard";
import { SmartImage } from "@/components/site/SmartImage";
import { useProducts } from "@/lib/products";
import { useCurrentCollection } from "@/lib/cms";

export const Route = createFileRoute("/collection")({
  head: () => ({
    meta: [
      { title: "New Collection — ZZERKOFF" },
      {
        name: "description",
        content: "The current ZZERKOFF collection. Objects for the afterdark.",
      },
      { property: "og:title", content: "New Collection — ZZERKOFF" },
      {
        property: "og:description",
        content: "The current ZZERKOFF drop — chrome objects for the afterdark.",
      },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: collection, isLoading: loadingCollection } =
    useCurrentCollection();

  if (loadingCollection) {
    return (
      <PageShell>
        <section className="px-5 pb-32 pt-40 sm:px-8">
          <div className="glass-panel mx-auto h-[55vh] max-w-7xl animate-pulse rounded-[28px] bg-white/[0.02]" />
        </section>
      </PageShell>
    );
  }

  if (!collection) {
    return (
      <PageShell>
        <section className="relative isolate px-5 pb-32 pt-40 text-center sm:px-8 sm:pt-52">
          <LiquidChrome
            className="left-1/2 top-16 h-[40rem] w-[40rem] -translate-x-1/2"
            opacity={0.14}
          />
          <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
            ZZ / CURRENT DROP
          </span>
          <h1 className="mt-7 font-display text-3xl tracking-[0.18em] text-foreground sm:text-5xl">
            NEW COLLECTION SOON
          </h1>
          <p className="mx-auto mt-6 max-w-xl font-editorial text-lg text-muted-foreground">
            No current collection is published right now.
          </p>
        </section>
      </PageShell>
    );
  }

  const drop = products.filter(
    (product) => product.collection_id === collection.id,
  );
  const featured = drop.filter((product) => product.featured).slice(0, 2);

  const number = String(collection.drop_number).padStart(3, "0");
  const title = collection.heading || collection.name || `DROP ${number}`;
  const name = collection.name;
  const label = collection.label || `ZZ / COLLECTION / ${number}`;
  const tagline = collection.tagline || "Objects for the Afterdark.";
  const description =
    collection.description ||
    "A study of metal, shadow and distortion. Objects designed for those who choose identity over conformity.";

  const hero =
    collection.hero_image ||
    collection.campaign_images?.[0] ||
    collection.editorial_images?.[0] ||
    "";

  const gallery = [
    ...(collection.campaign_images ?? []),
    ...(collection.editorial_images ?? []),
  ].filter(Boolean);

  return (
    <PageShell>
      <section className="relative isolate flex min-h-[92vh] flex-col justify-end overflow-hidden px-5 pb-20 pt-40 sm:px-8">
        {hero && (
          <SmartImage
            src={hero}
            alt={`DROP ${number} campaign`}
            width={1600}
            height={1200}
            eager
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 grayscale"
          />
        )}

        <LiquidChrome
          className="left-1/2 top-1/3 h-[48rem] w-[48rem] -translate-x-1/2"
          opacity={0.22}
        />
        <div className="grain-overlay" />

        <div className="mx-auto w-full max-w-7xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.5em] text-muted-foreground">
              {label}
            </span>
            <h1 className="chrome-text mt-8 font-display text-[19vw] leading-[0.85] tracking-[0.04em] sm:text-[11rem]">
              {title}
            </h1>
            <p className="mt-6 font-editorial text-xl italic text-chrome/85 sm:text-3xl">
              {tagline}
            </p>
          </Reveal>
        </div>
      </section>

      <Marquee text={collection.marquee_text || undefined} />

      <section className="relative isolate px-5 py-28 sm:px-8 sm:py-36">
        <LiquidChrome
          className="-left-40 top-0 h-[34rem] w-[34rem]"
          opacity={0.14}
        />

        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.18em] text-foreground sm:text-4xl">
              DROP {number} — {name}
            </h2>
          </Reveal>

          <Reveal delay={160}>
            <div className="space-y-6 font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {description
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
            </div>

            <a
              href={collection.button_href || "/shop"}
              className="group mt-12 inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-700 hover:border-chrome hover:bg-white/[0.08]"
            >
              {collection.button_label || `Shop Drop ${number}`}
              <span className="transition-transform duration-700 group-hover:translate-x-1">→</span>
            </a>
          </Reveal>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-5 pb-8 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                FEATURED OBJECTS
              </span>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6">
              {featured.map((product, index) => (
                <Reveal key={product.id} delay={index * 140}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {gallery.length > 0 && (
        <section className="px-5 py-24 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 lg:grid-cols-12">
            {gallery.slice(0, 2).map((src, index) => (
              <Reveal
                key={`${src}-${index}`}
                delay={index * 160}
                className={index === 0 ? "lg:col-span-7" : "lg:col-span-5"}
              >
                <figure className="glass-panel relative h-full overflow-hidden rounded-[26px]">
                  <SmartImage
                    src={src}
                    alt={`DROP ${number} editorial`}
                    width={1200}
                    height={1500}
                    className="h-full min-h-[360px] w-full object-cover grayscale"
                  />
                  <div className="grain-overlay" />
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="border-y border-border/50 py-5">
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              THE COLLECTION
            </span>
          </Reveal>

          <div className="mt-12">
            <ProductGrid
              products={drop}
              loading={loadingProducts}
              empty={`Drop ${number} has no published objects yet.`}
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
