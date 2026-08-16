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

type AboutJson = {
  statement?: string;
  tagline?: string;
  campaign_images?: string[];
  blocks?: Array<{ heading?: string; body?: string }>;
};

type ShopJson = {
  show_filters?: boolean;
  show_categories?: boolean;
  sort?: string;
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
  show_categories: boolean;
  per_section: string;
};

function fromPage(p: Page): Form {
  const json = (p.content_json ?? {}) as AboutJson & ShopJson;
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
    show_categories: json.show_categories ?? true,
    per_section: String(json.per_section ?? 12),
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

  const save = useMutation({
    mutationFn: async () => {
      if (!form || !currentPage) throw new Error("Select a page");
      const existing = (currentPage.content_json ?? {}) as Record<string, unknown>;
      let content_json: Record<string, unknown> = { ...existing };

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
          show_categories: form.show_categories,
          per_section: Math.max(1, Number(form.per_section || 12)),
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
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save page"),
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          PUBLIC CONTENT / CMS
        </span>
        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">PAGES</h1>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading pages…
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                    placeholder={"NOT MADE\nTO BLEND IN."}
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
                <div className="flex flex-wrap gap-3">
                  <Toggle
                    label="Show filters"
                    checked={form.show_filters}
                    onChange={(v) => set("show_filters", v)}
                  />
                  <Toggle
                    label="Show categories"
                    checked={form.show_categories}
                    onChange={(v) => set("show_categories", v)}
                  />
                </div>
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

          <AdminButton tone="primary" disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving changes…" : "Save page"}
          </AdminButton>
        </div>
      )}
    </div>
  );
}
