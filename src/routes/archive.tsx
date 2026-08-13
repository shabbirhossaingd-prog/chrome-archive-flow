import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import campaign1 from "@/assets/campaign-1.jpg";
import campaign2 from "@/assets/campaign-2.jpg";

/** Add future drops here — each entry becomes an archive card. */
const DROPS = [
  {
    number: "001",
    title: "AFTERDARK",
    year: "2026",
    image: campaign1,
    to: "/collection" as const,
  },
];

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
            {DROPS.map((d, i) => (
              <Reveal key={d.number} delay={i * 140}>
                <Link
                  to={d.to}
                  className="group glass-panel grid overflow-hidden rounded-[28px] lg:grid-cols-[45fr_55fr]"
                >
                  <div className="relative overflow-hidden bg-black">
                    <img
                      src={d.image}
                      alt={`DROP ${d.number} — ${d.title}`}
                      loading="lazy"
                      width={1200}
                      height={900}
                      className="aspect-4/3 w-full object-cover grayscale brightness-90 transition-transform duration-[1800ms] ease-out group-hover:scale-105"
                    />
                    <div className="grain-overlay" />
                  </div>
                  <div className="flex flex-col justify-between gap-10 p-7 sm:p-10">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                        DROP {d.number}
                      </span>
                      <h2 className="mt-6 font-display text-2xl tracking-[0.2em] text-foreground sm:text-4xl">
                        {d.title}
                      </h2>
                      <p className="mt-5 font-editorial text-lg italic text-chrome/80">{d.year}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground transition-all duration-700 group-hover:translate-x-1 group-hover:text-foreground">
                      View collection →
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 sm:gap-6 lg:grid-cols-3">
          {[campaign1, campaign2, campaign1].map((src, i) => (
            <Reveal key={i} delay={i * 120}>
              <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                <img
                  src={src}
                  alt="ZZERKOFF archive visual"
                  loading="lazy"
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