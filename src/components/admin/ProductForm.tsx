import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllCategories, type Product } from "@/lib/products";
import { STOCK_OPTIONS } from "@/lib/site-config";
import { reserveProductCode } from "@/lib/admin.functions";
import { ImageUploader } from "./ImageUploader";
import { AdminButton, Field, Toggle, adminField } from "./AdminUI";

type Draft = {
  name: string;
  slug: string;
  category: string;
  price: string;
  old_price: string;
  quantity_available: string;
  stock_status: string;
  short_description: string;
  full_description: string;
  material: string;
  sizes: string;
  finish: string;
  collection_name: string;
  size_guide: string;
  care: string;
  delivery: string;
  featured: boolean;
  new_collection: boolean;
  archived: boolean;
  published: boolean;
  whatsapp_available: boolean;
  primary_image: string;
  gallery_images: string[];
  sort_order: string;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const csv = (arr: string[] | null | undefined) => (arr ?? []).join(", ");
const fromCsv = (s: string) =>
  s
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

function toDraft(p?: Product): Draft {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    category: p?.category ?? "",
    price: p ? String(p.price) : "",
    old_price: p?.old_price != null ? String(p.old_price) : "",
    quantity_available: p ? String(p.quantity_available) : "1",
    stock_status: p?.stock_status ?? "IN STOCK",
    short_description: p?.short_description ?? "",
    full_description: p?.full_description ?? "",
    material: p?.material ?? "",
    sizes: csv(p?.sizes),
    finish: csv(p?.finish),
    collection_name: p?.collection_name ?? "DROP 001",
    size_guide: p?.size_guide ?? "",
    care: p?.care ?? "",
    delivery: p?.delivery ?? "",
    featured: p?.featured ?? false,
    new_collection: p?.new_collection ?? false,
    archived: p?.archived ?? false,
    published: p?.published ?? true,
    whatsapp_available: p?.whatsapp_available ?? true,
    primary_image: p?.primary_image ?? "",
    gallery_images: p?.gallery_images ?? [],
    sort_order: p ? String(p.sort_order) : "0",
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const [d, setD] = useState<Draft>(() => toDraft(product));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useAllCategories();
  const getCode = useServerFn(reserveProductCode);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((prev) => ({ ...prev, [key]: value }));

  const save = useMutation({
    mutationFn: async () => {
      if (!d.name.trim()) throw new Error("Name is required");
      if (!d.category) throw new Error("Pick a category");
      if (!d.primary_image) throw new Error("Add a main image");

      const payload = {
        name: d.name.trim(),
        slug: d.slug.trim() || slugify(d.name),
        category: d.category,
        price: Number(d.price || 0),
        old_price: d.old_price ? Number(d.old_price) : null,
        quantity_available: Number(d.quantity_available || 0),
        stock_status: d.stock_status,
        short_description: d.short_description,
        full_description: d.full_description,
        material: d.material,
        sizes: fromCsv(d.sizes),
        finish: fromCsv(d.finish),
        collection_name: d.collection_name,
        size_guide: d.size_guide,
        care: d.care,
        delivery: d.delivery,
        featured: d.featured,
        new_collection: d.new_collection,
        archived: d.archived,
        published: d.published,
        whatsapp_available: d.whatsapp_available,
        primary_image: d.primary_image,
        gallery_images: d.gallery_images,
        sort_order: Number(d.sort_order || 0),
      };

      if (product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
        return product.slug;
      }

      const { code } = await getCode({ data: { category: d.category } });
      const { error } = await supabase
        .from("products")
        .insert({ ...payload, product_code: code });
      if (error) throw error;
      return payload.slug;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(product ? "Object updated" : "Object created");
      navigate({ to: "/admin" });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-8"
    >
      <div className="glass-panel space-y-6 rounded-[24px] p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Name">
            <input
              className={adminField}
              value={d.name}
              onChange={(e) => {
                const name = e.target.value;
                setD((prev) => ({
                  ...prev,
                  name,
                  slug: product ? prev.slug : slugify(name),
                }));
              }}
            />
          </Field>
          <Field label="Slug (URL)">
            <input
              className={adminField}
              value={d.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
            />
          </Field>
          <Field label="Category">
            <select
              className={adminField}
              value={d.category}
              onChange={(e) => set("category", e.target.value)}
            >
              <option value="">SELECT…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name} ({c.code_prefix})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Collection">
            <input
              className={adminField}
              value={d.collection_name}
              onChange={(e) => set("collection_name", e.target.value)}
            />
          </Field>
          <Field label="Price">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </Field>
          <Field label="Old price (optional)">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.old_price}
              onChange={(e) => set("old_price", e.target.value)}
            />
          </Field>
          <Field label="Quantity available">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.quantity_available}
              onChange={(e) => set("quantity_available", e.target.value)}
            />
          </Field>
          <Field label="Stock status">
            <select
              className={adminField}
              value={d.stock_status}
              onChange={(e) => set("stock_status", e.target.value)}
            >
              {STOCK_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Material">
            <input
              className={adminField}
              value={d.material}
              onChange={(e) => set("material", e.target.value)}
            />
          </Field>
          <Field label="Sort order">
            <input
              className={adminField}
              type="number"
              value={d.sort_order}
              onChange={(e) => set("sort_order", e.target.value)}
            />
          </Field>
          <Field label="Sizes (comma separated)">
            <input
              className={adminField}
              value={d.sizes}
              onChange={(e) => set("sizes", e.target.value)}
            />
          </Field>
          <Field label="Finishes (comma separated)">
            <input
              className={adminField}
              value={d.finish}
              onChange={(e) => set("finish", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Short description">
          <textarea
            className={adminField}
            rows={2}
            value={d.short_description}
            onChange={(e) => set("short_description", e.target.value)}
          />
        </Field>
        <Field label="Full description">
          <textarea
            className={adminField}
            rows={5}
            value={d.full_description}
            onChange={(e) => set("full_description", e.target.value)}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Size guide">
            <textarea
              className={adminField}
              rows={3}
              value={d.size_guide}
              onChange={(e) => set("size_guide", e.target.value)}
            />
          </Field>
          <Field label="Care">
            <textarea
              className={adminField}
              rows={3}
              value={d.care}
              onChange={(e) => set("care", e.target.value)}
            />
          </Field>
          <Field label="Delivery">
            <textarea
              className={adminField}
              rows={3}
              value={d.delivery}
              onChange={(e) => set("delivery", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="glass-panel space-y-7 rounded-[24px] p-6">
        <ImageUploader
          label="Main image"
          max={1}
          value={d.primary_image ? [d.primary_image] : []}
          onChange={(next) => set("primary_image", next[0] ?? "")}
        />
        <ImageUploader
          label="Gallery images"
          max={5}
          value={d.gallery_images}
          onChange={(next) => set("gallery_images", next)}
        />
      </div>

      <div className="glass-panel rounded-[24px] p-6">
        <div className="flex flex-wrap gap-3">
          <Toggle
            label={d.published ? "Published" : "Draft"}
            checked={d.published}
            onChange={(v) => set("published", v)}
          />
          <Toggle label="Featured" checked={d.featured} onChange={(v) => set("featured", v)} />
          <Toggle
            label="New collection"
            checked={d.new_collection}
            onChange={(v) => set("new_collection", v)}
          />
          <Toggle label="Archive" checked={d.archived} onChange={(v) => set("archived", v)} />
          <Toggle
            label="WhatsApp order"
            checked={d.whatsapp_available}
            onChange={(v) => set("whatsapp_available", v)}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <AdminButton type="submit" tone="primary" disabled={save.isPending}>
          {save.isPending ? "Saving…" : product ? "Save object" : "Create object"}
        </AdminButton>
        <AdminButton onClick={() => navigate({ to: "/admin" })}>Cancel</AdminButton>
      </div>
    </form>
  );
}