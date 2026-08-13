import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { SITE, whatsappUrl } from "@/lib/site-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Enter the Dark — Contact ZZERKOFF" },
      {
        name: "description",
        content:
          "Questions, orders or collaborations. Reach ZZERKOFF on WhatsApp, Instagram or email.",
      },
      { property: "og:title", content: "Enter the Dark — Contact ZZERKOFF" },
      { property: "og:description", content: "Questions, orders or collaborations." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email").max(255),
  message: z.string().trim().min(1, "Write a message").max(1000, "Message is too long"),
});

const field =
  "w-full rounded-xl border border-border/70 bg-black/40 px-4 py-4 text-xs tracking-[0.15em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chrome/60";
const label = "mb-3 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground";

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast("Check your details", { description: parsed.error.issues[0]?.message });
      return;
    }
    const text = `Hi ${SITE.brand},\n\nName: ${parsed.data.name}\nEmail: ${parsed.data.email}\n\n${parsed.data.message}`;
    window.open(whatsappUrl(text), "_blank", "noopener");
    toast("Message ready", { description: "We opened WhatsApp with your message." });
    setForm({ name: "", email: "", message: "" });
  };

  const cards = [
    {
      title: "WHATSAPP",
      sub: "ORDER / SUPPORT",
      cta: "MESSAGE US →",
      href: whatsappUrl(`Hi ${SITE.brand}, I have a question.`),
    },
    {
      title: "INSTAGRAM",
      sub: SITE.instagramHandle,
      cta: "FOLLOW →",
      href: SITE.instagramUrl,
    },
    {
      title: "EMAIL",
      sub: SITE.email,
      cta: "WRITE →",
      href: `mailto:${SITE.email}`,
    },
  ];

  return (
    <PageShell>
      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome
          className="left-1/2 top-10 h-[40rem] w-[40rem] -translate-x-1/2"
          opacity={0.18}
        />
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <PageHeading
              label="ZZ / CONTACT"
              title="ENTER THE DARK."
              sub="Questions, orders or collaborations."
            />
          </Reveal>

          <div className="mt-16 grid gap-4 sm:gap-6 lg:grid-cols-3">
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 130}>
                <div className="glass-panel flex h-full flex-col justify-between gap-10 rounded-[26px] p-7">
                  <div>
                    <h2 className="font-display text-sm tracking-[0.3em] text-foreground">
                      {c.title}
                    </h2>
                    <p className="mt-4 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                      {c.sub}
                    </p>
                  </div>
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-chrome/40 px-6 py-4 text-center text-[10px] uppercase tracking-[0.4em] text-foreground transition-all duration-500 hover:border-chrome hover:bg-white/[0.06]"
                  >
                    {c.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-28 sm:px-8 sm:py-36">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <form onSubmit={submit} className="glass-panel space-y-6 rounded-[28px] p-7 sm:p-10">
              <div>
                <label className={label} htmlFor="c-name">
                  Name
                </label>
                <input
                  id="c-name"
                  maxLength={100}
                  className={field}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className={label} htmlFor="c-email">
                  Email
                </label>
                <input
                  id="c-email"
                  type="email"
                  maxLength={255}
                  className={field}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className={label} htmlFor="c-message">
                  Message
                </label>
                <textarea
                  id="c-message"
                  rows={5}
                  maxLength={1000}
                  className={field}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-full border border-chrome/50 bg-white/[0.04] px-6 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-500 hover:border-chrome hover:bg-white/[0.08]"
              >
                Send message →
              </button>
            </form>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}