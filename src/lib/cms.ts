import {
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Collection =
  Database["public"]["Tables"]["collections"]["Row"];

export type Page =
  Database["public"]["Tables"]["pages"]["Row"];

export type BlogPost =
  Database["public"]["Tables"]["blog_posts"]["Row"];

export type BlogPostSummary = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "featured_image"
  | "featured"
  | "published_at"
  | "created_at"
>;

export type PageKey =
  | "home"
  | "shop"
  | "collection"
  | "archive"
  | "about";

const PUBLIC_STALE_TIME =
  5 * 60 * 1000;

const PUBLIC_GC_TIME =
  30 * 60 * 1000;

const publicQueryDefaults = {
  staleTime: PUBLIC_STALE_TIME,
  gcTime: PUBLIC_GC_TIME,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
} as const;

/* ---------------- PAGES ---------------- */

export const pagesQuery =
  queryOptions({
    queryKey: ["pages"],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        Page[]
      > => {
        const {
          data,
          error,
        } = await supabase
          .from("pages")
          .select("*")
          .order("page_key");

        if (error) {
          throw error;
        }

        return data ?? [];
      },
  });

export function usePages() {
  return useQuery(pagesQuery);
}

export function usePage(
  key: PageKey,
) {
  const q =
    useQuery(pagesQuery);

  return {
    ...q,

    page:
      (q.data ?? []).find(
        (page) =>
          page.page_key ===
          key,
      ) ?? null,
  };
}

export function pageJson<
  T = Record<
    string,
    unknown
  >,
>(
  page: Page | null,
): T {
  return (
    (page?.content_json ??
      {}) as T
  );
}

/* ---------------- COLLECTIONS ---------------- */

const collectionSelect = () =>
  supabase
    .from("collections")
    .select("*")
    .order(
      "drop_number",
      {
        ascending: false,
      },
    );

export const currentCollectionQuery =
  queryOptions({
    queryKey: [
      "collections",
      "current",
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        Collection | null
      > => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "collections",
          )
          .select("*")
          .eq(
            "published",
            true,
          )
          .eq(
            "is_current",
            true,
          )
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      },
  });

export const archivedCollectionsQuery =
  queryOptions({
    queryKey: [
      "collections",
      "archived",
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        Collection[]
      > => {
        const {
          data,
          error,
        } =
          await collectionSelect()
            .eq(
              "published",
              true,
            )
            .eq(
              "archived",
              true,
            );

        if (error) {
          throw error;
        }

        return data ?? [];
      },
  });

export const publishedCollectionsQuery =
  queryOptions({
    queryKey: [
      "collections",
      "published",
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        Collection[]
      > => {
        const {
          data,
          error,
        } =
          await collectionSelect().eq(
            "published",
            true,
          );

        if (error) {
          throw error;
        }

        return data ?? [];
      },
  });

export const adminCollectionsQuery =
  queryOptions({
    queryKey: [
      "collections",
      "admin",
    ],

    queryFn:
      async (): Promise<
        Collection[]
      > => {
        const {
          data,
          error,
        } =
          await collectionSelect();

        if (error) {
          throw error;
        }

        return data ?? [];
      },
  });

export const useCurrentCollection =
  () =>
    useQuery(
      currentCollectionQuery,
    );

export const useArchivedCollections =
  () =>
    useQuery(
      archivedCollectionsQuery,
    );

export const usePublishedCollections =
  () =>
    useQuery(
      publishedCollectionsQuery,
    );

export const useAdminCollections =
  () =>
    useQuery(
      adminCollectionsQuery,
    );

export function collectionBySlugQuery(
  slug: string,
) {
  return queryOptions({
    queryKey: [
      "collections",
      "slug",
      slug,
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        Collection | null
      > => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "collections",
          )
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      },
  });
}

/* ---------------- BLOG ---------------- */

/*
 * PUBLIC JOURNAL LIST
 *
 * IMPORTANT:
 * Do NOT download full blog content
 * just to show cards on About.
 */
export const publishedPostsQuery =
  queryOptions({
    queryKey: [
      "blog",
      "published",
      "summary",
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        BlogPostSummary[]
      > => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "blog_posts",
          )
          .select(
            [
              "id",
              "title",
              "slug",
              "excerpt",
              "featured_image",
              "featured",
              "published_at",
              "created_at",
            ].join(","),
          )
          .eq(
            "status",
            "published",
          )
          .order(
            "featured",
            {
              ascending: false,
            },
          )
          .order(
            "published_at",
            {
              ascending: false,
              nullsFirst: false,
            },
          );

        if (error) {
          throw error;
        }

        return (
          (data ?? []) as
            BlogPostSummary[]
        );
      },
  });

export const adminPostsQuery =
  queryOptions({
    queryKey: [
      "blog",
      "admin",
    ],

    queryFn:
      async (): Promise<
        BlogPost[]
      > => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "blog_posts",
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            },
          );

        if (error) {
          throw error;
        }

        return data ?? [];
      },
  });

export const usePublishedPosts =
  () =>
    useQuery(
      publishedPostsQuery,
    );

export const useAdminPosts =
  () =>
    useQuery(
      adminPostsQuery,
    );

/*
 * Individual blog page still
 * receives the FULL content.
 */
export function postBySlugQuery(
  slug: string,
) {
  return queryOptions({
    queryKey: [
      "blog",
      "slug",
      slug,
    ],

    ...publicQueryDefaults,

    queryFn:
      async (): Promise<
        BlogPost | null
      > => {
        const {
          data,
          error,
        } = await supabase
          .from(
            "blog_posts",
          )
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      },
  });
}

export const slugify = (
  value: string,
) =>
  value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-",
    )
    .replace(
      /^-+|-+$/g,
      "",
    );

export const formatDate = (
  iso: string | null,
) =>
  iso
    ? new Date(
        iso,
      )
        .toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )
        .toUpperCase()
    : "";
