import {
  createFileRoute,
} from "@tanstack/react-router";

import {
  useMemo,
} from "react";

import {
  Header,
} from "@/components/site/Header";

import {
  Footer,
} from "@/components/site/Footer";

import {
  Marquee,
} from "@/components/site/Marquee";

import {
  LiquidChrome,
} from "@/components/site/LiquidChrome";

import {
  Reveal,
} from "@/components/site/Reveal";

import {
  Toaster,
} from "@/components/ui/sonner";

import {
  ProductGrid,
} from "@/components/site/ProductGrid";

import {
  CategoryCard,
} from "@/components/site/CategoryCard";

import {
  SmartImage,
} from "@/components/site/SmartImage";

import {
  useProducts,
  useCategories,
  formatPrice,
} from "@/lib/products";

import {
  useCurrentCollection,
  usePage,
  pageJson,
} from "@/lib/cms";


const SITE_URL =
  "https://zzerkoff.vercel.app";


export const Route =
  createFileRoute("/")({
    head: () => ({
      meta: [
        {
          title:
            "ZZERKOFF",
        },

        {
          name:
            "description",

          content:
            "ZZERKOFF unisex chrome accessories inspired by Y2K, gothic, vintage metal and underground culture.",
        },
      ],

      links: [
        {
          rel:
            "preload",

          href:
            "/images/zzerkoff-logo.webp",

          as:
            "image",

          fetchPriority:
            "high",
        },
      ],
    }),

    component:
      HomePage,
  });



type HomeJson = {
  hero_eyebrow?: string;

  hero_cta_label?: string;

  hero_cta_href?: string;

  statement_title?: string;

  statement_body?: string;
};



function HomePage() {


  /*
   * IMPORTANT:
   *
   * No artificial delay.
   * Data starts immediately.
   */
  const {
    data:
      products = [],

    isLoading:
      productsLoading,
  } =
    useProducts();


  const {
    data:
      categories = [],

    isLoading:
      categoriesLoading,
  } =
    useCategories();


  const {
    data:
      collection,
  } =
    useCurrentCollection();


  const {
    page,
  } =
    usePage(
      "home",
    );


  const home =
    pageJson<HomeJson>(
      page,
    );



  const dropProducts =
    useMemo(
      () => {

        if (
          collection
        ) {
          return products.filter(
            (
              item,
            ) =>
              item.collection_id ===
              collection.id,
          );
        }


        return products.filter(
          (
            item,
          ) =>
            item.new_collection,
        );

      },

      [
        products,
        collection,
      ],
    );



  const featured =
    dropProducts[0];



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
              item.count > 0,
          ),

      [
        categories,
        products,
      ],
    );



  return (

    <div
      className="
        min-h-screen
        overflow-x-clip
        bg-background
      "
    >

      <Header />


      {/* HERO */}

      <section
        className="
          relative
          isolate
          flex
          min-h-screen
          items-center
          justify-center
          overflow-hidden
          px-5
          text-center
        "
      >


        <LiquidChrome
          priority
          className="
            left-1/2
            top-1/2
            h-[52rem]
            w-[52rem]
            -translate-x-1/2
            -translate-y-1/2
          "

          opacity={
            0.3
          }

          blur={
            30
          }
        />



        <div
          className="
            grain-overlay
          "
        />



        <div
          className="
            relative
            z-10
          "
        >

          <Reveal
            immediate
          >

            <img
              src="
              /images/zzerkoff-logo.webp
              "

              alt="
              ZZERKOFF
              "

              width={
                720
              }

              height={
                720
              }

              loading="eager"

              fetchPriority="high"

              decoding="async"

              className="
                mx-auto
                w-[68vw]
                max-w-[34rem]
                animate-float-slow
                mix-blend-lighten
              "
            />

          </Reveal>



          <Reveal
            immediate
            delay={
              50
            }
          >

            <h1
              className="
                chrome-text
                mt-4
                font-display
                text-4xl
                tracking-[0.3em]
              "
            >

              ZZERKOFF

            </h1>


            <p
              className="
                mt-6
                font-editorial
                text-xl
                italic
                text-chrome/80
              "
            >

              Objects for the Afterdark.

            </p>


          </Reveal>



        </div>

      </section>




      <Marquee />




      {/* PRODUCTS */}

      <section
        className="
          perf-below-fold
          px-5
          py-28
        "
      >

        <div
          className="
            mx-auto
            max-w-7xl
          "
        >

          <Reveal>

            <h2
              className="
                font-display
                text-4xl
                tracking-[0.2em]
              "
            >

              CURRENT DROP

            </h2>

          </Reveal>



          <div
            className="
              mt-12
              home-mobile-product-limit
            "
          >

            <ProductGrid

              products={
                dropProducts
              }

              loading={
                productsLoading
              }

            />

          </div>


        </div>

      </section>




      {/* FEATURED */}

      {
        featured && (

          <section
            className="
              perf-below-fold
              px-5
              py-24
            "
          >

            <div
              className="
                mx-auto
                max-w-5xl
              "
            >

              <Reveal>

                <SmartImage

                  src={
                    featured.primary_image
                  }

                  alt={
                    featured.name
                  }

                  eager

                  width={
                    900
                  }

                  height={
                    1100
                  }

                  className="
                    rounded-3xl
                    grayscale
                  "

                />


              </Reveal>



              <h2
                className="
                  mt-8
                  font-display
                  text-3xl
                "
              >

                {
                  featured.name
                }

              </h2>



              <p
                className="
                  mt-4
                  text-chrome
                "
              >

                {
                  formatPrice(
                    featured.price,
                  )
                }

              </p>


            </div>

          </section>

        )
      }





      {/* CATEGORY */}

      {
        !categoriesLoading &&
        visibleCategories.length >
        0 && (

          <section
            className="
              perf-below-fold
              px-5
              py-24
            "
          >

            <div
              className="
                mx-auto
                grid
                max-w-7xl
                gap-6
                md:grid-cols-3
              "
            >

              {
                visibleCategories.map(
                  (
                    item,
                    index,
                  ) => (

                    <Reveal
                      key={
                        item.category.slug
                      }

                      delay={
                        index * 50
                      }
                    >

                      <CategoryCard

                        category={
                          item.category
                        }

                        count={
                          item.count
                        }

                        index={
                          index
                        }

                      />

                    </Reveal>

                  ),
                )
              }


            </div>

          </section>

        )
      }





      <Footer />

      <Toaster />

    </div>

  );
}
