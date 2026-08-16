import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Boxes,
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  TriangleAlert,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import {
  fetchErpMetrics,
  money,
  monthKey,
  monthLabel,
  monthParts,
  monthRange,
} from "@/lib/erp";
import {
  ErpLabel,
  ErpMetric,
  ErpPanel,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/")({
  component: ErpOverview,
});

type RecentOrder = {
  id: string;
  order_number: string;
  product_name: string;
  total_price: number | string;
  status: string;
  payment_method: string;
  created_at: string;
};

function ErpOverview() {
  const site = useSite();
  const [month, setMonth] = useState(monthKey());
  const { start, end } = monthRange(month);

  useEffect(() => {
    (supabase as any)
      .rpc("erp_auto_close_previous_month")
      .then(() => undefined)
      .catch(() => undefined);
  }, []);

  const metricsQuery = useQuery({
    queryKey: ["erp-metrics", month],
    queryFn: () => fetchErpMetrics(month),
  });

  const recentOrdersQuery = useQuery({
    queryKey: ["erp-recent-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          "id,order_number,product_name,total_price,status,payment_method,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return (data ?? []) as RecentOrder[];
    },
  });

  const deliveredQuery = useQuery({
    queryKey: ["erp-top-products", month],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("product_name,product_code,quantity,total_price,delivered_at,updated_at")
        .eq("status", "delivered")
        .gte("delivered_at", start)
        .lt("delivered_at", end);
      if (error) throw error;
      return data ?? [];
    },
  });

  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; code: string; quantity: number; revenue: number }
    >();

    for (const order of deliveredQuery.data ?? []) {
      const key = String(order.product_code || order.product_name);
      const current = map.get(key) ?? {
        name: String(order.product_name || "Object"),
        code: String(order.product_code || ""),
        quantity: 0,
        revenue: 0,
      };
      current.quantity += Number(order.quantity || 0);
      current.revenue += Number(order.total_price || 0);
      map.set(key, current);
    }

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [deliveredQuery.data]);

  const metrics = metricsQuery.data;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <ErpLabel>ZZERKOFF / BUSINESS OVERVIEW</ErpLabel>
          <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground sm:text-3xl">
            STUDIO ERP
          </h1>
          <p className="mt-3 max-w-2xl font-editorial text-lg leading-relaxed text-muted-foreground">
            Quiet control over sales, stock, cost and month-end profit.
          </p>
        </div>

        <label className="min-w-[170px]">
          <ErpLabel className="mb-2">Reporting month</ErpLabel>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-2xl border border-border/60 bg-black/35 px-4 py-3 text-xs tracking-[0.08em] text-foreground outline-none focus:border-chrome/60"
          />
        </label>
      </div>

      <ErpPanel className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.06),transparent_30%)]" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <ErpLabel>{monthLabel(month)}</ErpLabel>
            <p className="mt-3 font-display text-3xl tracking-[0.1em] text-chrome sm:text-5xl">
              {money(metrics?.net_profit ?? 0, site.currencySymbol)}
            </p>
            <p className="mt-3 text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
              Net profit / live month
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-right">
            <div>
              <ErpLabel>Sales</ErpLabel>
              <p className="mt-2 text-sm tracking-[0.12em] text-foreground">
                {money(metrics?.gross_sales ?? 0, site.currencySymbol)}
              </p>
            </div>
            <div>
              <ErpLabel>Gross profit</ErpLabel>
              <p className="mt-2 text-sm tracking-[0.12em] text-foreground">
                {money(metrics?.gross_profit ?? 0, site.currencySymbol)}
              </p>
            </div>
          </div>
        </div>
      </ErpPanel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <ErpMetric
          label="Delivered"
          value={metrics?.delivered_orders ?? 0}
          note={`${metrics?.units_sold ?? 0} units`}
        />
        <ErpMetric
          label="Product cost"
          value={money(metrics?.cogs ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Expenses"
          value={money(metrics?.operating_expenses ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Courier"
          value={money(metrics?.courier_cost ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="COD pending"
          value={money(metrics?.cod_pending ?? 0, site.currencySymbol)}
        />
        <ErpMetric
          label="Stock value"
          value={money(metrics?.stock_value ?? 0, site.currencySymbol)}
          note={`${metrics?.low_stock_count ?? 0} low stock`}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <ErpPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <ErpLabel>Profit structure</ErpLabel>
              <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
                MONTH FLOW
              </h2>
            </div>
            <CircleDollarSign className="size-5 text-muted-foreground" />
          </div>

          <div className="mt-6 space-y-4">
            {[
              ["Delivered sales", metrics?.gross_sales ?? 0, false],
              ["Product cost / COGS", -(metrics?.cogs ?? 0), false],
              ["Courier", -(metrics?.courier_cost ?? 0), false],
              ["Packaging", -(metrics?.packaging_cost ?? 0), false],
              ["Payment fees", -(metrics?.payment_fees ?? 0), false],
              ["Other order cost", -(metrics?.order_other_cost ?? 0), false],
              ["Operating expenses", -(metrics?.operating_expenses ?? 0), false],
              ["Net profit", metrics?.net_profit ?? 0, true],
            ].map(([label, value, total]) => (
              <div
                key={String(label)}
                className={`flex items-center justify-between gap-4 border-b pb-3 ${
                  total ? "border-chrome/40" : "border-border/35"
                }`}
              >
                <span className="text-[9px] uppercase tracking-[0.23em] text-muted-foreground">
                  {label}
                </span>
                <span
                  className={`text-xs tracking-[0.1em] ${
                    total ? "text-chrome" : "text-foreground"
                  }`}
                >
                  {Number(value) < 0 ? "−" : ""}
                  {money(Math.abs(Number(value)), site.currencySymbol)}
                </span>
              </div>
            ))}
          </div>
        </ErpPanel>

        <ErpPanel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <ErpLabel>Top objects</ErpLabel>
              <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
                MOVING NOW
              </h2>
            </div>
            <PackageCheck className="size-5 text-muted-foreground" />
          </div>

          <div className="mt-6 space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                No delivered objects in {monthLabel(month)} yet.
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.code || product.name}
                  className="flex items-center gap-4 rounded-2xl border border-border/40 px-4 py-3"
                >
                  <span className="font-display text-sm text-muted-foreground">
                    0{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs tracking-[0.08em] text-foreground">
                      {product.name}
                    </p>
                    <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
                      {product.code} · {product.quantity} units
                    </p>
                  </div>
                  <span className="text-[9px] tracking-[0.08em] text-chrome">
                    {money(product.revenue, site.currencySymbol)}
                  </span>
                </div>
              ))
            )}
          </div>
        </ErpPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Link to="/erp/purchases" className="group">
          <ErpPanel className="h-full transition-colors group-hover:border-chrome/40">
            <PackageCheck className="size-5 text-muted-foreground" />
            <ErpLabel className="mt-5">Stock in</ErpLabel>
            <h3 className="mt-3 font-display text-sm tracking-[0.15em] text-foreground">
              PURCHASES
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Receive stock and update weighted average cost automatically.
            </p>
            <ArrowRight className="mt-5 size-4 text-chrome" />
          </ErpPanel>
        </Link>

        <Link to="/erp/expenses" className="group">
          <ErpPanel className="h-full transition-colors group-hover:border-chrome/40">
            <ReceiptText className="size-5 text-muted-foreground" />
            <ErpLabel className="mt-5">Money out</ErpLabel>
            <h3 className="mt-3 font-display text-sm tracking-[0.15em] text-foreground">
              EXPENSES
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Track ads, software, staff, transport and recurring costs.
            </p>
            <ArrowRight className="mt-5 size-4 text-chrome" />
          </ErpPanel>
        </Link>

        <Link to="/erp/inventory" className="group">
          <ErpPanel className="h-full transition-colors group-hover:border-chrome/40">
            {Number(metrics?.low_stock_count ?? 0) > 0 ? (
              <TriangleAlert className="size-5 text-muted-foreground" />
            ) : (
              <Boxes className="size-5 text-muted-foreground" />
            )}
            <ErpLabel className="mt-5">Live stock</ErpLabel>
            <h3 className="mt-3 font-display text-sm tracking-[0.15em] text-foreground">
              INVENTORY
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {metrics?.low_stock_count ?? 0} low-stock objects ·{" "}
              {money(metrics?.stock_value ?? 0, site.currencySymbol)} value.
            </p>
            <ArrowRight className="mt-5 size-4 text-chrome" />
          </ErpPanel>
        </Link>
      </div>

      <ErpPanel>
        <div className="flex items-center justify-between gap-4">
          <div>
            <ErpLabel>Recent activity</ErpLabel>
            <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
              LATEST ORDERS
            </h2>
          </div>
          <Link
            to="/admin/orders"
            className="text-[8px] uppercase tracking-[0.28em] text-chrome"
          >
            Open Admin
          </Link>
        </div>

        <div className="mt-5 divide-y divide-border/35">
          {(recentOrdersQuery.data ?? []).map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                  {order.order_number}
                </p>
                <p className="mt-1 truncate text-xs tracking-[0.06em] text-foreground">
                  {order.product_name}
                </p>
              </div>
              <span className="rounded-xl border border-border/45 px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                {order.status}
              </span>
              <span className="text-[10px] tracking-[0.08em] text-chrome">
                {money(order.total_price, site.currencySymbol)}
              </span>
            </div>
          ))}
        </div>
      </ErpPanel>
    </div>
  );
}
