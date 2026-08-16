import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { SmartImage } from "@/components/site/SmartImage";
import { ProductGrid } from "@/components/site/ProductGrid";
import { collectionBySlugQuery } from "@/lib/cms";
import { useAllPublishedProducts } from "@/lib/products";
import campaign1 from "@/assets/campaign-1.jpg";

export const Route = createFileRoute("/archive/$slug")({
  component: ArchivedCollectionPage,
});

function ArchivedCollectionPage() {
  const { slug } = Route.useParams();
  const { data: collection, isLoading } = useQuery(collectionBySlugQuery(slug));
  const { data: products = [], isLoading: loadingProducts } = useAllPublishedProducts();

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto max-w-7xl px-5 py-40 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading collection…
        </div>
      </PageShell>
    );
  }

  if (!collection || !collection.published || !collection.archived) {
    return (
      <PageShell>
        <section className="mx-auto max-w-5xl px-5 py-40">
          <h1 className="font-display text-2xl tracking-[0.2em] text-foreground">
            COLLECTION NOT FOUND
          </h1>
          <Link
            to="/archive"
            className="mt-8 inline-block text-[9px] uppercase tracking-[0.35em] text-chrome"
          >
            Back to archive
          </Link>
        </section>
      </PageShell>
    );
  }

  const number = String(collection.drop_number).padStart(3, "0");
  const collectionProducts = products.filter((p) => p.collection_id === collection.id);
  const gallery = [
    ...(collection.campaign_images ?? []),
    ...(collection.editorial_images ?? []),
  ];
  const hero = collection.hero_image || gallery[0] || campaign1;

  return (
    <PageShell>
      <section className="relative isolate flex min-h-[75vh] items-end overflow-hidden px-5 pb-20 pt-40 sm:px-8">
        <SmartImage
          src={hero}
          alt={`DROP ${number} — ${collection.name}`}
          eager
          width={1600}
          height={1200}
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30 grayscale"
        />
        <LiquidChrome
          className="left-1/2 top-1/3 h-[42rem] w-[42rem] -translate-x-1/2"
          opacity={0.18}
        />
        <div className="grain-overlay" />
        <div className="mx-auto w-full max-w-7xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              ZZ / ARCHIVE / {collection.year}
            </span>
            <h1 className="chrome-text mt-8 font-display text-5xl tracking-[0.06em] sm:text-7xl">
              DROP {number}
            </h1>
            <p className="mt-6 font-display text-xl tracking-[0.2em] text-foreground">
              {collection.name}
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 py-28 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="font-editorial text-xl italic text-chrome/80">
              {collection.tagline}
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="font-editorial text-lg leading-relaxed text-muted-foreground">
              {collection.description}
            </div>
          </Reveal>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="px-5 pb-24 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gallery.slice(0, 6).map((src, i) => (
              <Reveal key={`${src}-${i}`} delay={(i % 3) * 100}>
                <SmartImage
                  src={src}
                  alt={`${collection.name} archive editorial`}
                  width={1000}
                  height={1250}
                  className="aspect-4/5 w-full rounded-[24px] border border-border/50 object-cover grayscale"
                />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <Reveal className="border-y border-border/50 py-5">
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              ARCHIVED OBJECTS
            </span>
          </Reveal>
          <div className="mt-12">
            <ProductGrid
              products={collectionProducts}
              loading={loadingProducts}
              empty="No published objects are assigned to this archived collection."
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
