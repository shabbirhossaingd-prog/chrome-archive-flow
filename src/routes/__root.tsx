import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import {
  Toaster,
} from "@/components/ui/sonner";

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import {
  SiteProvider,
} from "@/lib/settings";

import "@/styles.css";
import "@/performance.css";


export const Route =
  createRootRouteWithContext<{
    queryClient: QueryClient;
  }>()({

    head: () => ({
      meta: [
        {
          charSet: "utf-8",
        },

        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },

        {
          name: "theme-color",
          content: "#050505",
        },

        {
          name: "color-scheme",
          content: "dark",
        },
      ],

      links: [
        {
          rel: "preload",
          href: "/images/zzerkoff-logo.webp",
          as: "image",
          type: "image/webp",
          fetchPriority: "high",
        },

        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },

        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
      ],
    }),

    component: RootComponent,

  });



const queryClient = new QueryClient();



function RootComponent() {

  return (

    <QueryClientProvider client={queryClient}>

      <SiteProvider>

        <TooltipProvider>

          <HeadContent />

          <Outlet />

          <Toaster />

          <Scripts />

        </TooltipProvider>

      </SiteProvider>

    </QueryClientProvider>

  );

}
