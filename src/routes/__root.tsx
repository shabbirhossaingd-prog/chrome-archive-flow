import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import {
  TanStackRouterDevtools,
} from "@tanstack/react-router-devtools";

import type {
  QueryClient,
} from "@tanstack/react-query";

import {
  useEffect,
} from "react";

import {
  ThemeProvider,
} from "@/components/theme-provider";

import {
  Toaster,
} from "@/components/ui/sonner";

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  CartProvider,
} from "@/components/cart";

import {
  WishlistProvider,
} from "@/components/wishlist";

import {
  SiteProvider,
} from "@/lib/settings";

import "@/index.css";
import "@/performance.css";


export const Route =
  createRootRouteWithContext<{
    queryClient:
      QueryClient;
  }>()({

    head: () => ({
      meta: [

        {
          charSet:
            "utf-8",
        },

        {
          name:
            "viewport",

          content:
            "width=device-width, initial-scale=1",
        },

        {
          name:
            "theme-color",

          content:
            "#050505",
        },

        {
          name:
            "color-scheme",

          content:
            "dark",
        },

      ],

      links: [

        /*
         * Faster logo first paint
         */
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


        /*
         * Prevent font blocking
         */
        {
          rel:
            "preconnect",

          href:
            "https://fonts.googleapis.com",
        },

        {
          rel:
            "preconnect",

          href:
            "https://fonts.gstatic.com",

          crossOrigin:
            "anonymous",
        },

      ],
    }),


    component:
      RootComponent,

  });



function RootComponent() {


  useEffect(() => {

    /*
     * Browser can do lower priority
     * work after first paint.
     */
    const root =
      document.documentElement;


    requestAnimationFrame(
      () => {

        root.classList.add(
          "app-ready",
        );

      },
    );


  }, []);



  return (

    <ThemeProvider
      defaultTheme="dark"
      storageKey="zzerkoff-theme"
    >

      <SiteProvider>

        <CartProvider>

          <WishlistProvider>


            <TooltipProvider>


              <HeadContent />


              <Outlet />


              <Toaster />

              <Scripts />


              {
                import.meta.env.DEV && (
                  <TanStackRouterDevtools />
                )
              }


            </TooltipProvider>


          </WishlistProvider>


        </CartProvider>


      </SiteProvider>


    </ThemeProvider>

  );

}
