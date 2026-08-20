import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllCategories, useAdminProducts, type Category } from "@/lib/products";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AdminButton, Field, Toggle, adminField } from "@/components/admin/AdminUI";
import { SmartImage } from "@/components/site/SmartImage";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: AdminCategories,
});

type Draft = {
  id?: string;
  name: string;
  slug: string;
  code_prefix: string;
  image_url: string;

  seo_title: string;
  seo_description: string;
  og_image: string;

  active: boolean;
  sort_order: string;
};

const blankDraft = (): Draft => ({
  name: "",
  slug: "",
  code_prefix: "",
  image_url: "",

  seo_title: "",
  seo_description: "",
  og_image: "",

  active: true,
  sort_order: "0",
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function AdminCategories() {
  const { data: categories = [], isLoading } = useAllCategories();
  const { data: products = [] } = useAdminProducts();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(blankDraft());
  const [dirty, setDirty] = useState(false);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.category, (map.get(product.category) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDirty(true);
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const reset = () => {
    setDraft(blankDraft());
    setDirty(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      const name = draft.name.trim();
      const slug = slugify(draft.slug || draft.name);
      const codePrefix = draft.code_prefix.trim().toUpperCase();

      if (!name) throw new Error("Category name is required");
      if (!slug) throw new Error("Category slug is required");
      if (!codePrefix) throw new Error("Code prefix is required");

      const { data: slugConflict, error: slugError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000")
        .limit(1);
      if (slugError) throw slugError;
      if (slugConflict?.length) throw new Error("That slug is already in use");

      const { data: prefixConflict, error: prefixError } = await supabase
        .from("categories")
        .select("id")
        .eq("code_prefix", codePrefix)
        .neq("id", draft.id ?? "00000000-0000-0000-0000-000000000000")
        .limit(1);
      if (prefixError) throw prefixError;
      if (prefixConflict?.length) throw new Error("That code prefix is already in use");

      const payload = {
        name,
        slug,
        code_prefix: codePrefix,
        image_url: draft.image_url || null,
        active: draft.active,
        sort_order: Number(draft.sort_order || 0),
      };

      if (draft.id) {
        const current = categories.find((item) => item.id === draft.id);
        if (current && current.slug !== slug && (usage.get(current.slug) ?? 0) > 0) {
          throw new Error("Move products out of this category before changing its slug");
        }
        const { error } = await supabase.from("categories").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(draft.id ? "Category updated" : "Category created");
      reset();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save category"),
  });

  const remove = useMutation({
    mutationFn: async (category: Category) => {
      const count = usage.get(category.slug) ?? 0;
      if (count > 0) {
        throw new Error("Move or remove products from this category before deleting.");
      }
      const { error } = await supabase.from("categories").delete().eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
      reset();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not delete category"),
  });

  return (
    <div className="space-y-8 pb-20">
      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          CATALOGUE / STRUCTURE
        </span>
        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
          CATEGORIES
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3">
          {isLoading && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Loading categories…
            </p>
          )}

          {categories.map((category) => {
            const count = usage.get(category.slug) ?? 0;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  if (dirty && !confirm("Discard unsaved category changes?")) return;
                  setDraft({
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    code_prefix: category.code_prefix,
                    image_url: category.image_url ?? "",
                    active: category.active,
                    sort_order: String(category.sort_order),
                  });
                  setDirty(false);
                }}
                className={`glass-panel flex w-full items-center gap-4 rounded-[20px] p-4 text-left ${
                  draft.id === category.id ? "border-chrome/70" : ""
                }`}
              >
                <SmartImage
                  src={category.image_url}
                  alt={category.name}
                  width={100}
                  height={120}
                  className="size-14 shrink-0 rounded-xl object-cover grayscale"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] uppercase tracking-[0.25em] text-foreground">
                    {category.name}
                  </p>
                  <p className="mt-2 text-[8px] uppercase tracking-[0.26em] text-muted-foreground">
                    {category.slug} · {category.code_prefix} · {count} {count === 1 ? "object" : "objects"}
                  </p>
                </div>
                <span className="text-[8px] uppercase tracking-[0.25em] text-chrome">
                  {category.active ? "ACTIVE" : "HIDDEN"}
                </span>
              </button>
            );
          })}

          <AdminButton
            onClick={() => {
              if (dirty && !confirm("Discard unsaved category changes?")) return;
              reset();
            }}
          >
            + New category
          </AdminButton>
        </div>

        <div className="glass-panel space-y-6 rounded-[24px] p-6">
          <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
            {draft.id ? "EDIT CATEGORY" : "NEW CATEGORY"}
          </h2>

          <Field label="Category name">
            <input
              className={adminField}
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                setDirty(true);
                setDraft((current) => ({
                  ...current,
                  name,
                  slug: current.id ? current.slug : slugify(name),
                }));
              }}
              placeholder="BELTS"
            />
          </Field>

          <Field label="Slug">
            <input
              className={adminField}
              value={draft.slug}
              onChange={(event) => set("slug", slugify(event.target.value))}
              placeholder="belts"
            />
          </Field>

          <Field label="Code prefix">
            <input
              className={adminField}
              value={draft.code_prefix}
              maxLength={6}
              onChange={(event) =>
                set("code_prefix", event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              placeholder="G"
            />
          </Field>

          <ImageUploader
            label="Category thumbnail"
            max={1}
            value={draft.image_url ? [draft.image_url] : []}
            onChange={(next) => set("image_url", next[0] ?? "")}
          />

          <div className="flex flex-wrap gap-3">
            <Toggle
              label="Active"
              checked={draft.active}
              onChange={(value) => set("active", value)}
            />
          </div>

          <Field label="Sort order">
            <input
              className={adminField}
              type="number"
              value={draft.sort_order}
              onChange={(event) => set("sort_order", event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <AdminButton tone="primary" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : draft.id ? "Save category" : "Create category"}
            </AdminButton>

            {draft.id && (
              <AdminButton
                tone="danger"
                disabled={remove.isPending}
                onClick={() => {
                  const category = categories.find((item) => item.id === draft.id);
                  if (!category) return;
                  if (confirm(`Delete ${category.name}?`)) remove.mutate(category);
                }}
              >
                Delete
              </AdminButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
