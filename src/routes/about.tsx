import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import campaign1 from "@/assets/campaign-1.jpg";
import campaign2 from "@/assets/campaign-2.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "This is ZZERKOFF — About the label" },
      {
        name: "description",
        content:
          "ZZERKOFF is a unisex accessories label built on vintage metal, chrome, gothic fashion, Y2K and underground street culture.",
      },
      { property: "og:title", content: "This is ZZERKOFF — About the label" },
      {
        property: "og:description",
        content: "Not made to blend in. Objects for the afterdark, made in Dhaka.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <section className="relative isolate overflow-hidden px-5 pt-40 sm:px-8 sm:pt-56">
        <LiquidChrome
          className="left-1/2 top-24 h-[46rem] w-[46rem] -translate-x-1/2"
          opacity={0.2}
        />
        <div className="mx-auto max-w-4xl">
          <Reveal>
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              ZZ / LABEL
            </span>
            <h1 className="chrome-text mt-8 font-display text-4xl leading-[1.05] tracking-[0.1em] sm:text-6xl">
              THIS IS
              <br />
              ZZERKOFF.
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <div className="mt-16 max-w-2xl space-y-8 font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              <p>
                Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic
                fashion, Y2K and underground street culture.
              </p>
              <p>Created for people who choose bold identities over ordinary trends.</p>
              <p>
                We explore metal, distortion and alternative forms through objects designed to
                become part of personal identity.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-5 py-36 sm:px-8 sm:py-48">
        <LiquidChrome className="-left-40 top-10 h-[36rem] w-[36rem]" opacity={0.14} flip />
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="chrome-text font-display text-4xl leading-[1.08] tracking-[0.06em] sm:text-6xl lg:text-7xl">
              NOT MADE
              <br />
              TO BLEND IN.
            </h2>
          </Reveal>
          <Reveal delay={200}>
            <p className="mt-14 font-editorial text-2xl italic text-chrome/80 sm:text-3xl">
              Objects for the Afterdark.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 lg:grid-cols-3">
          {[campaign1, campaign2, campaign1].map((src, i) => (
            <Reveal key={i} delay={i * 140}>
              <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                <img
                  src={src}
                  alt="ZZERKOFF campaign imagery"
                  loading="lazy"
                  width={1200}
                  height={1500}
                  className="aspect-4/5 w-full object-cover grayscale brightness-90"
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