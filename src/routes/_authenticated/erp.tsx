import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronUp,
  FileText,
  LayoutDashboard,
  PackagePlus,
  ReceiptText,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/erp")({
  component: ErpLayout,
});

const DESKTOP_NAV = [
  { label: "OVERVIEW", to: "/erp" as const, icon: LayoutDashboard },
  { label: "PURCHASES", to: "/erp/purchases" as const, icon: PackagePlus },
  { label: "INVENTORY", to: "/erp/inventory" as const, icon: Boxes },
  { label: "EXPENSES", to: "/erp/expenses" as const, icon: ReceiptText },
  { label: "REPORTS", to: "/erp/reports" as const, icon: BarChart3 },
  { label: "MONTH CLOSE", to: "/erp/month-close" as const, icon: FileText },
  { label: "SETTINGS", to: "/erp/settings" as const, icon: Settings },
];

const MOBILE_NAV = [
  { label: "OVERVIEW", to: "/erp" as const, icon: LayoutDashboard },
  { label: "PURCHASE", to: "/erp/purchases" as const, icon: PackagePlus },
  { label: "STOCK", to: "/erp/inventory" as const, icon: Boxes },
  { label: "EXPENSE", to: "/erp/expenses" as const, icon: ReceiptText },
  { label: "REPORTS", to: "/erp/reports" as const, icon: BarChart3 },
];

function ErpLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const check = useServerFn(ensureAdmin);
  const [moreOpen, setMoreOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["erp-admin-access"],
    retry: false,
    queryFn: () => check({ data: undefined }),
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    navigate({ to: "/admin/login", replace: true });
  };

  return (
    <div className="relative min-h-screen bg-background pb-24 sm:pb-0">
      <div className="grain-overlay" />

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-8 sm:py-8">
        <header className="glass-panel rounded-[26px] border border-border/50 px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div>
              <Link
                to="/erp"
                className="font-display text-sm tracking-[0.28em] text-foreground"
              >
                ZZERKOFF
              </Link>
              <span className="ml-3 text-[8px] uppercase tracking-[0.4em] text-muted-foreground">
                ERP / STUDIO
              </span>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Link
                to="/admin"
                className="rounded-xl border border-chrome/45 bg-white/[0.035] px-4 py-3 text-[8px] uppercase tracking-[0.3em] text-foreground transition-colors hover:bg-white/[0.08]"
              >
                Admin
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="hidden rounded-xl border border-border/55 px-4 py-3 text-[8px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Sign out
              </button>
            </div>
          </div>

          <nav className="mt-4 hidden flex-wrap gap-2 sm:flex">
            {DESKTOP_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/erp" }}
                  activeProps={{
                    className:
                      "border-chrome/60 bg-white/[0.06] text-foreground",
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2.5 text-[8px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="ml-auto rounded-xl border border-border/50 px-3 py-2.5 text-[8px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
            >
              View website
            </a>
          </nav>
        </header>

        <main className="mt-6 sm:mt-8">
          {isLoading && (
            <p className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              Opening ERP…
            </p>
          )}

          {(error || (data && !data.isAdmin)) && !isLoading && (
            <div className="glass-panel rounded-[26px] border border-border/50 p-8">
              <ShieldCheck className="size-6 text-muted-foreground" />
              <h1 className="mt-5 font-display text-xl tracking-[0.18em] text-foreground">
                ERP ACCESS DENIED
              </h1>
              <p className="mt-4 text-xs leading-relaxed tracking-[0.06em] text-muted-foreground">
                This workspace is available only to ZZERKOFF administrators.
              </p>
              <button
                type="button"
                onClick={signOut}
                className="mt-6 rounded-xl border border-border/60 px-5 py-3 text-[8px] uppercase tracking-[0.3em] text-muted-foreground"
              >
                Use another account
              </button>
            </div>
          )}

          {data?.isAdmin && <Outlet />}
        </main>
      </div>

      {moreOpen && (
        <div className="fixed inset-x-4 bottom-24 z-50 sm:hidden">
          <div className="glass-panel rounded-[24px] border border-border/60 p-3 shadow-2xl">
            <div className="grid gap-2">
              <Link
                to="/erp/month-close"
                onClick={() => setMoreOpen(false)}
                className="rounded-2xl border border-border/50 px-4 py-4 text-[9px] uppercase tracking-[0.3em] text-foreground"
              >
                Month Close
              </Link>
              <Link
                to="/erp/settings"
                onClick={() => setMoreOpen(false)}
                className="rounded-2xl border border-border/50 px-4 py-4 text-[9px] uppercase tracking-[0.3em] text-foreground"
              >
                ERP Settings
              </Link>
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className="rounded-2xl border border-chrome/45 bg-white/[0.035] px-4 py-4 text-[9px] uppercase tracking-[0.3em] text-foreground"
              >
                Back to Admin
              </Link>
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-border/50 px-4 py-4 text-[9px] uppercase tracking-[0.3em] text-muted-foreground"
              >
                View Website
              </a>
              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl border border-border/50 px-4 py-4 text-left text-[9px] uppercase tracking-[0.3em] text-muted-foreground"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-black/90 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl sm:hidden">
        <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                activeOptions={{ exact: item.to === "/erp" }}
                activeProps={{ className: "text-foreground bg-white/[0.06]" }}
                className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[7px] uppercase tracking-[0.12em] text-muted-foreground"
              >
                <Icon className="size-4" />
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen((value) => !value)}
            className="flex flex-col items-center gap-1 rounded-xl px-1 py-2.5 text-[7px] uppercase tracking-[0.12em] text-muted-foreground"
          >
            <ChevronUp
              className={`size-4 transition-transform ${moreOpen ? "rotate-180" : ""}`}
            />
            More
          </button>
        </div>
      </nav>
    </div>
  );
}
