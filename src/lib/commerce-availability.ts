import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CommerceAvailability = {
  hasShopLooks: boolean;
  hasBundles: boolean;
};

export const commerceAvailabilityQuery = queryOptions({
  queryKey: ["commerce", "public-availability"],
  staleTime: 1000 * 60 * 5,
  queryFn: async (): Promise<CommerceAvailability> => {
    try {
      const [looksResult, bundlesResult, productsResult, categoriesResult] =
        await Promise.all([
        (supabase as any)
          .from("commerce_shop_looks")
          .select("product_ids")
          .eq("published", true),
        (supabase as any)
          .from("commerce_bundles")
          .select("product_ids")
          .eq("active", true),
        (supabase as any)
          .from("products")
          .select("id,category,quantity_available,stock_status")
          .eq("published", true)
          .eq("archived", false),
        (supabase as any)
          .from("categories")
          .select("slug")
          .eq("active", true),
      ]);

      if (
        looksResult.error ||
        bundlesResult.error ||
        productsResult.error ||
        categoriesResult.error
      ) {
        return { hasShopLooks: false, hasBundles: false };
      }

      const activeCategories = new Set(
        (categoriesResult.data ?? []).map((row: any) => row.slug),
      );
      const productRows = (productsResult.data ?? []).filter((row: any) =>
        activeCategories.has(row.category),
      );
      const publicIds = new Set(productRows.map((row: any) => row.id));
      const availableIds = new Set(
        productRows
          .filter(
            (row: any) =>
              Number(row.quantity_available ?? 0) > 0 &&
              row.stock_status !== "SOLD OUT",
          )
          .map((row: any) => row.id),
      );

      const hasShopLooks = (looksResult.data ?? []).some((look: any) => {
        const ids = (look.product_ids ?? []) as string[];
        return ids.some((id) => publicIds.has(id));
      });

      const hasBundles = (bundlesResult.data ?? []).some((bundle: any) => {
        const ids = (bundle.product_ids ?? []) as string[];
        return (
          ids.length > 0 &&
          ids.every((id) => publicIds.has(id) && availableIds.has(id))
        );
      });

      return { hasShopLooks, hasBundles };
    } catch {
      return { hasShopLooks: false, hasBundles: false };
    }
  },
});

export function useCommerceAvailability() {
  const query = useQuery(commerceAvailabilityQuery);
  return query.data ?? { hasShopLooks: false, hasBundles: false };
}
