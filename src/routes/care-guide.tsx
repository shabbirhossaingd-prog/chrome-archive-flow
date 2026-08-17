import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { Reveal } from "@/components/site/Reveal";
import { useSite } from "@/lib/settings";

export const Route = createFileRoute("/care-guide")({
  head: () => ({
    meta: [
      { title: "Care Guide — ZZERKOFF" },
      {
        name: "description",
        content:
          "How to care for ZZERKOFF chrome, stainless and alternative accessories.",
      },
    ],
  }),
  component: CareGuidePage,
});

const sections = [
  {
    title: "KEEP IT DRY",
    body:
      "Remove accessories before showering, swimming or heavy exposure to water. Dry immediately if the object gets wet.",
  },
  {
    title: "AVOID CHEMICALS",
    body:
      "Perfume, hairspray, sanitizer and cleaning chemicals can dull a polished surface. Apply them before wearing the object.",
  },
  {
    title: "AFTER WEAR",
    body:
      "Wipe metal with a clean soft dry cloth. This removes skin oils and keeps the finish clearer for longer.",
  },
  {
    title: "STORE SEPARATELY",
    body:
      "Keep pieces dry and separated so chains, rings and hard metal surfaces do not scratch each other.",
  },
  {
    title: "CHAINS & CLASPS",
    body:
      "Open clasps gently and store chains flat or hanging. Do not force links, jump rings or decorative hardware.",
  },
  {
    title: "PATINA / FINISH",
    body:
      "Vintage, oxidized or distressed finishes can change gradually with wear. That evolution is part of the object unless the product description says otherwise.",
  },
];

function CareGuidePage() {
  const site = useSite();

  return (
    <PageShell>
      <section className="px-5 pb-24 pt-32 sm:px-8 sm:pt-40">
        <div className="mx-auto max-w-5xl">
          <PageHeading
            label="ZZERKOFF / OBJECT CARE"
            title="CARE GUIDE"
            sub="Keep the metal alive."
          />

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {sections.map((section, index) => (
              <Reveal key={section.title} delay={index * 70}>
                <article className="glass-panel h-full rounded-[24px] p-6">
                  <span className="text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
                    ZZ / {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="mt-4 font-display text-sm tracking-[0.16em] text-foreground">
                    {section.title}
                  </h2>
                  <p className="mt-4 text-xs leading-relaxed tracking-[0.05em] text-muted-foreground">
                    {section.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="glass-panel mt-6 rounded-[24px] p-6">
            <p className="font-editorial text-lg leading-relaxed text-muted-foreground">
              Product-specific care instructions always take priority. If you are
              unsure about a finish, contact {site.brand} before using any cleaner
              or polish.
            </p>
            <a
              href={site.wa(`Hi ${site.brand}, I need care advice for an object.`)}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.3em] text-foreground"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
