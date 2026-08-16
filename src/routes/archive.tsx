import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { SmartImage } from "@/components/site/SmartImage";
import { useArchivedCollections } from "@/lib/cms";
import campaign1 from "@/assets/campaign-1.jpg";
import campaign2 from "@/assets/campaign-2.jpg";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "The Archive — ZZERKOFF past drops" },
      {
        name: "description",
        content:
          "Past ZZERKOFF objects, visual series and collections. An underground archive of chrome and vintage metal.",
      },
      { property: "og:title", content: "The Archive — ZZERKOFF" },
      {
        property: "og:description",
        content: "Past objects, visual series and collections from the ZZERKOFF archive.",
      },
    ],
  }),
  component: ArchivePage,
});

function ArchivePage() {
  const { data: drops = [], isLoading } = useArchivedCollections();
  const visuals = drops.flatMap((d) => [
    ...(d.campaign_images ?? []),
    ...(d.editorial_images ?? []),
  ]);
  const gallery = visuals.length ? visuals : [campaign1, campaign2, campaign1];

  return (
    <PageShell>
      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome className="-right-44 top-10 h-[38rem] w-[38rem]" opacity={0.15} flip />
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <PageHeading
              label="PAST OBJECTS / VISUAL SERIES / COLLECTIONS"
              title="THE ARCHIVE"
            />
          </Reveal>

          <div className="mt-16 space-y-6 pb-16">
            {isLoading && (
              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                Loading archive…
              </p>
            )}

            {!isLoading && drops.length === 0 && (
              <div className="glass-panel rounded-[28px] p-8 text-sm text-muted-foreground">
                No archived collections yet.
              </div>
            )}

            {drops.map((d, i) => {
              const number = String(d.drop_number).padStart(3, "0");
              const image = d.hero_image || d.campaign_images?.[0] || campaign1;
              return (
                <Reveal key={d.id} delay={i * 140}>
                  <Link
                    to="/archive/$slug"
                    params={{ slug: d.slug }}
                    className="group glass-panel grid overflow-hidden rounded-[28px] lg:grid-cols-[45fr_55fr]"
                  >
                    <div className="relative overflow-hidden bg-black">
                      <SmartImage
                        src={image}
                        alt={`DROP ${number} — ${d.name}`}
                        width={1200}
                        height={900}
                        className="aspect-4/3 w-full object-cover grayscale brightness-90 transition-transform duration-[1800ms] ease-out group-hover:scale-105"
                      />
                      <div className="grain-overlay" />
                    </div>
                    <div className="flex flex-col justify-between gap-10 p-7 sm:p-10">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                          DROP {number}
                        </span>
                        <h2 className="mt-6 font-display text-2xl tracking-[0.2em] text-foreground sm:text-4xl">
                          {d.name}
                        </h2>
                        <p className="mt-5 font-editorial text-lg italic text-chrome/80">{d.year}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground transition-all duration-700 group-hover:translate-x-1 group-hover:text-foreground">
                        View collection →
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 lg:grid-cols-3">
          {gallery.slice(0, 6).map((src, i) => (
            <Reveal key={`${src}-${i}`} delay={(i % 3) * 120}>
              <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                <SmartImage
                  src={src}
                  alt="ZZERKOFF archive visual"
                  width={1200}
                  height={1500}
                  className="aspect-4/5 w-full object-cover grayscale"
                />
                <div className="grain-overlay" />
              </figure>
            </Reveal>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
