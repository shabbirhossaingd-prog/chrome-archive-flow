import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

const ORDER = (q: ReturnType<typeof buildSelect>) =>
  q.order("sort_order", { ascending: true }).order("created_at", { ascending: false });

const buildSelect = () => supabase.from("products").select("*");

/** Published, non-archived objects — everything the public shop shows. */
export const productsQuery = queryOptions({
  queryKey: ["products", "public"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await ORDER(buildSelect().eq("published", true).eq("archived", false));
    if (error) throw error;
    return data ?? [];
  },
});

/** Published archive objects. */
export const archivedProductsQuery = queryOptions({
  queryKey: ["products", "archived"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await ORDER(buildSelect().eq("published", true).eq("archived", true));
    if (error) throw error;
    return data ?? [];
  },
});

/** Every published object (shop + archive) — used by search and product pages. */
export const allPublishedProductsQuery = queryOptions({
  queryKey: ["products", "all-published"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await ORDER(buildSelect().eq("published", true));
    if (error) throw error;
    return data ?? [];
  },
});

/** Admin view: drafts included. Requires an admin session (enforced by RLS). */
export const adminProductsQuery = queryOptions({
  queryKey: ["products", "admin"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
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

export function useProducts() {
  return useQuery(productsQuery);
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

export function useCategories() {
  return useQuery(categoriesQuery);
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

export const prettyCategory = (slug: string) => slug.replace(/-/g, " ").toUpperCase();

export { formatPrice, SITE } from "./site-config";
