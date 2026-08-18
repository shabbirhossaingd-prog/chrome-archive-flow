import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllCategories, useAdminProducts, type Product } from "@/lib/products";
import { adminCollectionsQuery } from "@/lib/cms";
import { STOCK_OPTIONS } from "@/lib/site-config";
import { peekProductCode, reserveProductCode } from "@/lib/admin.functions";
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
  finish: string;
  fit_gender: string;
  tags: string;
  size_type: string;
  sizes: string;
  size_description: string;
  size_guide: string;
  details_content: string;
  material_content: string;
  care: string;
  delivery: string;
  collection_id: string;
  related_product_ids: string[];
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
    finish: csv(p?.finish),
    fit_gender: p?.fit_gender ?? "UNISEX",
    tags: csv(p?.tags),
    size_type: p?.size_type ?? "ONE SIZE",
    sizes: csv(p?.sizes),
    size_description: p?.size_description ?? "",
    size_guide: p?.size_guide ?? "",
    details_content: p?.details_content ?? "",
    material_content: p?.material_content ?? "",
    care: p?.care ?? "",
    delivery: p?.delivery ?? "",
    collection_id: p?.collection_id ?? "",
    related_product_ids: p?.related_product_ids ?? [],
    featured: p?.featured ?? false,
    new_collection: p?.new_collection ?? false,
    archived: p?.archived ?? false,
    published: p?.published ?? false,
    whatsapp_available: p?.whatsapp_available ?? true,
    primary_image: p?.primary_image ?? "",
    gallery_images: p?.gallery_images ?? [],
    sort_order: p ? String(p.sort_order) : "0",
  };
}

async function uniqueSlug(base: string, currentId?: string) {
  const clean = slugify(base) || `object-${Date.now()}`;

  for (let i = 0; i < 100; i += 1) {
    const candidate = i === 0 ? clean : `${clean}-${i + 1}`;
    let q = supabase.from("products").select("id").eq("slug", candidate).limit(1);

    if (currentId) q = q.neq("id", currentId);

    const { data, error } = await q;
    if (error) throw error;
    if (!data?.length) return candidate;
  }

  return `${clean}-${crypto.randomUUID().slice(0, 8)}`;
}

