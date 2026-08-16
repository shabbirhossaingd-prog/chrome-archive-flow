import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Legacy route kept only for old bookmarks.
 * Public self-signup is intentionally disabled for the private ZZERKOFF studio.
 */
export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/login" });
  },
  component: () => null,
});
