import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import { useMemo } from "react";
import { ArrowUpRight } from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Marquee } from "@/components/site/Marquee";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { Toaster } from "@/components/ui/sonner";

import {
  useCategories,
  useProducts,
  formatPrice,
} from "@/lib/products";

import { ProductGrid } from "@/components/site/ProductGrid";
import { CategoryCard } from "@/components/site/CategoryCard";
import { SmartImage } from "@/components/site/SmartImage";

import {
  pageJson,
  useCurrentCollection,
  usePage,
} from "@/lib/cms";

import campaign1 from "@/assets/campaign-1.webp";
import campaign2 from "@/assets/campaign-2.webp";

const SITE_URL =
  "https://zzerkoff.vercel.app";

const HOME_URL =
  `${SITE_URL}/`;

const BRAND_NAME =
  "ZZERKOFF";

const OG_IMAGE =
  `${SITE_URL}/images/zzerkoff-logo.png`;

const HOME_DESCRIPTION =
  "Shop ZZERKOFF unisex chrome rings, chains and bracelets inspired by Y2K, gothic, vintage metal and underground fashion. Objects for the afterdark.";

const HOME_SOCIAL_DESCRIPTION =
  "Unisex chrome rings, chains and bracelets inspired by Y2K, gothic, vintage metal and underground culture.";

const homepageSchema = {
  "@context":
    "https://schema.org",

  "@graph": [
    {
      "@type":
        "Organization",

      "@id":
        `${HOME_URL}#organization`,

      name:
        BRAND_NAME,

      url:
        HOME_URL,

      logo: {
        "@type":
          "ImageObject",

        url:
          OG_IMAGE,
      },

      description:
        "ZZERKOFF is a unisex alternative accessories label inspired by chrome, vintage metal, Y2K, gothic fashion and underground culture.",
    },

    {
      "@type":
        "WebSite",

      "@id":
        `${HOME_URL}#website`,

      url:
        HOME_URL,

      name:
        BRAND_NAME,

      description:
        "Unisex chrome rings, chains, bracelets and alternative accessories for the afterdark.",

      publisher: {
        "@id":
          `${HOME_URL}#organization`,
      },

      inLanguage:
        "en",
    },

    {
      "@type":
        "WebPage",

      "@id":
        `${HOME_URL}#webpage`,

      url:
        HOME_URL,

      name:
        BRAND_NAME,

      description:
        HOME_DESCRIPTION,

      isPartOf: {
        "@id":
          `${HOME_URL}#website`,
      },

      about: {
        "@id":
          `${HOME_URL}#organization`,
      },

      primaryImageOfPage:
        {
          "@type":
            "ImageObject",

          url:
            OG_IMAGE,
        },

      inLanguage:
        "en",
    },
  ],
};

export const Route =
  createFileRoute(
    "/",
  )({
    head: () => ({
      meta: [
        /*
         * Browser title:
         * ONLY ZZERKOFF
         */
        {
          title:
            BRAND_NAME,
        },

        {
          name:
            "description",

          content:
            HOME_DESCRIPTION,
        },

        {
          name:
            "author",

          content:
            BRAND_NAME,
        },

        {
          name:
            "application-name",

          content:
            BRAND_NAME,
        },

        {
          name:
            "apple-mobile-web-app-title",

          content:
            BRAND_NAME,
        },

        {
          name:
            "robots",

          content:
            "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
        },

        {
          name:
            "googlebot",

          content:
            "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
        },

        {
          property:
            "og:title",

          content:
            BRAND_NAME,
        },

        {
          property:
            "og:description",

          content:
            HOME_SOCIAL_DESCRIPTION,
        },

        {
          property:
            "og:type",

          content:
            "website",
        },

        {
          property:
            "og:site_name",

          content:
            BRAND_NAME,
        },

        {
          property:
            "og:url",

          content:
            HOME_URL,
        },

        {
          property:
            "og:locale",

          content:
            "en_US",
        },

        {
          property:
            "og:image",

          content:
            OG_IMAGE,
        },

        {
          property:
            "og:image:secure_url",

          content:
            OG_IMAGE,
        },

        {
          property:
            "og:image:alt",

          content:
            "ZZERKOFF chrome accessories",
        },

        {
          name:
            "twitter:card",

          content:
            "summary_large_image",
        },

        {
          name:
            "twitter:title",

          content:
            BRAND_NAME,
        },

        {
          name:
            "twitter:description",

          content:
            HOME_SOCIAL_DESCRIPTION,
        },

        {
          name:
            "twitter:image",

          content:
            OG_IMAGE,
        },

        {
          name:
            "twitter:image:alt",

          content:
            "ZZERKOFF chrome accessories",
        },
      ],

      links: [
        {
          rel:
            "canonical",

          href:
            HOME_URL,
        },

        {
          rel:
            "preload",

          href:
            "/images/zzerkoff-logo.webp",

          as:
            "image",

          type:
            "image/webp",

          fetchPriority:
            "high",
        },
      ],

      scripts: [
        {
          type:
            "application/ld+json",

          children:
            JSON.stringify(
              homepageSchema,
            ),
        },
      ],
    }),

    component:
      Index,
  });

