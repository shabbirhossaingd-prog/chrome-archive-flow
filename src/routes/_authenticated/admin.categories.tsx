import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

import {
  useAllCategories,
  useAdminProducts,
  type Category,
} from "@/lib/products";

import { ImageUploader } from "@/components/admin/ImageUploader";

import {
  AdminButton,
  Field,
  Toggle,
  adminField,
} from "@/components/admin/AdminUI";

import { SmartImage } from "@/components/site/SmartImage";

export const Route = createFileRoute(
  "/_authenticated/admin/categories",
)({
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
  const {
    data: categories = [],
    isLoading,
  } = useAllCategories();

  const {
    data: products = [],
  } = useAdminProducts();

  const queryClient =
    useQueryClient();

  const [
    draft,
    setDraft,
  ] = useState<Draft>(
    blankDraft(),
  );

  const [
    dirty,
    setDirty,
  ] = useState(false);

  /*
   * Count how many products use each category.
   */
  const usage = useMemo(() => {
    const map =
      new Map<string, number>();

    for (
      const product of
      products
    ) {
      map.set(
        product.category,
        (
          map.get(
            product.category,
          ) ?? 0
        ) + 1,
      );
    }

    return map;
  }, [products]);

  /*
   * Generic draft setter.
   */
  const set = <
    K extends keyof Draft,
  >(
    key: K,
    value: Draft[K],
  ) => {
    setDirty(true);

    setDraft(
      (current) => ({
        ...current,
        [key]: value,
      }),
    );
  };

  /*
   * Reset editor.
   */
  const reset = () => {
    setDraft(
      blankDraft(),
    );

    setDirty(false);
  };

  /*
   * Create / Update Category
   */
  const save = useMutation({
    mutationFn: async () => {
      const name =
        draft.name.trim();

      const slug =
        slugify(
          draft.slug ||
            draft.name,
        );

      const codePrefix =
        draft.code_prefix
          .trim()
          .toUpperCase();

      if (!name) {
        throw new Error(
          "Category name is required",
        );
      }

      if (!slug) {
        throw new Error(
          "Category slug is required",
        );
      }

      if (!codePrefix) {
        throw new Error(
          "Code prefix is required",
        );
      }

      /*
       * Check duplicate slug.
       */
      const {
        data:
          slugConflict,
        error:
          slugError,
      } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .neq(
          "id",
          draft.id ??
            "00000000-0000-0000-0000-000000000000",
        )
        .limit(1);

      if (slugError) {
        throw slugError;
      }

      if (
        slugConflict?.length
      ) {
        throw new Error(
          "That slug is already in use",
        );
      }

      /*
       * Check duplicate code prefix.
       */
      const {
        data:
          prefixConflict,
        error:
          prefixError,
      } = await supabase
        .from("categories")
        .select("id")
        .eq(
          "code_prefix",
          codePrefix,
        )
        .neq(
          "id",
          draft.id ??
            "00000000-0000-0000-0000-000000000000",
        )
        .limit(1);

      if (prefixError) {
        throw prefixError;
      }

      if (
        prefixConflict?.length
      ) {
        throw new Error(
          "That code prefix is already in use",
        );
      }

      /*
       * Category payload including SEO.
       */
      const payload = {
        name,

        slug,

        code_prefix:
          codePrefix,

        image_url:
          draft.image_url ||
          null,

        seo_title:
          draft.seo_title.trim(),

        seo_description:
          draft.seo_description.trim(),

        og_image:
          draft.og_image ||
          "",

        active:
          draft.active,

        sort_order:
          Number(
            draft.sort_order ||
              0,
          ),
      } as any;

      /*
       * Update existing category.
       */
      if (draft.id) {
        const current =
          categories.find(
            (item) =>
              item.id ===
              draft.id,
          );

        /*
         * Do not allow slug change while products
         * still use the existing slug.
         */
        if (
          current &&
          current.slug !==
            slug &&
          (
            usage.get(
              current.slug,
            ) ?? 0
          ) > 0
        ) {
          throw new Error(
            "Move products out of this category before changing its slug",
          );
        }

        const {
          error,
        } = await supabase
          .from(
            "categories",
          )
          .update(payload)
          .eq(
            "id",
            draft.id,
          );

        if (error) {
          throw error;
        }

        return;
      }

      /*
       * Create new category.
       */
      const {
        error,
      } = await supabase
        .from("categories")
        .insert(payload);

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "categories",
        ],
      });

      queryClient.invalidateQueries({
        queryKey: [
          "products",
        ],
      });

      toast.success(
        draft.id
          ? "Category updated"
          : "Category created",
      );

      reset();
    },

    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not save category",
      ),
  });

  /*
   * Delete category.
   */
  const remove = useMutation({
    mutationFn: async (
      category: Category,
    ) => {
      const count =
        usage.get(
          category.slug,
        ) ?? 0;

      if (count > 0) {
        throw new Error(
          "Move or remove products from this category before deleting.",
        );
      }

      const {
        error,
      } = await supabase
        .from("categories")
        .delete()
        .eq(
          "id",
          category.id,
        );

      if (error) {
        throw error;
      }
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "categories",
        ],
      });

      toast.success(
        "Category deleted",
      );

      reset();
    },

    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not delete category",
      ),
  });

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}

      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          CATALOGUE / STRUCTURE
        </span>

        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
          CATEGORIES
        </h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        {/* ================================================
            CATEGORY LIST
        ================================================ */}

        <div className="space-y-3">
          {isLoading && (
            <p className="text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              Loading
              categories…
            </p>
          )}

          {categories.map(
            (category) => {
              const count =
                usage.get(
                  category.slug,
                ) ?? 0;

              return (
                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() => {
                    if (
                      dirty &&
                      !confirm(
                        "Discard unsaved category changes?",
                      )
                    ) {
                      return;
                    }

                    setDraft({
                      id:
                        category.id,

                      name:
                        category.name,

                      slug:
                        category.slug,

                      code_prefix:
                        category.code_prefix,

                      image_url:
                        category.image_url ??
                        "",

                      seo_title:
                        category.seo_title ??
                        "",

                      seo_description:
                        category.seo_description ??
                        "",

                      og_image:
                        category.og_image ??
                        "",

                      active:
                        category.active,

                      sort_order:
                        String(
                          category.sort_order,
                        ),
                    });

                    setDirty(
                      false,
                    );
                  }}
                  className={`glass-panel flex w-full items-center gap-4 rounded-[20px] p-4 text-left ${
                    draft.id ===
                    category.id
                      ? "border-chrome/70"
                      : ""
                  }`}
                >
                  <SmartImage
                    src={
                      category.image_url
                    }
                    alt={
                      category.name
                    }
                    width={100}
                    height={120}
                    className="size-14 shrink-0 rounded-xl object-cover grayscale"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] uppercase tracking-[0.25em] text-foreground">
                      {
                        category.name
                      }
                    </p>

                    <p className="mt-2 text-[8px] uppercase tracking-[0.26em] text-muted-foreground">
                      {
                        category.slug
                      }{" "}
                      ·{" "}
                      {
                        category.code_prefix
                      }{" "}
                      · {count}{" "}
                      {count === 1
                        ? "object"
                        : "objects"}
                    </p>
                  </div>

                  <span className="text-[8px] uppercase tracking-[0.25em] text-chrome">
                    {category.active
                      ? "ACTIVE"
                      : "HIDDEN"}
                  </span>
                </button>
              );
            },
          )}

          <AdminButton
            onClick={() => {
              if (
                dirty &&
                !confirm(
                  "Discard unsaved category changes?",
                )
              ) {
                return;
              }

              reset();
            }}
          >
            + New category
          </AdminButton>
        </div>

        {/* ================================================
            CATEGORY EDITOR
        ================================================ */}

        <div className="glass-panel space-y-6 rounded-[24px] p-6">
          <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
            {draft.id
              ? "EDIT CATEGORY"
              : "NEW CATEGORY"}
          </h2>

          {/* CATEGORY NAME */}

          <Field label="Category name">
            <input
              className={
                adminField
              }
              value={
                draft.name
              }
              onChange={(
                event,
              ) => {
                const name =
                  event.target
                    .value;

                setDirty(
                  true,
                );

                setDraft(
                  (
                    current,
                  ) => ({
                    ...current,

                    name,

                    slug:
                      current.id
                        ? current.slug
                        : slugify(
                            name,
                          ),
                  }),
                );
              }}
              placeholder="BELTS"
            />
          </Field>

          {/* SLUG */}

          <Field label="Slug">
            <input
              className={
                adminField
              }
              value={
                draft.slug
              }
              onChange={(
                event,
              ) =>
                set(
                  "slug",
                  slugify(
                    event.target
                      .value,
                  ),
                )
              }
              placeholder="belts"
            />
          </Field>

          {/* CODE PREFIX */}

          <Field label="Code prefix">
            <input
              className={
                adminField
              }
              value={
                draft.code_prefix
              }
              maxLength={6}
              onChange={(
                event,
              ) =>
                set(
                  "code_prefix",
                  event.target.value
                    .toUpperCase()
                    .replace(
                      /[^A-Z0-9]/g,
                      "",
                    ),
                )
              }
              placeholder="G"
            />
          </Field>

          {/* CATEGORY IMAGE */}

          <ImageUploader
            label="Category thumbnail"
            max={1}
            value={
              draft.image_url
                ? [
                    draft.image_url,
                  ]
                : []
            }
            onChange={(
              next,
            ) =>
              set(
                "image_url",
                next[0] ?? "",
              )
            }
          />

          {/* ================================================
              SEO
          ================================================ */}

          <div className="border-t border-border/60 pt-6">
            <span className="text-[9px] uppercase tracking-[0.4em] text-chrome">
              SEO / SEARCH
            </span>

            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Leave SEO
              fields blank to
              automatically
              generate metadata
              from the category
              name.
            </p>
          </div>

          {/* SEO TITLE */}

          <Field label="SEO title">
            <input
              className={
                adminField
              }
              value={
                draft.seo_title
              }
              maxLength={70}
              onChange={(
                event,
              ) =>
                set(
                  "seo_title",
                  event.target
                    .value,
                )
              }
              placeholder="Chrome Rings — ZZERKOFF"
            />

            <p className="mt-2 text-[9px] text-muted-foreground">
              {
                draft.seo_title
                  .length
              }
              /70
            </p>
          </Field>

          {/* SEO DESCRIPTION */}

          <Field label="SEO description">
            <textarea
              className={
                adminField
              }
              value={
                draft.seo_description
              }
              rows={4}
              maxLength={180}
              onChange={(
                event,
              ) =>
                set(
                  "seo_description",
                  event.target
                    .value,
                )
              }
              placeholder="Shop unisex chrome rings inspired by Y2K, gothic and underground fashion."
            />

            <p className="mt-2 text-[9px] text-muted-foreground">
              {
                draft
                  .seo_description
                  .length
              }
              /180
            </p>
          </Field>

          {/* SEO SOCIAL IMAGE */}

          <ImageUploader
            label="SEO / Social share image"
            max={1}
            value={
              draft.og_image
                ? [
                    draft.og_image,
                  ]
                : []
            }
            onChange={(
              next,
            ) =>
              set(
                "og_image",
                next[0] ?? "",
              )
            }
          />

          {/* ACTIVE */}

          <div className="flex flex-wrap gap-3">
            <Toggle
              label="Active"
              checked={
                draft.active
              }
              onChange={(
                value,
              ) =>
                set(
                  "active",
                  value,
                )
              }
            />
          </div>

          {/* SORT ORDER */}

          <Field label="Sort order">
            <input
              className={
                adminField
              }
              type="number"
              value={
                draft.sort_order
              }
              onChange={(
                event,
              ) =>
                set(
                  "sort_order",
                  event.target
                    .value,
                )
              }
            />
          </Field>

          {/* SAVE / DELETE */}

          <div className="flex flex-wrap gap-3">
            <AdminButton
              tone="primary"
              disabled={
                save.isPending
              }
              onClick={() =>
                save.mutate()
              }
            >
              {save.isPending
                ? "Saving…"
                : draft.id
                  ? "Save category"
                  : "Create category"}
            </AdminButton>

            {draft.id && (
              <AdminButton
                tone="danger"
                disabled={
                  remove.isPending
                }
                onClick={() => {
                  const category =
                    categories.find(
                      (
                        item,
                      ) =>
                        item.id ===
                        draft.id,
                    );

                  if (
                    !category
                  ) {
                    return;
                  }

                  if (
                    confirm(
                      `Delete ${category.name}?`,
                    )
                  ) {
                    remove.mutate(
                      category,
                    );
                  }
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
