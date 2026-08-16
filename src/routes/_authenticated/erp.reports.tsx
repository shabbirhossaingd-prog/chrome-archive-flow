import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import {
  fetchErpMetrics,
  money,
  monthKey,
  monthLabel,
  monthParts,
  monthRange,
  prettyKey,
} from "@/lib/erp";
import {
  ErpButton,
  ErpLabel,
  ErpMetric,
  ErpPanel,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/reports")({
  component: ErpReports,
});

type Expense = {
  expense_date: string;
  title: string;
  category: string;
  amount: number | string;
  recurring_monthly: boolean;
  recurring_until: string | null;
};

type DeliveredOrder = {
  order_number: string;
  product_name: string;
  product_code: string;
  quantity: number;
  total_price: number | string;
  payment_method: string;
  payment_status: string;
  delivered_at: string | null;
  updated_at: string;
};

function ErpReports() {
  const site = useSite();
  const [month, setMonth] = useState(monthKey());
  const { start, end } = monthRange(month);

  const metricsQuery = useQuery({
    queryKey: ["erp-report-metrics", month],
    queryFn: () => fetchErpMetrics(month),
  });

  const expensesQuery = useQuery({
    queryKey: ["erp-report-expenses"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("erp_expenses")
        .select(
          "expense_date,title,category,amount,recurring_monthly,recurring_until",
        )
        .order("expense_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const deliveredQuery = useQuery({
    queryKey: ["erp-report-orders", month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          "order_number,product_name,product_code,quantity,total_price,payment_method,payment_status,delivered_at,updated_at",
        )
        .eq("status", "delivered")
        .gte("delivered_at", start)
        .lt("delivered_at", end);
      if (error) throw error;
      return (data ?? []) as DeliveredOrder[];
    },
  });

  const selectedExpenses = useMemo(() => {
    const { year, month: monthNumber } = monthParts(month);
    const monthStart = new Date(year, monthNumber - 1, 1);
    const monthEnd = new Date(year, monthNumber, 1);

    return (expensesQuery.data ?? []).filter((expense) => {
      const startDate = new Date(`${expense.expense_date}T00:00:00`);
      if (!expense.recurring_monthly) {
        return startDate >= monthStart && startDate < monthEnd;
      }

      const recurringEnd = expense.recurring_until
        ? new Date(`${expense.recurring_until}T00:00:00`)
        : null;

      return (
        startDate < monthEnd &&
        (!recurringEnd || recurringEnd >= monthStart)
      );
    });
  }, [expensesQuery.data, month]);

  const expenseBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const expense of selectedExpenses) {
      map.set(
        expense.category,
        (map.get(expense.category) ?? 0) + Number(expense.amount || 0),
      );
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [selectedExpenses]);

  const productBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { name: string; code: string; units: number; revenue: number }
    >();
    for (const order of deliveredQuery.data ?? []) {
      const key = order.product_code || order.product_name;
      const row = map.get(key) ?? {
        name: order.product_name,
        code: order.product_code,
        units: 0,
        revenue: 0,
      };
      row.units += Number(order.quantity || 0);
      row.revenue += Number(order.total_price || 0);
      map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [deliveredQuery.data]);

  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of deliveredQuery.data ?? []) {
      const key = order.payment_method || "unknown";
      map.set(key, (map.get(key) ?? 0) + Number(order.total_price || 0));
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [deliveredQuery.data]);

  const metrics = metricsQuery.data;

  const exportCsv = () => {
    if (!metrics) return;

    const rows = [
      ["ZZERKOFF ERP REPORT", monthLabel(month)],
      [],
      ["Metric", "Amount / Value"],
      ["Delivered Orders", metrics.delivered_orders],
      ["Units Sold", metrics.units_sold],
      ["Gross Sales", metrics.gross_sales],
      ["COGS", metrics.cogs],
      ["Gross Profit", metrics.gross_profit],
      ["Courier Cost", metrics.courier_cost],
      ["Packaging Cost", metrics.packaging_cost],
      ["Payment Fees", metrics.payment_fees],
      ["Other Order Cost", metrics.order_other_cost],
      ["Operating Expenses", metrics.operating_expenses],
      ["Net Profit", metrics.net_profit],
      ["Purchases", metrics.purchase_total],
      ["Cash Received", metrics.cash_received],
      ["COD Pending", metrics.cod_pending],
      ["Stock Value", metrics.stock_value],
      [],
      ["EXPENSE BREAKDOWN"],
      ...expenseBreakdown.map(([category, amount]) => [
        prettyKey(category),
        amount,
      ]),
      [],
      ["PRODUCT BREAKDOWN"],
      ["Product", "Code", "Units", "Revenue"],
      ...productBreakdown.map((item) => [
        item.name,
        item.code,
        item.units,
        item.revenue,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zzerkoff-erp-${month}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8 print:bg-white print:text-black">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ErpLabel>ERP / REPORTING</ErpLabel>
          <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
            REPORTS
          </h1>
          <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            Month-level profit, cost, cash, inventory and product performance.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2 print:hidden">
          <label>
            <ErpLabel className="mb-2">Month</ErpLabel>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-2xl border border-border/60 bg-black/35 px-4 py-3 text-xs text-foreground outline-none"
            />
          </label>
          <ErpButton onClick={exportCsv}>
            <span className="inline-flex items-center gap-2">
              <Download className="size-3.5" />
              CSV
            </span>
          </ErpButton>
          <ErpButton onClick={() => window.print()}>
            <span className="inline-flex items-center gap-2">
              <Printer className="size-3.5" />
              Print / PDF
            </span>
          </ErpButton>
        </div>
      </div>

      <ErpPanel className="border-chrome/35">
        <ErpLabel>{monthLabel(month)}</ErpLabel>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="font-display text-4xl tracking-[0.1em] text-chrome">
              {money(metrics?.net_profit ?? 0, site.currencySymbol)}
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Net profit
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-[0.1em] text-foreground">
              {metrics?.delivered_orders ?? 0} delivered orders
            </p>
            <p className="mt-2 text-[9px] uppercase tracking-[0.24em] text-muted-foreground">
              {metrics?.units_sold ?? 0} units sold
            </p>
          </div>
        </div>
      </ErpPanel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ErpMetric
          label="Sales"
          value={money(metrics?.gross_sales ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Gross profit"
          value={money(metrics?.gross_profit ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Operating expense"
          value={money(metrics?.operating_expenses ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Stock value"
          value={money(metrics?.stock_value ?? 0, site.currencySymbol)}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ErpPanel>
          <ErpLabel>P&L</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            PROFIT & LOSS
          </h2>

          <div className="mt-6 space-y-3">
            {[
              ["Delivered sales", metrics?.gross_sales ?? 0, "plus"],
              ["Product cost / COGS", metrics?.cogs ?? 0, "minus"],
              ["Gross profit", metrics?.gross_profit ?? 0, "total"],
              ["Courier", metrics?.courier_cost ?? 0, "minus"],
              ["Packaging", metrics?.packaging_cost ?? 0, "minus"],
              ["Payment fees", metrics?.payment_fees ?? 0, "minus"],
              ["Other order costs", metrics?.order_other_cost ?? 0, "minus"],
              ["Operating expenses", metrics?.operating_expenses ?? 0, "minus"],
              ["Net profit", metrics?.net_profit ?? 0, "grand"],
            ].map(([label, value, type]) => (
              <div
                key={String(label)}
                className={`flex items-center justify-between gap-4 border-b py-2 ${
                  type === "grand"
                    ? "border-chrome/45"
                    : "border-border/35"
                }`}
              >
                <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  {label}
                </span>
                <span
                  className={`text-xs tracking-[0.08em] ${
                    type === "grand" ? "text-chrome" : "text-foreground"
                  }`}
                >
                  {type === "minus" ? "−" : ""}
                  {money(Number(value), site.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </ErpPanel>

        <ErpPanel>
          <ErpLabel>Cash & stock</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            POSITION
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <ErpMetric
              label="Cash received"
              value={money(metrics?.cash_received ?? 0, site.currencySymbol)}
            />
            <ErpMetric
              label="COD pending"
              value={money(metrics?.cod_pending ?? 0, site.currencySymbol)}
            />
            <ErpMetric
              label="Purchases"
              value={money(metrics?.purchase_total ?? 0, site.currencySymbol)}
            />
            <ErpMetric
              label="Low stock"
              value={metrics?.low_stock_count ?? 0}
            />
          </div>
        </ErpPanel>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <ErpPanel>
          <ErpLabel>Expense breakdown</ErpLabel>
          <div className="mt-5 space-y-3">
            {expenseBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">No expenses.</p>
            ) : (
              expenseBreakdown.map(([category, amount]) => (
                <div
                  key={category}
                  className="flex items-center justify-between gap-4 border-b border-border/35 pb-3"
                >
                  <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {prettyKey(category)}
                  </span>
                  <span className="text-[10px] text-foreground">
                    {money(amount, site.currencySymbol)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ErpPanel>

        <ErpPanel>
          <ErpLabel>Payment mix</ErpLabel>
          <div className="mt-5 space-y-3">
            {paymentBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">No delivered sales.</p>
            ) : (
              paymentBreakdown.map(([method, amount]) => (
                <div
                  key={method}
                  className="flex items-center justify-between gap-4 border-b border-border/35 pb-3"
                >
                  <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                    {prettyKey(method)}
                  </span>
                  <span className="text-[10px] text-foreground">
                    {money(amount, site.currencySymbol)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ErpPanel>

        <ErpPanel>
          <ErpLabel>Top objects</ErpLabel>
          <div className="mt-5 space-y-3">
            {productBreakdown.length === 0 ? (
              <p className="text-xs text-muted-foreground">No delivered sales.</p>
            ) : (
              productBreakdown.slice(0, 8).map((item, index) => (
                <div
                  key={item.code || item.name}
                  className="flex items-center gap-3 border-b border-border/35 pb-3"
                >
                  <span className="font-display text-xs text-muted-foreground">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] text-foreground">
                      {item.name}
                    </p>
                    <p className="mt-1 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                      {item.code} · {item.units} units
                    </p>
                  </div>
                  <span className="text-[9px] text-chrome">
                    {money(item.revenue, site.currencySymbol)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ErpPanel>
      </div>
    </div>
  );
}