export function ProductForm({ product }: { product?: Product }) {
  const [d, setD] = useState<Draft>(() => toDraft(product));
  const [dirty, setDirty] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useAllCategories();
  const { data: products = [] } = useAdminProducts();
  const { data: collections = [] } = useQuery(adminCollectionsQuery);

  const reserveCode = useServerFn(reserveProductCode);
  const previewCode = useServerFn(peekProductCode);

  const selectableCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.active || category.slug === product?.category,
      ),
    [categories, product?.category],
  );

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === d.category) ?? null,
    [categories, d.category],
  );

  const { data: codePreview, isFetching: codeLoading } = useQuery({
    queryKey: ["product-code-preview", d.category],
    enabled: !product && !!d.category && selectedCategory?.active === true,
    queryFn: () => previewCode({ data: { category: d.category } }),
  });

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDirty(true);
    setD((prev) => ({ ...prev, [key]: value }));
  };

  const selectedCollection = useMemo(
    () => collections.find((c) => c.id === d.collection_id) ?? null,
    [collections, d.collection_id],
  );

  const relatedCandidates = products.filter((p) => p.id !== product?.id);

  const save = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      if (!d.name.trim()) throw new Error("Product name is required");
      if (!d.category) throw new Error("Pick a category");

      if (publish) {
        if (!d.primary_image) {
          throw new Error("Add a main image before publishing");
        }
        if (!selectedCategory?.active) {
          throw new Error("Activate this category before publishing the object");
        }
        if (d.archived) {
          throw new Error("Unarchive this object before publishing it to the storefront");
        }
      }

      const qty = Math.max(0, Number(d.quantity_available || 0));
      const status = qty <= 0 ? "SOLD OUT" : d.stock_status;
      const slug = await uniqueSlug(d.slug.trim() || d.name, product?.id);

      const payload = {
        name: d.name.trim(),
        slug,
        category: d.category,
        price: Math.max(0, Number(d.price || 0)),
        old_price: d.old_price ? Math.max(0, Number(d.old_price)) : null,
        quantity_available: qty,
        stock_status: status,
        short_description: d.short_description,
        full_description: d.full_description,
        material: d.material,
        finish: fromCsv(d.finish),
        fit_gender: d.fit_gender,
        tags: fromCsv(d.tags),
        size_type: d.size_type,
        sizes: fromCsv(d.sizes),
        size_description: d.size_description,
        size_guide: d.size_guide,
        details_content: d.details_content,
        material_content: d.material_content,
        care: d.care,
        delivery: d.delivery,
        collection_id: d.collection_id || null,
        collection_name: selectedCollection
          ? `DROP ${String(selectedCollection.drop_number).padStart(3, "0")} — ${selectedCollection.name}`
          : "",
        related_product_ids: d.related_product_ids.slice(0, 2),
        featured: d.featured,
        new_collection: d.new_collection,
        archived: d.archived,
        published: publish,
        whatsapp_available: d.whatsapp_available,
        primary_image: d.primary_image,
        gallery_images: d.gallery_images.slice(0, 5),
        sort_order: Number(d.sort_order || 0),
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", product.id);

        if (error) throw error;
        return { code: product.product_code, publish, slug };
      }

      const { code } = await reserveCode({ data: { category: d.category } });

      const { error } = await supabase.from("products").insert({
        ...payload,
        product_code: code,
      });

      if (error) throw error;
      return { code, publish, slug };
    },

    onSuccess: ({ code, publish }) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["products"] });

      toast.success(
        publish
          ? `Object Published Successfully — ${code}`
          : `Draft saved — ${code}`,
      );

      navigate({ to: "/admin/products" });
    },

    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not save object"),
  });

  const toggleRelated = (id: string) => {
    if (d.related_product_ids.includes(id)) {
      set(
        "related_product_ids",
        d.related_product_ids.filter((value) => value !== id),
      );
      return;
    }

    if (d.related_product_ids.length >= 2) {
      toast.error("Select up to 2 related objects");
      return;
    }

    set("related_product_ids", [...d.related_product_ids, id]);
  };

  return (
    <form onSubmit={(event) => event.preventDefault()} className="space-y-8 pb-20">
      <div className="glass-panel rounded-[24px] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              PRODUCT CODE
            </span>
            <p className="mt-2 font-display text-lg tracking-[0.18em] text-foreground">
              {product?.product_code ||
                (d.category
                  ? selectedCategory?.active === false
                    ? "Category hidden"
                    : codeLoading
                      ? "Checking…"
                      : codePreview?.code ?? "Generated automatically"
                  : "Select a category")}
            </p>
          </div>

          <div className="sm:text-right">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              STATUS
            </span>
            <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-chrome">
              {product?.published ? "Published" : "Draft"}
            </p>
          </div>
        </div>
      </div>

      <section className="glass-panel space-y-6 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          BASIC INFORMATION
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product name">
            <input
              className={adminField}
              value={d.name}
              onChange={(event) => {
                const name = event.target.value;
                setDirty(true);
                setD((prev) => ({
                  ...prev,
                  name,
                  slug: product ? prev.slug : slugify(name),
                }));
              }}
            />
          </Field>

          <Field label="Slug / URL">
            <input
              className={adminField}
              value={d.slug}
              onChange={(event) => set("slug", slugify(event.target.value))}
            />
          </Field>

          <Field label="Category">
            <select
              className={adminField}
              value={d.category}
              onChange={(event) => set("category", event.target.value)}
            >
              <option value="">SELECT…</option>
              {selectableCategories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name} ({category.code_prefix})
                  {!category.active ? " — HIDDEN" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Collection">
            <select
              className={adminField}
              value={d.collection_id}
              onChange={(event) => set("collection_id", event.target.value)}
            >
              <option value="">NO COLLECTION</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  DROP {String(collection.drop_number).padStart(3, "0")} —{" "}
                  {collection.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Price">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.price}
              onChange={(event) => set("price", event.target.value)}
            />
          </Field>

          <Field label="Old price (optional)">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.old_price}
              onChange={(event) => set("old_price", event.target.value)}
            />
          </Field>
        </div>

        <Field label="Short description">
          <textarea
            className={adminField}
            rows={2}
            value={d.short_description}
            onChange={(event) => set("short_description", event.target.value)}
          />
        </Field>

        <Field label="Full description">
          <textarea
            className={adminField}
            rows={5}
            value={d.full_description}
            onChange={(event) => set("full_description", event.target.value)}
          />
        </Field>
      </section>

      <section className="glass-panel space-y-6 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          PRODUCT ATTRIBUTES
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Material">
            <input
              className={adminField}
              value={d.material}
              onChange={(event) => set("material", event.target.value)}
            />
          </Field>

          <Field label="Finish / color (comma separated)">
            <input
              className={adminField}
              value={d.finish}
              onChange={(event) => set("finish", event.target.value)}
              placeholder="CHROME, GUNMETAL"
            />
          </Field>

          <Field label="Fit / gender">
            <input
              className={adminField}
              value={d.fit_gender}
              onChange={(event) => set("fit_gender", event.target.value)}
              placeholder="UNISEX"
            />
          </Field>

          <Field label="Tags (comma separated)">
            <input
              className={adminField}
              value={d.tags}
              onChange={(event) => set("tags", event.target.value)}
              placeholder="gothic, chrome, y2k"
            />
          </Field>
        </div>
      </section>

      <section className="glass-panel space-y-6 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          SIZE
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Size type">
            <select
              className={adminField}
              value={d.size_type}
              onChange={(event) => set("size_type", event.target.value)}
            >
              {["ADJUSTABLE", "FIXED", "ONE SIZE", "MULTIPLE SIZES", "CUSTOM"].map(
                (value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ),
              )}
            </select>
          </Field>

          <Field label="Available sizes (comma separated)">
            <input
              className={adminField}
              value={d.sizes}
              onChange={(event) => set("sizes", event.target.value)}
              placeholder="6, 7, 8, 9 or S, M, L"
            />
          </Field>
        </div>

        <Field label="Size description">
          <textarea
            className={adminField}
            rows={2}
            value={d.size_description}
            onChange={(event) => set("size_description", event.target.value)}
          />
        </Field>

        <Field label="Size guide">
          <textarea
            className={adminField}
            rows={4}
            value={d.size_guide}
            onChange={(event) => set("size_guide", event.target.value)}
          />
        </Field>
      </section>

      <section className="glass-panel space-y-6 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          STOCK
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Quantity available">
            <input
              className={adminField}
              type="number"
              min={0}
              value={d.quantity_available}
              onChange={(event) => {
                const value = event.target.value;
                setDirty(true);
                setD((prev) => ({
                  ...prev,
                  quantity_available: value,
                  stock_status:
                    Number(value || 0) <= 0 ? "SOLD OUT" : prev.stock_status,
                }));
              }}
            />
          </Field>

          <Field label="Stock status">
            <select
              className={adminField}
              value={d.stock_status}
              onChange={(event) => set("stock_status", event.target.value)}
            >
              {STOCK_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="glass-panel space-y-6 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          PRODUCT ACCORDIONS
        </h2>

        <Field label="Details content">
          <textarea
            className={adminField}
            rows={4}
            value={d.details_content}
            onChange={(event) => set("details_content", event.target.value)}
          />
        </Field>

        <Field label="Material content">
          <textarea
            className={adminField}
            rows={4}
            value={d.material_content}
            onChange={(event) => set("material_content", event.target.value)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Care content">
            <textarea
              className={adminField}
              rows={4}
              value={d.care}
              onChange={(event) => set("care", event.target.value)}
            />
          </Field>

          <Field label="Delivery content">
            <textarea
              className={adminField}
              rows={4}
              value={d.delivery}
              onChange={(event) => set("delivery", event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="glass-panel space-y-7 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          IMAGES
        </h2>

        <ImageUploader
          label="Main image"
          max={1}
          value={d.primary_image ? [d.primary_image] : []}
          onChange={(next) => set("primary_image", next[0] ?? "")}
        />

        <ImageUploader
          label="Gallery"
          max={5}
          value={d.gallery_images}
          onChange={(next) => set("gallery_images", next)}
        />
      </section>

      <section className="glass-panel space-y-5 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          RELATED OBJECTS
        </h2>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          Select up to 2 manual recommendations. Leave empty to allow the public
          product page to use automatic recommendations.
        </p>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {relatedCandidates.map((candidate) => {
            const active = d.related_product_ids.includes(candidate.id);

            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => toggleRelated(candidate.id)}
                className={`rounded-xl border p-3 text-left ${
                  active
                    ? "border-chrome/70 bg-white/[0.05]"
                    : "border-border/50"
                }`}
              >
                <span className="block text-[8px] tracking-[0.3em] text-muted-foreground">
                  {candidate.product_code}
                </span>
                <span className="mt-1 block text-[9px] uppercase tracking-[0.2em] text-foreground">
                  {candidate.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel space-y-5 rounded-[24px] p-6">
        <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
          VISIBILITY
        </h2>

        <div className="flex flex-wrap gap-3">
          <Toggle
            label="Featured"
            checked={d.featured}
            onChange={(value) => set("featured", value)}
          />
          <Toggle
            label="New collection"
            checked={d.new_collection}
            onChange={(value) => set("new_collection", value)}
          />
          <Toggle
            label="Archived"
            checked={d.archived}
            onChange={(value) => set("archived", value)}
          />
          <Toggle
            label="WhatsApp order"
            checked={d.whatsapp_available}
            onChange={(value) => set("whatsapp_available", value)}
          />
        </div>

        <Field label="Sort order">
          <input
            className={adminField}
            type="number"
            value={d.sort_order}
            onChange={(event) => set("sort_order", event.target.value)}
          />
        </Field>
      </section>

      <div className="sticky bottom-3 z-20 flex flex-wrap gap-3 rounded-2xl border border-border/60 bg-black/80 p-3 backdrop-blur-xl">
        <AdminButton
          tone="primary"
          disabled={save.isPending}
          onClick={() => save.mutate({ publish: false })}
        >
          {save.isPending ? "Saving…" : "Save draft"}
        </AdminButton>

        <AdminButton
          tone="primary"
          disabled={save.isPending}
          onClick={() => save.mutate({ publish: true })}
        >
          {save.isPending
            ? "Publishing…"
            : product
              ? "Save & publish"
              : "Publish object"}
        </AdminButton>

        <AdminButton
          onClick={() => {
            if (!dirty || confirm("Discard unsaved changes?")) {
              setDirty(false);
              navigate({ to: "/admin/products" });
            }
          }}
        >
          Cancel
        </AdminButton>
      </div>
    </form>
  );
}
