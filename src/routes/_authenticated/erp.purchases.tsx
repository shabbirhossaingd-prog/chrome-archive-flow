import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import { SmartImage } from "@/components/site/SmartImage";
import { money } from "@/lib/erp";
import {
  ErpButton,
  ErpLabel,
  ErpPanel,
  erpField,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/purchases")({
  component: ErpPurchases,
});

type Product = {
  id: string;
  primary_image: string;
  name: string;
  product_code: string;
  quantity_available: number;
  erp_average_cost: number | string;
};

type Purchase = {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_name: string;
  supplier_phone: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_cost: number | string;
  transport_cost: number | string;
  packaging_cost: number | string;
  other_cost: number | string;
  total_cost: number | string;
  stock_before: number;
  stock_after: number;
  average_cost_before: number | string;
  average_cost_after: number | string;
  status: string;
  notes: string;
  received_at: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function ErpPurchases() {
  const site = useSite();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const [transportCost, setTransportCost] = useState("0");
  const [packagingCost, setPackagingCost] = useState("0");
  const [otherCost, setOtherCost] = useState("0");
  const [notes, setNotes] = useState("");

  const productsQuery = useQuery({
    queryKey: ["erp-products-purchase"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select("id,primary_image,name,product_code,quantity_available,erp_average_cost")
        .eq("archived", false)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const purchasesQuery = useQuery({
    queryKey: ["erp-purchases"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("erp_purchases")
        .select("*")
        .order("purchase_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as Purchase[];
    },
  });

  const total = useMemo(
    () =>
      Number(unitCost || 0) * Number(quantity || 0) +
      Number(transportCost || 0) +
      Number(packagingCost || 0) +
      Number(otherCost || 0),
    [unitCost, quantity, transportCost, packagingCost, otherCost],
  );

  const selectedProduct = (productsQuery.data ?? []).find(
    (product) => product.id === productId,
  );

  const createPurchase = useMutation({
    mutationFn: async () => {
      if (!productId) throw new Error("Select a product.");
      if (Number(quantity) <= 0) throw new Error("Quantity must be greater than zero.");
      if (unitCost === "" || Number(unitCost) < 0) {
        throw new Error("Enter a valid unit buying cost.");
      }

      const { data, error } = await (supabase as any).rpc("create_erp_purchase", {
        p_product_id: productId,
        p_purchase_date: purchaseDate,
        p_supplier_name: supplierName,
        p_supplier_phone: supplierPhone,
        p_quantity: Number(quantity),
        p_unit_cost: Number(unitCost),
        p_transport_cost: Number(transportCost || 0),
        p_packaging_cost: Number(packagingCost || 0),
        p_other_cost: Number(otherCost || 0),
        p_notes: notes,
      });

      if (error) throw error;
      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: (result) => {
      toast.success(
        `${result?.purchase_number || "Purchase"} received. Stock and average cost updated.`,
      );
      setQuantity("1");
      setUnitCost("");
      setTransportCost("0");
      setPackagingCost("0");
      setOtherCost("0");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["erp-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["erp-products-purchase"] });
      queryClient.invalidateQueries({ queryKey: ["erp-inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not receive purchase."),
  });

  const reversePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("reverse_erp_purchase", {
        p_purchase_id: id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Purchase reversed and latest stock/cost restored.");
      queryClient.invalidateQueries({ queryKey: ["erp-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["erp-products-purchase"] });
      queryClient.invalidateQueries({ queryKey: ["erp-inventory-products"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not reverse purchase."),
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <ErpLabel>ERP / STOCK IN</ErpLabel>
        <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
          PURCHASES
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Receive inventory with landed cost. ZZERKOFF recalculates weighted average cost automatically.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <ErpPanel>
          <ErpLabel>New stock receipt</ErpLabel>
          <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
            RECEIVE PURCHASE
          </h2>

          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createPurchase.mutate();
            }}
          >
            <label className="block">
              <ErpLabel className="mb-2">Object</ErpLabel>
              <select
                className={erpField}
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
              >
                <option value="">Select product</option>
                {(productsQuery.data ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_code} — {product.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedProduct && (
              <div className="flex items-center gap-4 rounded-2xl border border-border/45 bg-white/[0.02] p-4">
                <SmartImage
                  src={selectedProduct.primary_image}
                  alt={selectedProduct.name}
                  width={120}
                  height={120}
                  className="size-16 shrink-0 rounded-2xl object-cover grayscale"
                />
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
                  <div>
                    <ErpLabel>Current stock</ErpLabel>
                    <p className="mt-2 text-sm text-foreground">
                      {selectedProduct.quantity_available}
                    </p>
                  </div>
                  <div>
                    <ErpLabel>Current avg cost</ErpLabel>
                    <p className="mt-2 text-sm text-foreground">
                      {money(selectedProduct.erp_average_cost, site.currencySymbol)}
                    </p>
                  </div>
                  <p className="col-span-2 truncate text-[9px] tracking-[0.06em] text-muted-foreground">
                    {selectedProduct.product_code} · {selectedProduct.name}
                  </p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <ErpLabel className="mb-2">Purchase date</ErpLabel>
                <input
                  type="date"
                  className={erpField}
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </label>
              <label>
                <ErpLabel className="mb-2">Quantity</ErpLabel>
                <input
                  type="number"
                  min="1"
                  className={erpField}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <ErpLabel className="mb-2">Supplier name</ErpLabel>
                <input
                  className={erpField}
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Optional"
                />
              </label>
              <label>
                <ErpLabel className="mb-2">Supplier phone</ErpLabel>
                <input
                  className={erpField}
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  placeholder="Optional"
                />
              </label>
            </div>

            <label className="block">
              <ErpLabel className="mb-2">Unit buying cost</ErpLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                className={erpField}
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <label>
                <ErpLabel className="mb-2">Transport</ErpLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={erpField}
                  value={transportCost}
                  onChange={(e) => setTransportCost(e.target.value)}
                />
              </label>
              <label>
                <ErpLabel className="mb-2">Packaging</ErpLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={erpField}
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(e.target.value)}
                />
              </label>
              <label>
                <ErpLabel className="mb-2">Other</ErpLabel>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={erpField}
                  value={otherCost}
                  onChange={(e) => setOtherCost(e.target.value)}
                />
              </label>
            </div>

            <label className="block">
              <ErpLabel className="mb-2">Note</ErpLabel>
              <textarea
                className={erpField}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Batch, supplier note, import note…"
              />
            </label>

            <div className="rounded-2xl border border-chrome/35 bg-white/[0.025] p-4">
              <ErpLabel>Total landed purchase cost</ErpLabel>
              <p className="mt-2 font-display text-xl tracking-[0.1em] text-chrome">
                {money(total, site.currencySymbol)}
              </p>
            </div>

            <ErpButton
              type="submit"
              tone="primary"
              disabled={createPurchase.isPending}
              className="w-full"
            >
              {createPurchase.isPending ? "Receiving…" : "Receive & update stock"}
            </ErpButton>
          </form>
        </ErpPanel>

        <ErpPanel>
          <div className="flex items-end justify-between gap-4">
            <div>
              <ErpLabel>Purchase ledger</ErpLabel>
              <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
                RECENT RECEIPTS
              </h2>
            </div>
            <span className="text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
              {(purchasesQuery.data ?? []).length} entries
            </span>
          </div>

          <div className="mt-6 space-y-3">
            {(purchasesQuery.data ?? []).length === 0 ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                No purchase receipts yet.
              </p>
            ) : (
              (purchasesQuery.data ?? []).map((purchase) => (
                <article
                  key={purchase.id}
                  className="rounded-[22px] border border-border/45 bg-white/[0.015] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
                        {purchase.purchase_number} · {purchase.purchase_date}
                      </p>
                      <h3 className="mt-2 text-xs tracking-[0.08em] text-foreground">
                        {purchase.product_name}
                      </h3>
                      <p className="mt-1 text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                        {purchase.product_code} · QTY {purchase.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-xl border border-border/50 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                        {purchase.status}
                      </span>
                      <p className="mt-3 text-xs tracking-[0.08em] text-chrome">
                        {money(purchase.total_cost, site.currencySymbol)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border/35 pt-4 sm:grid-cols-4">
                    <div>
                      <ErpLabel>Unit cost</ErpLabel>
                      <p className="mt-2 text-[10px] text-foreground">
                        {money(purchase.unit_cost, site.currencySymbol)}
                      </p>
                    </div>
                    <div>
                      <ErpLabel>Stock</ErpLabel>
                      <p className="mt-2 text-[10px] text-foreground">
                        {purchase.stock_before} → {purchase.stock_after}
                      </p>
                    </div>
                    <div>
                      <ErpLabel>Avg before</ErpLabel>
                      <p className="mt-2 text-[10px] text-foreground">
                        {money(purchase.average_cost_before, site.currencySymbol)}
                      </p>
                    </div>
                    <div>
                      <ErpLabel>Avg after</ErpLabel>
                      <p className="mt-2 text-[10px] text-foreground">
                        {money(purchase.average_cost_after, site.currencySymbol)}
                      </p>
                    </div>
                  </div>

                  {(purchase.supplier_name || purchase.notes) && (
                    <p className="mt-4 text-[9px] leading-relaxed text-muted-foreground">
                      {purchase.supplier_name
                        ? `Supplier: ${purchase.supplier_name}${purchase.supplier_phone ? ` · ${purchase.supplier_phone}` : ""}`
                        : ""}
                      {purchase.supplier_name && purchase.notes ? " — " : ""}
                      {purchase.notes}
                    </p>
                  )}

                  {purchase.status === "received" && (
                    <div className="mt-4 border-t border-border/35 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          const ok = window.confirm(
                            `Reverse ${purchase.purchase_number}? This works only if no stock/cost movement happened after this purchase.`,
                          );
                          if (ok) reversePurchase.mutate(purchase.id);
                        }}
                        disabled={reversePurchase.isPending}
                        className="inline-flex items-center gap-2 text-[8px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                      >
                        <RotateCcw className="size-3.5" />
                        Safe reverse
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </ErpPanel>
      </div>
    </div>
  );
}
