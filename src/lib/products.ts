import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
});

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
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

export function useProducts() {
  return useQuery(productsQuery);
}

export function useCategories() {
  return useQuery(categoriesQuery);
}

export const isSoldOut = (p: Product) => p.stock_status === "SOLD OUT";

export function productImages(p: Product) {
  return [p.primary_image, ...(p.gallery_images ?? [])].filter(Boolean);
}

export function matchesSearch(p: Product, q: string) {
  const needle = q.trim().toLowerCase().replace(/[\s/]/g, "");
  if (!needle) return false;
  return [p.name, p.product_code, p.category, p.collection_name]
    .join(" ")
    .toLowerCase()
    .replace(/[\s/]/g, "")
    .includes(needle);
}

export { formatPrice, SITE } from "./site-config";