import {
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ensureAdmin } from "@/lib/admin.functions";


export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {

  const check = useServerFn(ensureAdmin);

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: [
      "authenticated-user",
    ],

    queryFn: () =>
      check({
        data: undefined,
      }),
  });


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }


  if (!data?.isAdmin) {
    window.location.href = "/admin/login";
    return null;
  }


  return <Outlet />;
}
