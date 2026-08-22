import {
  Outlet,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  useServerFn,
} from "@tanstack/react-start";

import {
  ensureAdmin,
} from "@/lib/admin.functions";


export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});


function AuthenticatedLayout() {

  const checkAdmin = useServerFn(ensureAdmin);


  const {
    data,
    isLoading,
    error,
  } = useQuery({

    queryKey: [
      "admin-auth",
    ],

    queryFn: async () => {

      return await checkAdmin({
        data: undefined,
      });

    },

    retry: false,

  });


  if (isLoading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        Checking access...
      </div>
    );

  }


  if (error || !data?.isAdmin) {

    throw redirect({
      to: "/admin/login",
    });

  }


  return <Outlet />;

}
