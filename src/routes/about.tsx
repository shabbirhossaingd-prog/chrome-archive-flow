import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";
import { useState } from "react";

import { PageShell } from "@/components/site/PageShell";
import { LiquidChrome } from "@/components/site/LiquidChrome";
import { Reveal } from "@/components/site/Reveal";
import { SmartImage } from "@/components/site/SmartImage";

import {
  usePage,
  pageJson,
  usePublishedPosts,
  formatDate,
} from "@/lib/cms";

import campaign1 from "@/assets/campaign-1.webp";
import campaign2 from "@/assets/campaign-2.webp";

export const Route =
  createFileRoute(
    "/about",
  )({
    head: () => ({
      meta: [
        {
          title:
            "This is ZZERKOFF — About the label",
        },
        {
          name: "description",
          content:
            "ZZERKOFF is a unisex accessories label built on vintage metal, chrome, gothic fashion, Y2K and underground street culture.",
        },
        {
          property:
            "og:title",
          content:
            "This is ZZERKOFF — About the label",
        },
        {
          property:
            "og:description",
          content:
            "Not made to blend in. Objects for the afterdark, made in Dhaka.",
        },
      ],
    }),

    component: AboutPage,
  });

type AboutJson = {
  statement?: string;
  tagline?: string;
  campaign_images?: string[];
};

