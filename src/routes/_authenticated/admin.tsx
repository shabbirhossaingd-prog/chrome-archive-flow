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
  { label: "OBJECTS", to: "/admin" as const },
  { label: "NEW OBJECT", to: "/admin/products/new" as const },
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
    navigate({ to: "/auth" });
  };

  return (
    <div className="relative min-h-screen bg-background">
      <div className="grain-overlay" />
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="glass-panel flex flex-wrap items-center gap-4 rounded-[24px] px-5 py-4">
          <Link to="/" className="font-display text-sm tracking-[0.3em] text-foreground">
            ZZERKOFF
          </Link>
          <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            STUDIO
          </span>
          <nav className="ml-auto flex flex-wrap items-center gap-5">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-foreground" }}
                className="text-[9px] uppercase tracking-[0.35em] text-muted-foreground transition-colors hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <AdminButton onClick={signOut}>Sign out</AdminButton>
          </nav>
        </div>

        <div className="mt-10">
          {isLoading && (
            <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Verifying access…
            </p>
          )}
          {(error || (data && !data.isAdmin)) && (
            <div className="glass-panel rounded-[24px] p-8">
              <h1 className="font-display text-xl tracking-[0.2em] text-foreground">
                ACCESS DENIED
              </h1>
              <p className="mt-4 text-xs tracking-[0.15em] text-muted-foreground">
                This account is not an administrator of the studio.
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