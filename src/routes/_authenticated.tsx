import {
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import { ensureAdmin } from "@/lib/admin.functions";


export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const result = await ensureAdmin();

    if (!result?.isAdmin) {
      throw redirect({
        to: "/admin/login",
      });
    }
  },

  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {
  return <Outlet />;
}
