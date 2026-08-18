import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePages, type Page } from "@/lib/cms";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminButton, Field, Toggle, adminField } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/pages")({
  component: AdminPages,
});

type HomeSection = {
  id: string;
  type: "promo" | "offer" | "editorial" | "announcement" | "shop-look" | "cta";
  enabled: boolean;
  title: string;
  body: string;
  image: string;
  button_label: string;
  button_href: string;
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

type AboutJson = {
  statement?: string;
  tagline?: string;
  campaign_images?: string[];
};

type ShopJson = {
  show_filters?: boolean;
  per_section?: number;
};

type Form = {
  id: string;
  page_key: string;
  label: string;
  title: string;
  subtitle: string;
  body: string;
  hero_image: string;
  seo_title: string;
  seo_description: string;

  statement: string;
  tagline: string;
  campaign_images: string[];

  show_filters: boolean;
  per_section: string;

  hero_eyebrow: string;
  hero_cta_label: string;
  hero_cta_href: string;
  show_current_drop: boolean;
  show_featured: boolean;
  show_categories: boolean;
  statement_title: string;
  statement_body: string;
  about_title: string;
  about_body: string;
  archive_images: string[];
  sections: HomeSection[];
};

function fromPage(p: Page): Form {
  const json = (p.content_json ?? {}) as AboutJson & ShopJson & HomeJson;

  return {
    id: p.id,
    page_key: p.page_key,
    label: p.label,
    title: p.title,
    subtitle: p.subtitle,
    body: p.body,
    hero_image: p.hero_image,
    seo_title: p.seo_title,
    seo_description: p.seo_description,

    statement: json.statement ?? "",
    tagline: json.tagline ?? "",
    campaign_images: json.campaign_images ?? [],

    show_filters: json.show_filters ?? true,
    per_section: String(json.per_section ?? 100),

    hero_eyebrow: json.hero_eyebrow ?? "Unisex / Chrome / Vintage / Underground",
    hero_cta_label: json.hero_cta_label ?? "",
    hero_cta_href: json.hero_cta_href ?? "",
    show_current_drop: json.show_current_drop ?? true,
    show_featured: json.show_featured ?? true,
    show_categories: json.show_categories ?? true,
    statement_title: json.statement_title ?? "NOT MADE\nTO BLEND IN.",
    statement_body:
      json.statement_body ??
      "ZZERKOFF explores metal, distortion, vintage forms and underground culture through unisex accessories.",
    about_title: json.about_title ?? "THIS IS ZZERKOFF.",
    about_body:
      json.about_body ??
      "Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic fashion, Y2K and underground street culture.\n\nCreated for people who prefer bold identities over ordinary trends.\n\nFor those who don't blend in.",
    archive_images: json.archive_images ?? [],
    sections: json.sections ?? [],
  };
}

function AdminPages() {
  const { data: pages = [], isLoading } = usePages();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [dirty, setDirty] = useState(false);

  const currentPage = useMemo(
    () => pages.find((p) => p.id === form?.id) ?? null,
    [pages, form?.id],
  );

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    if (!form) return;
    setDirty(true);
    setForm({ ...form, [key]: value });
  };

  const patchSection = (id: string, values: Partial<HomeSection>) => {
    if (!form) return;
    setDirty(true);
    setForm({
      ...form,
      sections: form.sections.map((section) =>
        section.id === id ? { ...section, ...values } : section,
      ),
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    if (!form) return;
    const target = index + direction;
    if (target < 0 || target >= form.sections.length) return;
    const next = [...form.sections];
    [next[index], next[target]] = [next[target], next[index]];
    setDirty(true);
    setForm({ ...form, sections: next });
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!form || !currentPage) throw new Error("Select a page");

      let content_json = {
        ...((currentPage.content_json ?? {}) as Record<string, unknown>),
      };

      if (form.page_key === "about") {
        content_json = {
          ...content_json,
          statement: form.statement,
          tagline: form.tagline,
          campaign_images: form.campaign_images,
        };
      }

      if (form.page_key === "shop") {
        content_json = {
          ...content_json,
          show_filters: form.show_filters,
          per_section: Math.max(1, Number(form.per_section || 100)),
        };
        delete content_json.show_categories;
      }

      if (form.page_key === "home") {
        content_json = {
          ...content_json,
          hero_eyebrow: form.hero_eyebrow,
          hero_cta_label: form.hero_cta_label,
          hero_cta_href: form.hero_cta_href,
          show_current_drop: form.show_current_drop,
          show_featured: form.show_featured,
          show_categories: form.show_categories,
          statement_title: form.statement_title,
          statement_body: form.statement_body,
          about_title: form.about_title,
          about_body: form.about_body,
          archive_images: form.archive_images,
          sections: form.sections,
        };
      }

      const { error } = await supabase
        .from("pages")
        .update({
          label: form.label,
          title: form.title,
          subtitle: form.subtitle,
          body: form.body,
          hero_image: form.hero_image,
          seo_title: form.seo_title,
          seo_description: form.seo_description,
          content_json: content_json as never,
        })
        .eq("id", form.id);

      if (error) throw error;
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["pages"] });
      toast.success("Page updated successfully.");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not save page"),
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          PUBLIC CONTENT / CMS
        </span>
        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
          PAGES
        </h1>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading pages…
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              if (dirty && !confirm("Discard unsaved page changes?")) return;
              setForm(fromPage(p));
              setDirty(false);
            }}
            className={`glass-panel rounded-[20px] p-5 text-left ${
              form?.id === p.id ? "border-chrome/70" : ""
            }`}
          >
            <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
              {p.page_key}
            </span>
            <p className="mt-3 font-display text-sm tracking-[0.18em] text-foreground">
              {p.title || p.page_key.toUpperCase()}
            </p>
            <span className="mt-4 block text-[8px] uppercase tracking-[0.3em] text-chrome">
              Edit →
            </span>
          </button>
        ))}
      </div>

      {form && (
        <div className="space-y-6">
          <div className="glass-panel space-y-6 rounded-[24px] p-6">
            <div>
              <span className="text-[8px] uppercase tracking-[0.4em] text-muted-foreground">
                EDITING
              </span>
              <h2 className="mt-2 font-display text-base tracking-[0.2em] text-foreground">
                {form.page_key.toUpperCase()}
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Small label">
                <input
                  className={adminField}
                  value={form.label}
                  onChange={(e) => set("label", e.target.value)}
                />
              </Field>
              <Field label="Main title">
                <input
                  className={adminField}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </Field>
            </div>

            <Field label="Subtitle / intro">
              <textarea
                className={adminField}
                rows={3}
                value={form.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
              />
            </Field>

            <Field label="Body / brand story">
              <textarea
                className={adminField}
                rows={7}
                value={form.body}
                onChange={(e) => set("body", e.target.value)}
              />
            </Field>
          </div>

          <div className="glass-panel space-y-6 rounded-[24px] p-6">
            <ImageUploader
              label="Hero / decorative image"
              max={1}
              value={form.hero_image ? [form.hero_image] : []}
              onChange={(v) => set("hero_image", v[0] ?? "")}
            />

            {form.page_key === "about" && (
              <>
                <Field label="Secondary statement">
                  <textarea
                    className={adminField}
                    rows={3}
                    value={form.statement}
                    onChange={(e) => set("statement", e.target.value)}
                  />
                </Field>
                <Field label="Tagline">
                  <input
                    className={adminField}
                    value={form.tagline}
                    onChange={(e) => set("tagline", e.target.value)}
                  />
                </Field>
                <ImageUploader
                  label="Campaign images"
                  max={6}
                  value={form.campaign_images}
                  onChange={(v) => set("campaign_images", v)}
                />
              </>
            )}

            {form.page_key === "shop" && (
              <div className="space-y-4">
                <Toggle
                  label="Show filters"
                  checked={form.show_filters}
                  onChange={(v) => set("show_filters", v)}
                />
                <Field label="Products per section">
                  <input
                    className={adminField}
                    type="number"
                    min={1}
                    max={100}
                    value={form.per_section}
                    onChange={(e) => set("per_section", e.target.value)}
                  />
                </Field>
              </div>
            )}

            {form.page_key === "home" && (
              <div className="space-y-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Hero eyebrow">
                    <input
                      className={adminField}
                      value={form.hero_eyebrow}
                      onChange={(e) => set("hero_eyebrow", e.target.value)}
                    />
                  </Field>
                  <Field label="Hero CTA label (optional)">
                    <input
                      className={adminField}
                      value={form.hero_cta_label}
                      onChange={(e) => set("hero_cta_label", e.target.value)}
                    />
                  </Field>
                  <Field label="Hero CTA URL (optional)">
                    <input
                      className={adminField}
                      value={form.hero_cta_href}
                      onChange={(e) => set("hero_cta_href", e.target.value)}
                      placeholder="/shop"
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Toggle
                    label="Current drop"
                    checked={form.show_current_drop}
                    onChange={(v) => set("show_current_drop", v)}
                  />
                  <Toggle
                    label="Featured"
                    checked={form.show_featured}
                    onChange={(v) => set("show_featured", v)}
                  />
                  <Toggle
                    label="Shop by object"
                    checked={form.show_categories}
                    onChange={(v) => set("show_categories", v)}
                  />
                </div>

                <Field label="Statement title">
                  <textarea
                    className={adminField}
                    rows={2}
                    value={form.statement_title}
                    onChange={(e) => set("statement_title", e.target.value)}
                  />
                </Field>
                <Field label="Statement body">
                  <textarea
                    className={adminField}
                    rows={4}
                    value={form.statement_body}
                    onChange={(e) => set("statement_body", e.target.value)}
                  />
                </Field>
                <Field label="About title">
                  <input
                    className={adminField}
                    value={form.about_title}
                    onChange={(e) => set("about_title", e.target.value)}
                  />
                </Field>
                <Field label="About body">
                  <textarea
                    className={adminField}
                    rows={6}
                    value={form.about_body}
                    onChange={(e) => set("about_body", e.target.value)}
                  />
                </Field>

                <ImageUploader
                  label="Home archive/editorial images"
                  max={3}
                  value={form.archive_images}
                  onChange={(v) => set("archive_images", v)}
                />

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-sm tracking-[0.22em] text-foreground">
                      CUSTOM HOME SECTIONS
                    </h3>
                    <AdminButton
                      onClick={() =>
                        set("sections", [
                          ...form.sections,
                          {
                            id: crypto.randomUUID(),
                            type: "promo",
                            enabled: true,
                            title: "NEW SECTION",
                            body: "",
                            image: "",
                            button_label: "",
                            button_href: "",
                          },
                        ])
                      }
                    >
                      + Add section
                    </AdminButton>
                  </div>

                  {form.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="space-y-4 rounded-2xl border border-border/50 p-4"
                    >
                      <div className="flex flex-wrap gap-2">
                        <Toggle
                          label="Enabled"
                          checked={section.enabled}
                          onChange={(value) =>
                            patchSection(section.id, { enabled: value })
                          }
                        />
                        <AdminButton
                          disabled={index === 0}
                          onClick={() => moveSection(index, -1)}
                        >
                          ↑
                        </AdminButton>
                        <AdminButton
                          disabled={index === form.sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                        >
                          ↓
                        </AdminButton>
                        <AdminButton
                          tone="danger"
                          onClick={() =>
                            set(
                              "sections",
                              form.sections.filter((item) => item.id !== section.id),
                            )
                          }
                        >
                          Delete
                        </AdminButton>
                      </div>

                      <Field label="Section type">
                        <select
                          className={adminField}
                          value={section.type}
                          onChange={(e) =>
                            patchSection(section.id, {
                              type: e.target.value as HomeSection["type"],
                            })
                          }
                        >
                          <option value="promo">PROMO BANNER</option>
                          <option value="offer">OFFER / SALE</option>
                          <option value="editorial">IMAGE + TEXT</option>
                          <option value="announcement">ANNOUNCEMENT</option>
                          <option value="shop-look">SHOP THE LOOK</option>
                          <option value="cta">CUSTOM CTA</option>
                        </select>
                      </Field>

                      <Field label="Title">
                        <input
                          className={adminField}
                          value={section.title}
                          onChange={(e) =>
                            patchSection(section.id, { title: e.target.value })
                          }
                        />
                      </Field>
                      <Field label="Body">
                        <textarea
                          className={adminField}
                          rows={3}
                          value={section.body}
                          onChange={(e) =>
                            patchSection(section.id, { body: e.target.value })
                          }
                        />
                      </Field>
                      <ImageUploader
                        label="Section image"
                        max={1}
                        value={section.image ? [section.image] : []}
                        onChange={(next) =>
                          patchSection(section.id, { image: next[0] ?? "" })
                        }
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Button label">
                          <input
                            className={adminField}
                            value={section.button_label}
                            onChange={(e) =>
                              patchSection(section.id, {
                                button_label: e.target.value,
                              })
                            }
                          />
                        </Field>
                        <Field label="Button URL">
                          <input
                            className={adminField}
                            value={section.button_href}
                            onChange={(e) =>
                              patchSection(section.id, {
                                button_href: e.target.value,
                              })
                            }
                            placeholder="/shop"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
              SEO & META
            </h2>
            <Field label="SEO title">
              <input
                className={adminField}
                value={form.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
              />
            </Field>
            <Field label="SEO description">
              <textarea
                className={adminField}
                rows={3}
                value={form.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
              />
            </Field>
          </div>

          <AdminButton
            tone="primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          >
            {save.isPending ? "Saving changes…" : "Save page"}
          </AdminButton>
        </div>
      )}
    </div>
  );
}
