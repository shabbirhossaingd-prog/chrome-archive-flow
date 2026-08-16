import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/admin.functions";
import { AdminButton } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { label: "DASHBOARD", to: "/admin" as const },
  { label: "ORDERS", to: "/admin/orders" as const },
  { label: "OBJECTS", to: "/admin/products" as const },
  { label: "NEW OBJECT", to: "/admin/products/new" as const },
  { label: "COLLECTIONS", to: "/admin/collections" as const },
  { label: "ARCHIVE", to: "/admin/archive" as const },
  { label: "PAGES", to: "/admin/pages" as const },
  { label: "BLOG", to: "/admin/blog" as const },
  { label: "SETTINGS", to: "/admin/settings" as const },
];

function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const check = useServerFn(ensureAdmin);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-access"],
    retry: false,
    queryFn: () => check({ data: undefined }),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="grain-overlay" />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="glass-panel rounded-[24px] px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/" className="font-display text-sm tracking-[0.3em] text-foreground">
              ZZERKOFF
            </Link>
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              STUDIO
            </span>

            <div className="ml-auto flex items-center gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-border/60 px-4 py-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
              >
                View website
              </a>
              <AdminButton onClick={signOut}>Sign out</AdminButton>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                activeOptions={{ exact: n.to === "/admin" }}
                activeProps={{
                  className:
                    "border-chrome/60 bg-white/[0.06] text-foreground",
                }}
                className="shrink-0 rounded-xl border border-border/50 px-3 py-2 text-[8px] uppercase tracking-[0.28em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 sm:mt-10">
          {isLoading && (
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Checking access…
            </p>
          )}

          {(error || (data && !data.isAdmin)) && !isLoading && (
            <div className="glass-panel rounded-[24px] p-8">
              <h1 className="font-display text-xl tracking-[0.2em] text-foreground">
                ACCESS DENIED
              </h1>
              <p className="mt-4 text-xs tracking-[0.15em] text-muted-foreground">
                This authenticated account does not have the ZZERKOFF administrator role.
              </p>
              <div className="mt-6">
                <AdminButton onClick={signOut}>Use another account</AdminButton>
              </div>
            </div>
          )}

          {data?.isAdmin && <Outlet />}
        </div>
      </div>
    </div>
  );
}
