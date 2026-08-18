import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import {
  fetchErpMetrics,
  money,
  monthKey,
  monthLabel,
  monthParts,
} from "@/lib/erp";
import {
  ErpButton,
  ErpLabel,
  ErpMetric,
  ErpPanel,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/month-close")({
  component: ErpMonthClose,
});

type MonthClose = {
  id: string;
  year: number;
  month: number;
  status: "closed" | "reopened";
  snapshot: Record<string, any>;
  closed_at: string;
  reopened_at: string | null;
};

function ErpMonthClose() {
  const site = useSite();
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(monthKey());

  const metricsQuery = useQuery({
    queryKey: ["erp-close-preview", month],
    queryFn: () => fetchErpMetrics(month),
  });

  const closesQuery = useQuery({
    queryKey: ["erp-month-closes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("erp_month_closes")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MonthClose[];
    },
  });

  const closeMonth = useMutation({
    mutationFn: async () => {
      const { year, month: monthNumber } = monthParts(month);
      const { data, error } = await (supabase as any).rpc("close_erp_month", {
        p_year: year,
        p_month: monthNumber,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`${monthLabel(month)} snapshot closed.`);
      queryClient.invalidateQueries({ queryKey: ["erp-month-closes"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not close month."),
  });

  const reopenMonth = useMutation({
    mutationFn: async (row: MonthClose) => {
      const { error } = await (supabase as any).rpc("reopen_erp_month", {
        p_year: row.year,
        p_month: row.month,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Month reopened. You can close it again with a fresh snapshot.");
      queryClient.invalidateQueries({ queryKey: ["erp-month-closes"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not reopen month."),
  });

  const metrics = metricsQuery.data;
  const autoClose = Boolean((site.settings as any)?.erp_auto_month_close ?? true);

  return (
    <div className="space-y-6 pb-8">
      <div>
        <ErpLabel>ERP / FINANCIAL CONTROL</ErpLabel>
        <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
          MONTH CLOSE
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Freeze a month-level business snapshot so later cost changes do not rewrite your archived result.
        </p>
      </div>

      <ErpPanel className="border-chrome/35">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <ErpLabel>Auto month end</ErpLabel>
            <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-chrome">
              {autoClose
                ? "ON — previous month closes on first ERP visit"
                : "OFF — close months manually"}
            </p>
          </div>
          <a
            href="/erp/settings"
            className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            Change settings
          </a>
        </div>
      </ErpPanel>

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <ErpPanel>
          <ErpLabel>Create snapshot</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            CLOSE A MONTH
          </h2>

          <label className="mt-6 block">
            <ErpLabel className="mb-2">Month</ErpLabel>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-2xl border border-border/60 bg-black/35 px-4 py-3.5 text-xs text-foreground outline-none"
            />
          </label>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <ErpMetric
              label="Sales"
              value={money(metrics?["gross_sales"] ?? 0, site.currencySymbol)}
            />
            <ErpMetric
              label="Net profit"
              value={money(metrics?["net_profit"] ?? 0, site.currencySymbol)}
              emphasis
            />
            <ErpMetric
              label="Expenses"
              value={money(metrics?["operating_expenses"] ?? 0, site.currencySymbol)}
            />
            <ErpMetric
              label="Stock value"
              value={money(metrics?["stock_value"] ?? 0, site.currencySymbol)}
            />
          </div>

          <p className="mt-5 text-[9px] leading-relaxed text-muted-foreground">
            Closing stores a snapshot of sales, COGS, courier, packaging, payment fees,
            expenses, purchases, COD pending and inventory value.
          </p>

          <ErpButton
            tone="primary"
            className="mt-5 w-full"
            disabled={closeMonth.isPending}
            onClick={() => {
              const ok = window.confirm(
                `Close ${monthLabel(month)} with the current ERP numbers?`,
              );
              if (ok) closeMonth.mutate();
            }}
          >
            <span className="inline-flex items-center gap-2">
              <LockKeyhole className="size-3.5" />
              {closeMonth.isPending ? "Closing…" : "Close month"}
            </span>
          </ErpButton>
        </ErpPanel>

        <ErpPanel>
          <ErpLabel>Archive</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            MONTHLY SNAPSHOTS
          </h2>

          <div className="mt-6 space-y-3">
            {(closesQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No month snapshots yet.
              </p>
            ) : (
              (closesQuery.data ?? []).map((row) => {
                const key = `${row.year}-${String(row.month).padStart(2, "0")}`;
                const snapshot = row.snapshot || {};
                return (
                  <article
                    key={row.id}
                    className="rounded-[22px] border border-border/45 bg-white/[0.015] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[8px] uppercase tracking-[0.26em] text-muted-foreground">
                          {monthLabel(key)}
                        </p>
                        <p className="mt-2 font-display text-xl tracking-[0.1em] text-chrome">
                          {money(snapshot["net_profit"] || 0, site.currencySymbol)}
                        </p>
                        <p className="mt-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                          Net profit · {row.status}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] text-foreground">
                          {money(snapshot["gross_sales"] || 0, site.currencySymbol)} sales
                        </p>
                        <p className="mt-2 text-[8px] text-muted-foreground">
                          {snapshot["delivered_orders"] || 0} delivered ·{" "}
                          {snapshot["units_sold"] || 0} units
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/35 pt-4 sm:grid-cols-4">
                      <div>
                        <ErpLabel>COGS</ErpLabel>
                        <p className="mt-2 text-[9px] text-foreground">
                          {money(snapshot["cogs"] || 0, site.currencySymbol)}
                        </p>
                      </div>
                      <div>
                        <ErpLabel>Expense</ErpLabel>
                        <p className="mt-2 text-[9px] text-foreground">
                          {money(snapshot["operating_expenses"] || 0, site.currencySymbol)}
                        </p>
                      </div>
                      <div>
                        <ErpLabel>COD pending</ErpLabel>
                        <p className="mt-2 text-[9px] text-foreground">
                          {money(snapshot["cod_pending"] || 0, site.currencySymbol)}
                        </p>
                      </div>
                      <div>
                        <ErpLabel>Stock value</ErpLabel>
                        <p className="mt-2 text-[9px] text-foreground">
                          {money(snapshot["stock_value"] || 0, site.currencySymbol)}
                        </p>
                      </div>
                    </div>

                    {row.status === "closed" && (
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm(
                            `Reopen ${monthLabel(key)}? Its current snapshot remains visible until you close it again.`,
                          );
                          if (ok) reopenMonth.mutate(row);
                        }}
                        disabled={reopenMonth.isPending}
                        className="mt-4 inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.24em] text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="size-3.5" />
                        Reopen
                      </button>
                    )}
                  </article>
                );
              })
            )}
          </div>
        </ErpPanel>
      </div>
    </div>
  );
}
