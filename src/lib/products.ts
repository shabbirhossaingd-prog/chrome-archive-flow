import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];

export type Product = ProductRow & {
  colors?: string[];
  color_stock?: Record<string, number>;
};

export type Category = Database["public"]["Tables"]["categories"]["Row"];

const PUBLIC_PRODUCT_FIELDS = [
  "id",
  "slug",
  "name",
  "product_code",
  "category",
  "collection_id",
  "collection_name",
  "material",
  "primary_image",
  "price",
  "old_price",
  "stock_status",
  "quantity_available",
  "sort_order",
  "created_at",
  "updated_at",
  "new_collection",
  "featured",
  "published",
  "archived",
  "short_description",
  "tags",
  "colors",
  "color_stock",
].join(",");

const ORDER = (q: any) =>
  q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });

const buildSelect = () => supabase.from("products").select("*");
const buildPublicSelect = () =>
  supabase.from("products").select(PUBLIC_PRODUCT_FIELDS);

export const productsQuery = queryOptions({
  queryKey: ["products", "public"],
  queryFn: async (): Promise<Product[]> => {
    const [{ data, error }, { data: categoryRows, error: categoryError }] =
      await Promise.all([
        ORDER(
          buildPublicSelect().eq("published", true).eq("archived", false),
        ),
        supabase
          .from("categories")
          .select("slug")
          .eq("active", true),
      ]);

    if (error) throw error;
    if (categoryError) throw categoryError;

    const activeCategories = new Set(
      (categoryRows ?? []).map((row) => row.slug),
    );

    return ((data ?? []) as unknown as Product[]).filter((product) =>
      activeCategories.has(product.category),
    );
  },
});

export const archivedProductsQuery = queryOptions({
  queryKey: ["products", "archived"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await ORDER(
      buildSelect().eq("published", true).eq("archived", true),
    );
    if (error) throw error;
    return (data ?? []) as Product[];
  },
});

export const allPublishedProductsQuery = queryOptions({
  queryKey: ["products", "all-published"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await ORDER(buildSelect().eq("published", true));
    if (error) throw error;
    return (data ?? []) as Product[];
  },
});

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["products", "public", "slug", slug],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .eq("archived", false)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("slug")
        .eq("slug", data.category)
        .eq("active", true)
        .maybeSingle();

      if (categoryError) throw categoryError;
      return category ? (data as Product) : null;
    },
  });

export const adminProductsQuery = queryOptions({
  queryKey: ["products", "admin"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories", "active"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const allCategoriesQuery = queryOptions({
  queryKey: ["categories", "all"],
  queryFn: async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export function useProducts(enabled = true) {
  return useQuery({ ...productsQuery, enabled });
}

export function useProductBySlug(slug: string) {
  return useQuery(productBySlugQuery(slug));
}

export function useAllPublishedProducts() {
  return useQuery(allPublishedProductsQuery);
}

export function useArchivedProducts() {
  return useQuery(archivedProductsQuery);
}

export function useAdminProducts() {
  return useQuery(adminProductsQuery);
}

export function useCategories(enabled = true) {
  return useQuery({ ...categoriesQuery, enabled });
}

export function useAllCategories() {
  return useQuery(allCategoriesQuery);
}

export const isSoldOut = (p: Product) =>
  p.stock_status === "SOLD OUT" || p.quantity_available <= 0;

export function productImages(p: Product) {
  return [p.primary_image, ...(p.gallery_images ?? [])].filter(Boolean);
}

export function matchesSearch(p: Product, q: string) {
  const needle = q.trim().toLowerCase().replace(/[\s/-]/g, "");
  if (!needle) return false;

  return [p.name, p.product_code, p.category, p.collection_name, p.material]
    .join(" ")
    .toLowerCase()
    .replace(/[\s/-]/g, "")
    .includes(needle);
}

export const prettyCategory = (slug: string) =>
  slug.replace(/-/g, " ").toUpperCase();

export { formatPrice, SITE } from "./site-config";