function JournalSkeleton() {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({
        length: 6,
      }).map(
        (_, index) => (
          <div
            key={index}
            className={
              index >= 3
                ? "hidden md:block"
                : ""
            }
          >
            <div className="glass-panel overflow-hidden rounded-[24px]">
              <div className="aspect-4/3 animate-pulse bg-white/[0.045]" />

              <div className="space-y-4 p-6">
                <div className="h-2 w-24 animate-pulse rounded-full bg-white/[0.06]" />

                <div className="h-4 w-4/5 animate-pulse rounded-full bg-white/[0.07]" />

                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded-full bg-white/[0.045]" />

                  <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/[0.045]" />
                </div>
              </div>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function AboutPage() {
  const {
    page,
  } = usePage(
    "about",
  );

  const {
    data: posts = [],
    isLoading:
      postsLoading,
    isError:
      postsError,
  } =
    usePublishedPosts();

  const [
    showAllPosts,
    setShowAllPosts,
  ] = useState(false);

  const json =
    pageJson<AboutJson>(
      page,
    );

  const label =
    page?.label ||
    "ZZ / LABEL";

  const title =
    page?.title ||
    "THIS IS ZZERKOFF.";

  const intro =
    page?.subtitle ||
    "An alternative accessories label from Dhaka.";

  const body =
    page?.body ||
    "Zzerkoff is a unisex accessories label inspired by vintage metal, chrome, gothic fashion, Y2K and underground street culture.";

  const statement =
    json.statement ||
    "NOT MADE\nTO BLEND IN.";

  const tagline =
    json.tagline ||
    "Objects for the Afterdark.";

  const campaignImages =
    json.campaign_images &&
    json.campaign_images
      .length > 0
      ? json.campaign_images
      : [
          campaign1,
          campaign2,
          campaign1,
        ];

  const showJournal =
    postsLoading ||
    posts.length > 0;

  return (
    <PageShell>
      {/* ABOUT INTRO */}

      <section className="relative isolate overflow-hidden px-5 pt-40 sm:px-8 sm:pt-56">
        <LiquidChrome
          className="left-1/2 top-24 h-[46rem] w-[46rem] -translate-x-1/2"
          opacity={0.2}
        />

        <div className="mx-auto max-w-4xl">
          <Reveal immediate>
            <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
              {label}
            </span>

            <h1 className="chrome-text mt-8 whitespace-pre-line font-display text-4xl leading-[1.05] tracking-[0.1em] sm:text-6xl">
              {title}
            </h1>
          </Reveal>

          <Reveal delay={100}>
            <div className="mt-16 max-w-2xl space-y-8 font-editorial text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {intro && (
                <p>
                  {intro}
                </p>
              )}

              {body
                .split(
                  /\n{2,}/,
                )
                .filter(
                  Boolean,
                )
                .map(
                  (
                    paragraph,
                    index,
                  ) => (
                    <p
                      key={
                        index
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

      {/* STATEMENT */}

      <section className="perf-below-fold relative isolate overflow-hidden px-5 py-36 sm:px-8 sm:py-48">
        <LiquidChrome
          className="-left-40 top-10 h-[36rem] w-[36rem]"
          opacity={0.14}
          flip
        />

        <div className="mx-auto max-w-6xl">
          <Reveal>
            <h2 className="chrome-text whitespace-pre-line font-display text-4xl leading-[1.08] tracking-[0.06em] sm:text-6xl lg:text-7xl">
              {statement}
            </h2>
          </Reveal>

          <Reveal delay={100}>
            <p className="mt-14 font-editorial text-2xl italic text-chrome/80 sm:text-3xl">
              {tagline}
            </p>
          </Reveal>
        </div>
      </section>

      {/* CAMPAIGN IMAGES */}

      <section className="perf-below-fold px-5 pb-32 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 sm:gap-6 lg:grid-cols-3">
          {campaignImages
            .slice(0, 6)
            .map(
              (
                src,
                index,
              ) => (
                <Reveal
                  key={`${src}-${index}`}
                  delay={
                    index < 3
                      ? 0
                      : 80
                  }
                >
                  <figure className="glass-panel relative overflow-hidden rounded-[26px]">
                    <SmartImage
                      src={src}
                      alt="ZZERKOFF campaign imagery"
                      width={
                        900
                      }
                      height={
                        1125
                      }
                      className="aspect-4/5 w-full object-cover grayscale brightness-90"
                    />

                    <div className="grain-overlay" />
                  </figure>
                </Reveal>
              ),
            )}
        </div>
      </section>

      {/* JOURNAL */}

      {showJournal && (
        <section className="perf-below-fold px-5 pb-32 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <Reveal
              immediate
            >
              <span className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground">
                ZZ / JOURNAL
              </span>

              <h2 className="mt-5 font-display text-2xl tracking-[0.18em] text-foreground sm:text-4xl">
                LATEST FROM
                ZZERKOFF
              </h2>
            </Reveal>

            {/* INSTANT SKELETON */}

            {postsLoading && (
              <JournalSkeleton />
            )}

            {/* BLOG DATA */}

            {!postsLoading &&
              posts.length >
                0 && (
                <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {posts.map(
                    (
                      post,
                      index,
                    ) => {
                      /*
                       * PHONE:
                       * first 3
                       *
                       * MD+:
                       * first 6
                       */
                      const visibilityClass =
                        showAllPosts
                          ? ""
                          : index >=
                              6
                            ? "hidden"
                            : index >=
                                3
                              ? "hidden md:block"
                              : "";

                      const immediate =
                        index <
                        3;

                      return (
                        <div
                          key={
                            post.id
                          }
                          className={
                            visibilityClass
                          }
                        >
                          <Reveal
                            immediate={
                              immediate
                            }
                            delay={
                              immediate
                                ? 0
                                : (index %
                                      3) *
                                  60
                            }
                          >
                            <Link
                              to="/blog/$slug"
                              params={{
                                slug: post.slug,
                              }}
                              preload="intent"
                              className="group glass-panel block h-full overflow-hidden rounded-[24px]"
                            >
                              <SmartImage
                                src={
                                  post.featured_image
                                }
                                alt={
                                  post.title
                                }
                                width={
                                  720
                                }
                                height={
                                  540
                                }
                                className="aspect-4/3 w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.02]"
                              />

                              <div className="p-6">
                                <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                                  {formatDate(
                                    post.published_at ??
                                      post.created_at,
                                  )}
                                </span>

                                <h3 className="mt-4 font-display text-base tracking-[0.13em] text-foreground">
                                  {
                                    post.title
                                  }
                                </h3>

                                <p className="mt-4 font-editorial text-base leading-relaxed text-muted-foreground">
                                  {
                                    post.excerpt
                                  }
                                </p>

                                <span className="mt-6 block text-[9px] uppercase tracking-[0.35em] text-chrome">
                                  Read
                                  →
                                </span>
                              </div>
                            </Link>
                          </Reveal>
                        </div>
                      );
                    },
                  )}
                </div>
              )}

            {!postsLoading &&
              postsError && (
                <p className="mt-10 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
                  Journal
                  temporarily
                  unavailable.
                </p>
              )}

            {/* VIEW MORE */}

            {!postsLoading &&
              posts.length >
                3 && (
                <div
                  className={`mt-12 flex justify-center ${
                    posts.length <=
                    6
                      ? "md:hidden"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setShowAllPosts(
                        (
                          current,
                        ) =>
                          !current,
                      )
                    }
                    aria-expanded={
                      showAllPosts
                    }
                    className="group inline-flex items-center gap-4 rounded-full border border-chrome/40 bg-white/[0.03] px-7 py-4 text-[9px] uppercase tracking-[0.4em] text-foreground backdrop-blur-sm transition-all duration-300 hover:border-chrome hover:bg-white/[0.07]"
                  >
                    <span>
                      {showAllPosts
                        ? "Show less"
                        : "View more"}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`text-base leading-none transition-transform duration-300 ${
                        showAllPosts
                          ? "rotate-180"
                          : ""
                      }`}
                    >
                      ↓
                    </span>
                  </button>
                </div>
              )}
          </div>
        </section>
      )}
    </PageShell>
  );
}
