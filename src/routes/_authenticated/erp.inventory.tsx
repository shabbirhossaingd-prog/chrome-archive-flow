import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import { money, prettyKey } from "@/lib/erp";
import {
  ErpButton,
  ErpLabel,
  ErpMetric,
  ErpPanel,
  erpField,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/inventory")({
  component: ErpInventory,
});

type Product = {
  id: string;
  name: string;
  product_code: string;
  price: number | string;
  quantity_available: number;
  stock_status: string;
  erp_average_cost: number | string;
  erp_low_stock_threshold: number;
  archived: boolean;
};

type Movement = {
  id: string;
  product_name: string;
  product_code: string;
  movement_type: string;
  quantity_delta: number;
  stock_before: number;
  stock_after: number;
  average_cost_before: number | string;
  average_cost_after: number | string;
  note: string;
  created_at: string;
};

function ErpInventory() {
  const site = useSite();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("0");
  const [averageCost, setAverageCost] = useState("0");
  const [threshold, setThreshold] = useState("3");
  const [note, setNote] = useState("");

  const productsQuery = useQuery({
    queryKey: ["erp-inventory-products"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(
          "id,name,product_code,price,quantity_available,stock_status,erp_average_cost,erp_low_stock_threshold,archived",
        )
        .eq("archived", false)
        .order("product_code");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const movementsQuery = useQuery({
    queryKey: ["erp-stock-movements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("erp_stock_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data ?? []) as Movement[];
    },
  });

  const stats = useMemo(() => {
    const products = productsQuery.data ?? [];
    return {
      units: products.reduce(
        (sum, product) => sum + Number(product.quantity_available || 0),
        0,
      ),
      value: products.reduce(
        (sum, product) =>
          sum +
          Number(product.quantity_available || 0) *
            Number(product.erp_average_cost || 0),
        0,
      ),
      low: products.filter(
        (product) =>
          Number(product.quantity_available || 0) <=
          Number(product.erp_low_stock_threshold || 0),
      ).length,
      zeroCost: products.filter(
        (product) =>
          Number(product.quantity_available || 0) > 0 &&
          Number(product.erp_average_cost || 0) <= 0,
      ).length,
    };
  }, [productsQuery.data]);

  const openAdjust = (product: Product) => {
    setEditing(product);
    setQuantity(String(product.quantity_available));
    setAverageCost(String(product.erp_average_cost || 0));
    setThreshold(String(product.erp_low_stock_threshold || 0));
    setNote("");
  };

  const adjust = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      const { error } = await (supabase as any).rpc("erp_adjust_inventory", {
        p_product_id: editing.id,
        p_new_quantity: Number(quantity),
        p_new_average_cost: Number(averageCost),
        p_low_stock_threshold: Number(threshold),
        p_note: note || "ERP inventory adjustment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Inventory updated.");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["erp-inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["erp-stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["erp-products-purchase"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not adjust stock."),
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <ErpLabel>ERP / INVENTORY</ErpLabel>
        <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
          INVENTORY
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Live stock, weighted cost, margin and low-stock watch in one quiet ledger.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ErpMetric label="Stock units" value={stats.units} />
        <ErpMetric
          label="Inventory value"
          value={money(stats.value, site.currencySymbol)}
          emphasis
        />
        <ErpMetric label="Low stock" value={stats.low} />
        <ErpMetric
          label="Needs cost setup"
          value={stats.zeroCost}
          note="Stock > 0 but average cost = 0"
        />
      </div>

      {editing && (
        <ErpPanel className="border-chrome/40">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <ErpLabel>Manual adjustment</ErpLabel>
              <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
                {editing.product_code} / {editing.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <ErpLabel className="mb-2">Stock quantity</ErpLabel>
              <input
                type="number"
                min="0"
                className={erpField}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <label>
              <ErpLabel className="mb-2">Average cost</ErpLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                className={erpField}
                value={averageCost}
                onChange={(e) => setAverageCost(e.target.value)}
              />
            </label>
            <label>
              <ErpLabel className="mb-2">Low stock alert</ErpLabel>
              <input
                type="number"
                min="0"
                className={erpField}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </label>
            <label>
              <ErpLabel className="mb-2">Reason / note</ErpLabel>
              <input
                className={erpField}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opening balance, count correction…"
              />
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <ErpButton
              tone="primary"
              onClick={() => adjust.mutate()}
              disabled={adjust.isPending}
            >
              {adjust.isPending ? "Saving…" : "Apply adjustment"}
            </ErpButton>
            <ErpButton onClick={() => setEditing(null)}>Cancel</ErpButton>
          </div>
        </ErpPanel>
      )}

      <ErpPanel>
        <div className="flex items-end justify-between gap-4">
          <div>
            <ErpLabel>Objects</ErpLabel>
            <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
              STOCK LEDGER
            </h2>
          </div>
          <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
            {(productsQuery.data ?? []).length} objects
          </span>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-2">
          {(productsQuery.data ?? []).map((product) => {
            const cost = Number(product.erp_average_cost || 0);
            const price = Number(product.price || 0);
            const qty = Number(product.quantity_available || 0);
            const low = qty <= Number(product.erp_low_stock_threshold || 0);
            const margin = price > 0 ? ((price - cost) / price) * 100 : 0;

            return (
              <article
                key={product.id}
                className="rounded-[22px] border border-border/45 bg-white/[0.015] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
                      {product.product_code}
                    </p>
                    <h3 className="mt-2 truncate text-xs tracking-[0.08em] text-foreground">
                      {product.name}
                    </h3>
                  </div>

                  <span
                    className={`rounded-xl border px-3 py-2 text-[8px] uppercase tracking-[0.2em] ${
                      low
                        ? "border-chrome/45 text-chrome"
                        : "border-border/45 text-muted-foreground"
                    }`}
                  >
                    {qty} in stock
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <ErpLabel>Sell</ErpLabel>
                    <p className="mt-2 text-[10px] text-foreground">
                      {money(price, site.currencySymbol)}
                    </p>
                  </div>
                  <div>
                    <ErpLabel>Avg cost</ErpLabel>
                    <p className="mt-2 text-[10px] text-foreground">
                      {money(cost, site.currencySymbol)}
                    </p>
                  </div>
                  <div>
                    <ErpLabel>Stock value</ErpLabel>
                    <p className="mt-2 text-[10px] text-foreground">
                      {money(qty * cost, site.currencySymbol)}
                    </p>
                  </div>
                  <div>
                    <ErpLabel>Gross margin</ErpLabel>
                    <p className="mt-2 text-[10px] text-foreground">
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/35 pt-4">
                  <span className="text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                    Alert at ≤ {product.erp_low_stock_threshold}
                  </span>
                  <button
                    type="button"
                    onClick={() => openAdjust(product)}
                    className="inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.25em] text-chrome"
                  >
                    <SlidersHorizontal className="size-3.5" />
                    Adjust
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </ErpPanel>

      <ErpPanel>
        <ErpLabel>Audit trail</ErpLabel>
        <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
          STOCK MOVEMENTS
        </h2>

        <div className="mt-5 space-y-2">
          {(movementsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Stock movement history will appear here after ERP installation.
            </p>
          ) : (
            (movementsQuery.data ?? []).map((movement) => (
              <div
                key={movement.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/35 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                    {movement.product_code} · {prettyKey(movement.movement_type)}
                  </p>
                  <p className="mt-1 truncate text-[10px] tracking-[0.06em] text-foreground">
                    {movement.product_name}
                    {movement.note ? ` — ${movement.note}` : ""}
                  </p>
                </div>

                <span
                  className={`text-[10px] tracking-[0.08em] ${
                    movement.quantity_delta > 0
                      ? "text-chrome"
                      : "text-muted-foreground"
                  }`}
                >
                  {movement.quantity_delta > 0 ? "+" : ""}
                  {movement.quantity_delta}
                </span>

                <span className="text-[9px] text-muted-foreground">
                  {movement.stock_before} → {movement.stock_after}
                </span>

                <span className="text-[8px] text-muted-foreground">
                  {new Date(movement.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            ))
          )}
        </div>
      </ErpPanel>
    </div>
  );
}
