import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeading } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { ProductGrid } from "@/components/site/ProductGrid";
import {
  categoryBySlugQuery,
  useCategories,
  useProducts,
  type Category,
} from "@/lib/products";

const SITE_URL = "https://zzerkoff.vercel.app";

const pretty = (slug: string) =>
  slug.replace(/-/g, " ").toUpperCase();

const absoluteUrl = (value?: string | null) => {
  if (!value) {
    return `${SITE_URL}/images/zzerkoff-logo.png`;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const fallbackDescription = (name: string) =>
  `Shop ZZERKOFF ${name.toLowerCase()} — unisex chrome accessories inspired by Y2K, gothic, vintage metal and underground fashion.`;

export const Route = createFileRoute("/shop/$category")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      categoryBySlugQuery(params.category),
    ),

  head: ({ loaderData, params }) => {
    const category =
      (loaderData ?? null) as Category | null;

    const categoryName =
      category?.name || pretty(params.category);

    const title =
      category?.seo_title?.trim() ||
      `${categoryName} — ZZERKOFF`;

    const description =
      category?.seo_description?.trim() ||
      fallbackDescription(categoryName);

    const canonical =
      `${SITE_URL}/shop/${encodeURIComponent(params.category)}`;

    const image = absoluteUrl(
      category?.og_image || category?.image_url,
    );

    return {
      meta: [
        {
          title,
        },

        {
          name: "description",
          content: description,
        },

        {
          name: "robots",
          content: category
            ? "index,follow,max-image-preview:large"
            : "noindex,follow",
        },

        {
          property: "og:title",
          content: title,
        },

        {
          property: "og:description",
          content: description,
        },

        {
          property: "og:type",
          content: "website",
        },

        {
          property: "og:site_name",
          content: "ZZERKOFF",
        },

        {
          property: "og:url",
          content: canonical,
        },

        {
          property: "og:image",
          content: image,
        },

        {
          property: "og:image:alt",
          content: `${categoryName} by ZZERKOFF`,
        },

        {
          name: "twitter:card",
          content: "summary_large_image",
        },

        {
          name: "twitter:title",
          content: title,
        },

        {
          name: "twitter:description",
          content: description,
        },

        {
          name: "twitter:image",
          content: image,
        },
      ],

      links: [
        {
          rel: "canonical",
          href: canonical,
        },
      ],
    };
  },

  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();

  const current =
    Route.useLoaderData() as Category | null;

  const {
    data: categories = [],
    isLoading: categoriesLoading,
  } = useCategories();

  const {
    data: products = [],
    isLoading: productsLoading,
  } = useProducts();

  const list = products.filter(
    (product) => product.category === category,
  );

  const index = categories.findIndex(
    (item) => item.slug === category,
  );

  const loading =
    categoriesLoading || productsLoading;

  const categoryName =
    current?.name ?? pretty(category);

  const canonical =
    `${SITE_URL}/shop/${encodeURIComponent(category)}`;

  const description =
    current?.seo_description?.trim() ||
    fallbackDescription(categoryName);

  const image = absoluteUrl(
    current?.og_image || current?.image_url,
  );

  const schema = {
    "@context": "https://schema.org",

    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,

        url: canonical,
        name: categoryName,
        description,
        image,

        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "ZZERKOFF",
          url: `${SITE_URL}/`,
        },

        mainEntity: {
          "@type": "ItemList",

          numberOfItems: list.length,

          itemListElement: list.map(
            (product, itemIndex) => ({
              "@type": "ListItem",
              position: itemIndex + 1,
              name: product.name,

              url:
                `${SITE_URL}/product/${encodeURIComponent(
                  product.slug,
                )}`,
            }),
          ),
        },
      },

      {
        "@type": "BreadcrumbList",

        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "ZZERKOFF",
            item: `${SITE_URL}/`,
          },

          {
            "@type": "ListItem",
            position: 2,
            name: "Shop",
            item: `${SITE_URL}/shop`,
          },

          {
            "@type": "ListItem",
            position: 3,
            name: categoryName,
            item: canonical,
          },
        ],
      },
    ],
  };

  return (
    <PageShell>
      {!loading &&
        current &&
        list.length > 0 && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema).replace(
                /</g,
                "\\u003c",
              ),
            }}
          />
        )}

      <section className="relative isolate px-5 pt-32 sm:px-8 sm:pt-40">
        <LiquidChrome
          className="-right-40 top-0 h-[34rem] w-[34rem]"
          opacity={0.15}
          flip
        />

        <div className="mx-auto max-w-7xl">
          <Link
            to="/shop"
            className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Object directory
          </Link>

          {!loading &&
          (!current || list.length === 0) ? (
            <div className="py-24 text-center">
              <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
                ZZ / DIRECTORY
              </span>

              <h1 className="mt-6 font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
                NOTHING HERE YET
              </h1>

              <p className="mx-auto mt-5 max-w-xl font-editorial text-lg text-muted-foreground">
                This object category is not currently available.
              </p>

              <Link
                to="/shop"
                className="mt-10 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.35em] text-foreground"
              >
                Back to directory
              </Link>
            </div>
          ) : (
            <>
              <Reveal className="mt-8">
                <PageHeading
                  label={`ZZ / OBJECT / ${String(
                    index >= 0 ? index + 1 : 1,
                  ).padStart(2, "0")}`}
                  title={categoryName}
                  sub={`${list.length} ${
                    list.length === 1
                      ? "object"
                      : "objects"
                  } in this series.`}
                />
              </Reveal>

              <div className="mt-16 pb-28">
                <ProductGrid
                  products={list}
                  loading={loading}
                  empty="Objects for this series are still in the workshop."
                />
              </div>
            </>
          )}
        </div>
      </section>
    </PageShell>
  );
}
