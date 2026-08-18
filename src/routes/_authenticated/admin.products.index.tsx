import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminProducts,
  useAllCategories,
  isSoldOut,
  prettyCategory,
  type Product,
} from "@/lib/products";
import { useSite } from "@/lib/settings";
import { SmartImage } from "@/components/site/SmartImage";
import { cleanupUnusedMedia, removeUnusedMediaRefs } from "@/lib/media-cleanup";
import { AdminButton, adminField } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  component: AdminProducts,
});

const STATUS_FILTERS = [
  "ALL",
  "IN STOCK",
  "LOW STOCK",
  "SOLD OUT",
  "FEATURED",
  "NEW COLLECTION",
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const;

type FilterItem = {
  key: string;
  label: string;
  kind: "status" | "category";
  categorySlug?: string;
};

function AdminProducts() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { data: categories = [] } = useAllCategories();
  const { price } = useSite();
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");

  const filters = useMemo<FilterItem[]>(
    () => [
      ...STATUS_FILTERS.map((status) => ({
        key: status,
        label: status,
        kind: "status" as const,
      })),
      ...categories.map((category) => ({
        key: `category:${category.slug}`,
        label: `${category.name.toUpperCase()}${category.active ? "" : " · HIDDEN"}`,
        kind: "category" as const,
        categorySlug: category.slug,
      })),
    ],
    [categories],
  );

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["products"] });

  const patch = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<Product>;
    }) => {
      const { error } = await supabase
        .from("products")
        .update(values)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast.success("Object updated");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (product: Product) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);

      if (error) throw error;

      let mediaCleanupFailed = false;

      try {
        await removeUnusedMediaRefs([
          product.primary_image,
          ...(product.gallery_images ?? []),
        ]);
      } catch (error) {
        mediaCleanupFailed = true;
        console.warn("Could not clean deleted product media", error);
      }

      return { mediaCleanupFailed };
    },
    onSuccess: ({ mediaCleanupFailed }) => {
      toast.success("Object deleted");
      if (mediaCleanupFailed) {
        toast.warning("Object deleted, but media cleanup can be retried later.");
      }
      refresh();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const cleanMedia = useMutation({
    mutationFn: () => cleanupUnusedMedia(24),
    onSuccess: ({ removed, scanned }) => {
      if (removed > 0) {
        toast.success(`Removed ${removed} unused image${removed === 1 ? "" : "s"}.`);
      } else {
        toast.success(`Media is clean. ${scanned} file${scanned === 1 ? "" : "s"} checked.`);
      }
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : "Could not clean unused media",
      ),
  });

  const quickTogglePublished = (product: Product) => {
    if (product.published) {
      patch.mutate({ id: product.id, values: { published: false } });
      return;
    }

    if (!product.primary_image) {
      toast.error("Add a main image before publishing this object");
      return;
    }

    if (product.archived) {
      toast.error("Unarchive this object before publishing it to the storefront");
      return;
    }

    const category = categories.find((item) => item.slug === product.category);
    if (!category?.active) {
      toast.error("Activate the product category before publishing");
      return;
    }

    patch.mutate({ id: product.id, values: { published: true } });
  };

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const selected = filters.find((item) => item.key === filter);

    return products.filter((product) => {
      const searchOk =
        !needle ||
        product.name.toLowerCase().includes(needle) ||
        product.product_code.toLowerCase().includes(needle) ||
        product.category.toLowerCase().includes(needle);

      let filterOk = true;

      if (selected?.kind === "category") {
        filterOk = product.category === selected.categorySlug;
      } else {
        filterOk =
          filter === "ALL" ||
          (filter === "IN STOCK" &&
            !isSoldOut(product) &&
            product.stock_status === "IN STOCK") ||
          (filter === "LOW STOCK" && product.stock_status === "LOW STOCK") ||
          (filter === "SOLD OUT" && isSoldOut(product)) ||
          (filter === "FEATURED" && product.featured) ||
          (filter === "NEW COLLECTION" && product.new_collection) ||
          (filter === "DRAFT" && !product.published) ||
          (filter === "PUBLISHED" && product.published) ||
          (filter === "ARCHIVED" && product.archived);
      }

      return searchOk && filterOk;
    });
  }, [products, q, filter, filters]);

  return (
    <div className="space-y-7 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            CATALOGUE / CMS
          </span>
          <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
            OBJECTS
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <AdminButton
            disabled={cleanMedia.isPending}
            onClick={() => {
              if (
                confirm(
                  "CLEAN UNUSED MEDIA?\n\nOnly unreferenced product-images files older than 24 hours will be deleted.",
                )
              ) {
                cleanMedia.mutate();
              }
            }}
          >
            {cleanMedia.isPending ? "Cleaning…" : "Clean unused media"}
          </AdminButton>

          <Link
            to="/admin/categories"
            className="rounded-xl border border-border/60 px-5 py-3 text-[9px] uppercase tracking-[0.35em] text-muted-foreground hover:text-foreground"
          >
            Categories
          </Link>
          <Link
            to="/admin/products/new"
            className="rounded-xl border border-chrome/60 bg-white/[0.05] px-5 py-3 text-[9px] uppercase tracking-[0.35em] text-foreground hover:bg-white/[0.1]"
          >
            + New object
          </Link>
        </div>
      </div>

      <div className="glass-panel space-y-4 rounded-[22px] p-4">
        <input
          className={adminField}
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="SEARCH NAME OR PRODUCT CODE"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-lg border px-3 py-2 text-[8px] uppercase tracking-[0.25em] ${
                filter === item.key
                  ? "border-chrome/60 bg-white/[0.05] text-foreground"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading objects…
        </p>
      )}

      {!isLoading && visible.length === 0 && (
        <div className="glass-panel rounded-[22px] p-8 text-center">
          <p className="font-display text-lg tracking-[0.2em] text-foreground">
            NO OBJECTS FOUND
          </p>
          <Link
            to="/admin/products/new"
            className="mt-5 inline-block text-[9px] uppercase tracking-[0.35em] text-chrome"
          >
            + New object
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {visible.map((product) => (
          <div
            key={product.id}
            className="glass-panel flex flex-wrap items-center gap-4 rounded-[22px] p-4"
          >
            <SmartImage
              src={product.primary_image}
              alt={product.name}
              width={120}
              height={150}
              className="size-16 shrink-0 rounded-xl object-cover grayscale"
            />

            <div className="min-w-[12rem] flex-1">
              <span className="block text-[9px] tracking-[0.35em] text-muted-foreground">
                {product.product_code} · {prettyCategory(product.category)}
              </span>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-foreground">
                {product.name}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.18em] text-chrome">
                {price(product.price)} · QTY {product.quantity_available} ·{" "}
                {product.stock_status}
              </p>
              <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
                {product.published ? "PUBLISHED" : "DRAFT"}
                {product.archived ? " · ARCHIVED" : " · ACTIVE"}
                {product.featured ? " · FEATURED" : ""}
                {product.new_collection ? " · NEW COLLECTION" : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                disabled={patch.isPending}
                onClick={() => quickTogglePublished(product)}
              >
                {product.published ? "Unpublish" : "Publish"}
              </AdminButton>

              <Link
                to="/admin/products/$id"
                params={{ id: product.id }}
                className="rounded-xl border border-chrome/60 px-5 py-3 text-[9px] uppercase tracking-[0.35em] text-foreground"
              >
                Edit
              </Link>

              <AdminButton
                tone="danger"
                onClick={() => {
                  if (
                    confirm(
                      `DELETE THIS OBJECT?\n\n${product.product_code} — ${product.name}`,
                    )
                  ) {
                    remove.mutate(product);
                  }
                }}
              >
                Delete
              </AdminButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