type HomeSection = {
  id: string;
  type: string;
  enabled: boolean;
  title: string;
  body: string;
  image: string;
  button_label: string;
  button_href: string;
};

type HomeJson = {
  hero_eyebrow?: string;
  hero_cta_label?: string;
  hero_cta_href?: string;

  show_current_drop?: boolean;
  show_featured?: boolean;
  show_categories?: boolean;

  statement_title?: string;
  statement_body?: string;

  about_title?: string;
  about_body?: string;

  archive_images?: string[];

  sections?: HomeSection[];
};

function SectionLabel({
  children,
}: {
  children: string;
}) {
  return (
    <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
      {children}
    </span>
  );
}

function Index() {
  /*
   * IMPORTANT:
   *
   * Previous version waited 850ms
   * before even starting the product
   * and category requests.
   *
   * Requests now start immediately.
   */
  const {
    data:
      products = [],

    isLoading:
      productsLoading,
  } = useProducts();

  const {
    data:
      categories = [],

    isLoading:
      categoriesLoading,
  } = useCategories();

  const {
    data:
      currentCollection,
  } =
    useCurrentCollection();

  const {
    page:
      homePage,
  } =
    usePage(
      "home",
    );

  const home =
    pageJson<HomeJson>(
      homePage,
    );

  const currentProducts =
    currentCollection
      ? products.filter(
          (
            product,
          ) =>
            product.collection_id ===
            currentCollection.id,
        )
      : products.filter(
          (
            product,
          ) =>
            product.new_collection,
        );

  const newDrop =
    currentProducts.length >
    0
      ? currentProducts
      : products.filter(
          (
            product,
          ) =>
            product.new_collection,
        );

  const dropCode =
    currentCollection
      ?.collection_code ||
    "CURRENT DROP";

  const dropTagline =
    currentCollection
      ?.tagline ||
    "Objects selected for the afterdark.";

  const objectTypes =
    Array.from(
      new Set(
        newDrop.map(
          (
            product,
          ) =>
            product.category
              .replace(
                /-/g,
                " ",
              )
              .toUpperCase(),
        ),
      ),
    ).join(" / ") ||
    "OBJECTS";

  const featured =
    newDrop.find(
      (
        product,
      ) =>
        product.featured,
    ) ??
    newDrop[0] ??
    null;

  const visibleCategories =
    useMemo(
      () =>
        categories
          .map(
            (
              category,
            ) => ({
              category,

              count:
                products.filter(
                  (
                    product,
                  ) =>
                    product.category ===
                    category.slug,
                ).length,
            }),
          )
          .filter(
            (
              item,
            ) =>
              item.count >
              0,
          ),

      [
        categories,
        products,
      ],
    );

  /*
   * Drop section now displays
   * skeleton while products load.
   *
   * It no longer disappears
   * while waiting for Supabase.
   */
  const showDrop =
    (home.show_current_drop ??
      true) &&
    (productsLoading ||
      newDrop.length >
        0);

  const showFeatured =
    (home.show_featured ??
      true) &&
    !productsLoading &&
    !!featured;

  const showCategories =
    (home.show_categories ??
      true) &&
    !productsLoading &&
    !categoriesLoading &&
    visibleCategories.length >
      0;

  const hasDropTarget =
    productsLoading ||
    newDrop.length >
      0;

  const heroCtaLabel =
    home.hero_cta_label?.trim() ||
    (hasDropTarget
      ? `ENTER ${dropCode}`
      : "SHOP OBJECTS");

  const heroCtaHref =
    home.hero_cta_href?.trim() ||
    (hasDropTarget
      ? "/collection"
      : "/shop");

  const statementTitle =
    (
      home.statement_title ??
      "NOT MADE\nTO BLEND IN."
    ).split(
      "\n",
    );

  const aboutBody =
    (
      home.about_body ??
      "Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic fashion, Y2K and underground street culture.\n\nCreated for people who prefer bold identities over ordinary trends.\n\nFor those who don't blend in."
    )
      .split(
        "\n\n",
      )
      .filter(
        Boolean,
      );

  const archiveImages =
    home.archive_images ??
    [];

  const customSections =
    (
      home.sections ?? []
    ).filter(
      (
        section,
      ) =>
        section.enabled,
    );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background">
      <Header />

      {/* HERO — INSTANT */}

      <section className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 text-center">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[52rem] w-[52rem] -translate-x-1/2 -translate-y-1/2"
          opacity={
            0.3
          }
          blur={
            30
          }
        />

        <LiquidChrome
          className="-right-32 bottom-0 h-[30rem] w-[30rem]"
          opacity={
            0.12
          }
          flip
        />

        <div className="grain-overlay" />

        <Reveal
          immediate
        >
          <img
            src="/images/zzerkoff-logo.webp"
            alt="ZZERKOFF liquid chrome ZZ monogram"
            width={
              720
            }
            height={
              720
            }
            fetchPriority="high"
            decoding="async"
            className="mx-auto w-[68vw] max-w-[34rem] animate-float-slow mix-blend-lighten contrast-125"
          />
        </Reveal>

        <Reveal
          immediate
          className="mt-2"
        >
          <h1 className="chrome-text font-display text-3xl tracking-[0.3em] sm:text-5xl">
            {homePage
              ?.title ||
              "Zzerkoff"}
          </h1>

          <p className="mt-6 font-editorial text-lg italic text-chrome/80 sm:text-2xl">
            {homePage
              ?.subtitle ||
              "Objects for the Afterdark."}
          </p>

          <p className="mt-6 text-[9px] uppercase tracking-[0.5em] text-muted-foreground sm:text-[10px]">
            {home.hero_eyebrow ||
              "Unisex / Chrome / Vintage / Underground"}
          </p>
        </Reveal>

        <Reveal
          immediate
          className="mt-12"
        >
          <a
            href={
              heroCtaHref
            }
            className="group inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground backdrop-blur-md transition-all duration-500 hover:border-chrome hover:bg-white/[0.08]"
          >
            {
              heroCtaLabel
            }

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </a>
        </Reveal>
      </section>

      <Marquee />

      {/* CURRENT DROP */}

      {showDrop && (
        <section
          id="drop"
          className="perf-below-fold relative isolate scroll-mt-28 px-5 py-28 sm:px-8 sm:py-36"
        >
          <LiquidChrome
            className="-left-48 top-24 h-[34rem] w-[34rem]"
            opacity={
              0.14
            }
          />

          <div className="mx-auto max-w-7xl">
            <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <SectionLabel>
                  ZZ /
                  COLLECTION
                </SectionLabel>

                <h2 className="mt-5 font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
                  {
                    dropCode
                  }
                </h2>

                <p className="mt-4 font-editorial text-lg italic text-muted-foreground">
                  {
                    dropTagline
                  }
                </p>
              </div>

              <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                {
                  objectTypes
                }
              </p>
            </Reveal>

            {/*
             * PHONE:
             * CSS displays only first 3.
             *
             * DESKTOP:
             * Full grid.
             */}
            <div className="home-mobile-product-limit mt-14">
              <ProductGrid
                products={
                  newDrop
                }
                loading={
                  productsLoading
                }
              />
            </div>
          </div>
        </section>
      )}

      {/* FEATURED PRODUCT */}

      {showFeatured &&
        featured && (
          <section className="perf-below-fold relative isolate overflow-hidden px-5 py-24 sm:px-8">
            <LiquidChrome
              className="-right-40 top-0 h-[42rem] w-[42rem]"
              opacity={
                0.2
              }
              flip
            />

            <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <Reveal className="glass-panel relative overflow-hidden rounded-[28px]">
                <SmartImage
                  src={
                    featured.primary_image
                  }
                  alt={
                    featured.name
                  }
                  width={
                    1024
                  }
                  height={
                    1280
                  }
                  className="aspect-4/5 w-full object-cover grayscale"
                />

                <div className="grain-overlay" />
              </Reveal>

              <Reveal
                delay={
                  80
                }
              >
                <SectionLabel>
                  {`${dropCode} / 01`}
                </SectionLabel>

                <h2 className="mt-5 font-display text-2xl tracking-[0.18em] text-foreground sm:text-4xl">
                  {
                    featured.name
                  }
                </h2>

                <p className="mt-5 text-sm tracking-[0.25em] text-chrome">
                  {formatPrice(
                    featured.price,
                  )}
                </p>

                {featured.short_description && (
                  <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
                    {
                      featured.short_description
                    }
                  </p>
                )}

                <Link
                  to="/product/$slug"
                  params={{
                    slug:
                      featured.slug,
                  }}
                  preload="intent"
                  className="group mt-12 inline-flex items-center gap-4 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-500 hover:border-chrome hover:bg-white/[0.08]"
                >
                  View object

                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </Reveal>
            </div>
          </section>
        )}

      {/* SHOP BY OBJECT */}

      {showCategories && (
        <section className="perf-below-fold relative px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <SectionLabel>
                SHOP BY
                OBJECT
              </SectionLabel>
            </Reveal>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {visibleCategories.map(
                (
                  {
                    category,
                    count,
                  },
                  index,
                ) => (
                  <Reveal
                    key={
                      category.slug
                    }
                    delay={
                      index *
                      60
                    }
                  >
                    <CategoryCard
                      category={
                        category
                      }
                      index={
                        index
                      }
                      count={
                        count
                      }
                    />
                  </Reveal>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* CUSTOM HOME SECTIONS */}

      {customSections.map(
        (
          section,
          index,
        ) => (
          <section
            key={
              section.id
            }
            className="perf-below-fold relative isolate px-5 py-20 sm:px-8 sm:py-28"
          >
            <div
              className={`mx-auto max-w-7xl ${
                section.image
                  ? "grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
                  : "max-w-4xl text-center"
              }`}
            >
              {section.image && (
                <Reveal className="glass-panel overflow-hidden rounded-[26px]">
                  <SmartImage
                    src={
                      section.image
                    }
                    alt={
                      section.title ||
                      `Home section ${
                        index +
                        1
                      }`
                    }
                    width={
                      1000
                    }
                    height={
                      1200
                    }
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                </Reveal>
              )}

              <Reveal
                delay={
                  section.image
                    ? 60
                    : 0
                }
              >
                <SectionLabel>
                  {section.type
                    .replace(
                      /-/g,
                      " ",
                    )
                    .toUpperCase()}
                </SectionLabel>

                {section.title && (
                  <h2 className="mt-5 font-display text-3xl tracking-[0.16em] text-foreground sm:text-5xl">
                    {
                      section.title
                    }
                  </h2>
                )}

                {section.body && (
                  <p className="mt-6 whitespace-pre-line font-editorial text-lg leading-relaxed text-muted-foreground">
                    {
                      section.body
                    }
                  </p>
                )}

                {section.button_label &&
                  section.button_href && (
                    <a
                      href={
                        section.button_href
                      }
                      className="mt-8 inline-flex rounded-full border border-chrome/50 px-7 py-4 text-[9px] uppercase tracking-[0.35em] text-foreground"
                    >
                      {
                        section.button_label
                      }
                    </a>
                  )}
              </Reveal>
            </div>
          </section>
        ),
      )}

      {/* BRAND STATEMENT */}

      <section className="perf-below-fold relative isolate overflow-hidden px-5 py-36 sm:px-8 sm:py-48">
        <LiquidChrome
          className="left-1/2 top-1/2 h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2"
          opacity={
            0.16
          }
        />

        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h2 className="chrome-text font-display text-4xl leading-[1.1] tracking-[0.08em] sm:text-6xl lg:text-7xl">
              {statementTitle.map(
                (
                  line,
                  index,
                ) => (
                  <span
                    key={`${line}-${index}`}
                    className="block"
                  >
                    {
                      line
                    }
                  </span>
                ),
              )}
            </h2>
          </Reveal>

          <Reveal
            delay={
              80
            }
          >
            <p className="mt-12 max-w-xl font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {home.statement_body ||
                "ZZERKOFF explores metal, distortion, vintage forms and underground culture through unisex accessories."}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ARCHIVE */}

      <section
        id="archive"
        className="perf-below-fold relative scroll-mt-28 px-5 py-24 sm:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <Reveal className="flex items-end justify-between gap-6">
            <h2 className="font-display text-3xl tracking-[0.2em] text-foreground sm:text-5xl">
              THE ARCHIVE
            </h2>

            <SectionLabel>
              ZZ / VISUAL
              SERIES 001
            </SectionLabel>
          </Reveal>

          <div className="mt-14 grid gap-4 sm:gap-6 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                {archiveImages[0] ? (
                  <SmartImage
                    src={
                      archiveImages[0]
                    }
                    alt="ZZERKOFF archive image"
                    width={
                      1000
                    }
                    height={
                      1250
                    }
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                ) : (
                  <img
                    src={
                      campaign1
                    }
                    alt="Hands wearing chrome rings, flash photography"
                    loading="lazy"
                    decoding="async"
                    width={
                      1000
                    }
                    height={
                      1250
                    }
                    className="aspect-4/5 w-full object-cover grayscale"
                  />
                )}

                <div className="grain-overlay" />
              </figure>
            </Reveal>

            <div className="flex flex-col gap-4 sm:gap-6 lg:col-span-5">
              <Reveal>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  {archiveImages[1] ? (
                    <SmartImage
                      src={
                        archiveImages[1]
                      }
                      alt="ZZERKOFF archive image"
                      width={
                        1000
                      }
                      height={
                        750
                      }
                      className="aspect-4/3 w-full object-cover grayscale"
                    />
                  ) : (
                    <img
                      src={
                        campaign2
                      }
                      alt="Model in dark outfit with chrome chains"
                      loading="lazy"
                      decoding="async"
                      width={
                        1000
                      }
                      height={
                        750
                      }
                      className="aspect-4/3 w-full object-cover grayscale"
                    />
                  )}

                  <div className="grain-overlay" />
                </figure>
              </Reveal>

              <Reveal>
                <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                  {archiveImages[2] ? (
                    <SmartImage
                      src={
                        archiveImages[2]
                      }
                      alt="ZZERKOFF archive image"
                      width={
                        900
                      }
                      height={
                        900
                      }
                      className="aspect-square w-full object-cover grayscale"
                    />
                  ) : products[1]
                      ?.primary_image ? (
                    <SmartImage
                      src={
                        products[1]
                          .primary_image
                      }
                      alt={
                        products[1]
                          .name
                      }
                      width={
                        900
                      }
                      height={
                        900
                      }
                      className="aspect-square w-full object-cover grayscale"
                    />
                  ) : (
                    <img
                      src={
                        campaign2
                      }
                      alt="ZZERKOFF campaign"
                      loading="lazy"
                      decoding="async"
                      width={
                        900
                      }
                      height={
                        900
                      }
                      className="aspect-square w-full object-cover grayscale"
                    />
                  )}

                  <div className="grain-overlay" />
                </figure>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="perf-below-fold relative isolate scroll-mt-28 px-5 py-32 sm:px-8"
      >
        <LiquidChrome
          className="-left-32 bottom-0 h-[30rem] w-[30rem]"
          opacity={
            0.12
          }
        />

        <div className="mx-auto max-w-3xl">
          <Reveal>
            <h2 className="font-display text-2xl tracking-[0.2em] text-foreground sm:text-4xl">
              {home.about_title ||
                "THIS IS ZZERKOFF."}
            </h2>
          </Reveal>

          <Reveal
            delay={
              60
            }
          >
            <div className="mt-10 space-y-6 font-editorial text-lg leading-relaxed text-muted-foreground">
              {aboutBody.map(
                (
                  paragraph,
                  index,
                ) => (
                  <p
                    key={`${paragraph}-${index}`}
                    className={
                      index ===
                      aboutBody.length -
                        1
                        ? "text-chrome"
                        : ""
                    }
                  >
                    {
                      paragraph
                    }
                  </p>
                ),
              )}
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />

      <Toaster />
    </div>
  );
}
