import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const ORIGIN = "https://zzerkoff.vercel.app";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(
  path: string,
  options: {
    lastmod?: string | null;
    priority?: number;
  } = {},
) {
  const loc = `${ORIGIN}${path}`;
  const lastmod = options.lastmod
    ? `<lastmod>${xmlEscape(options.lastmod)}</lastmod>`
    : "";
  const priority =
    options.priority != null
      ? `<priority>${options.priority.toFixed(1)}</priority>`
      : "";

  return `<url><loc>${xmlEscape(loc)}</loc>${lastmod}${priority}</url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [
          productsResult,
          categoriesResult,
          postsResult,
          collectionsResult,
          looksResult,
          bundlesResult,
        ] = await Promise.all([
          (supabase as any)
            .from("products")
            .select("slug,category,updated_at")
            .eq("published", true)
            .eq("archived", false),

          (supabase as any)
            .from("categories")
            .select("slug,active")
            .eq("active", true),

          (supabase as any)
            .from("blog_posts")
            .select("slug,updated_at")
            .eq("status", "published"),

          (supabase as any)
            .from("collections")
            .select("slug,updated_at,archived")
            .eq("published", true),

          (supabase as any)
            .from("commerce_shop_looks")
            .select("id")
            .eq("published", true)
            .limit(1),

          (supabase as any)
            .from("commerce_bundles")
            .select("id")
            .eq("active", true)
            .limit(1),
        ]);

        const products = productsResult.data ?? [];
        const activeCategories = new Set(
          (categoriesResult.data ?? []).map((row: any) => row.slug),
        );

        const publicProducts = products.filter((product: any) =>
          activeCategories.has(product.category),
        );

        const productCategorySet = new Set(
          publicProducts.map((product: any) => product.category),
        );

        const entries = [
          urlEntry("/", { priority: 1 }),
          urlEntry("/shop", { priority: 0.9 }),
          urlEntry("/collection", { priority: 0.9 }),
          urlEntry("/archive", { priority: 0.7 }),
          urlEntry("/about", { priority: 0.7 }),
          urlEntry("/contact", { priority: 0.7 }),
          urlEntry("/shipping", { priority: 0.5 }),
          urlEntry("/returns", { priority: 0.5 }),
          urlEntry("/size-guide", { priority: 0.5 }),
          urlEntry("/care-guide", { priority: 0.6 }),
          urlEntry("/faq", { priority: 0.5 }),
          urlEntry("/privacy", { priority: 0.4 }),
          urlEntry("/terms", { priority: 0.4 }),
        ];

        if ((looksResult.data ?? []).length > 0) {
          entries.push(urlEntry("/shop-the-look", { priority: 0.7 }));
        }

        if ((bundlesResult.data ?? []).length > 0) {
          entries.push(urlEntry("/bundles", { priority: 0.7 }));
        }

        for (const product of publicProducts) {
          entries.push(
            urlEntry(`/product/${encodeURIComponent(product.slug)}`, {
              lastmod: product.updated_at,
              priority: 0.8,
            }),
          );
        }

        for (const category of categoriesResult.data ?? []) {
          if (!productCategorySet.has(category.slug)) continue;
          entries.push(
            urlEntry(`/shop/${encodeURIComponent(category.slug)}`, {
              priority: 0.7,
            }),
          );
        }

        for (const post of postsResult.data ?? []) {
          entries.push(
            urlEntry(`/blog/${encodeURIComponent(post.slug)}`, {
              lastmod: post.updated_at,
              priority: 0.6,
            }),
          );
        }

        for (const collection of collectionsResult.data ?? []) {
          if (!collection.archived) continue;
          entries.push(
            urlEntry(`/archive/${encodeURIComponent(collection.slug)}`, {
              lastmod: collection.updated_at,
              priority: 0.6,
            }),
          );
        }

        const xml =
          `<?xml version="1.0" encoding="UTF-8"?>` +
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
          entries.join("") +
          `</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=0, s-maxage=1800",
          },
        });
      },
    },
  },
});
