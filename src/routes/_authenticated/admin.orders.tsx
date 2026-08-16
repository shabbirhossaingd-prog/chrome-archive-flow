import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import { toast } from "sonner";
import {
  createSteadfastShipment,
  syncSteadfastShipment,
} from "@/lib/steadfast.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = [
  "new",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type OrderStatus = (typeof STATUSES)[number];

type Order = {
  id: string;
  order_number: string;
  source: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  delivery_address: string;
  map_url: string | null;
  customer_note: string | null;
  product_name: string;
  product_code: string;
  unit_price: number | string;
  quantity: number;
  selected_size: string | null;
  selected_finish: string | null;
  total_price: number | string;
  admin_note: string;
  payment_method: "cod" | "bkash" | "nagad";
  payment_status: "unpaid" | "pending_verification" | "paid" | "rejected" | "refunded";
  transaction_id: string | null;
  confirmed_at: string | null;
  processing_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  steadfast_state: "not_sent" | "creating" | "connected" | "error";
  steadfast_consignment_id: number | null;
  steadfast_tracking_code: string | null;
  steadfast_status: string | null;
  steadfast_connected_at: string | null;
  steadfast_synced_at: string | null;
  steadfast_last_error: string | null;
  created_at: string;
  updated_at: string;
};

function AdminOrders() {
  const site = useSite();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const getAccessToken = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your admin session expired. Please sign in again.");
    }

    return session.access_token;
  };

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await (supabase as any)
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      if (status === "confirmed") {
        const accessToken = await getAccessToken();
        try {
          const courier = await createSteadfastShipment({
            data: { orderId: id, accessToken },
          });
          return { courierCreated: true, courier };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Steadfast connection failed.";
          throw new Error(`Order confirmed. Steadfast: ${message}`);
        }
      }

      return { courierCreated: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      if (result?.courierCreated) {
        toast.success("Order confirmed and sent to Steadfast.");
      }
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.error(error instanceof Error ? error.message : "Could not update order.");
    },
  });

  const updatePayment = useMutation({
    mutationFn: async ({ id, payment_status }: { id: string; payment_status: Order["payment_status"] }) => {
      const { error } = await (supabase as any).from("orders").update({ payment_status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const connectSteadfast = useMutation({
    mutationFn: async (id: string) => {
      const accessToken = await getAccessToken();
      return createSteadfastShipment({
        data: { orderId: id, accessToken },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Steadfast parcel connected.");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.error(error instanceof Error ? error.message : "Steadfast connection failed.");
    },
  });

  const syncSteadfast = useMutation({
    mutationFn: async (id: string) => {
      const accessToken = await getAccessToken();
      return syncSteadfastShipment({
        data: { orderId: id, accessToken },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Steadfast status synced.");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.error(error instanceof Error ? error.message : "Could not sync Steadfast.");
    },
  });

  const orders = ordersQuery.data ?? [];
  const newCount = orders.filter((o) => o.status === "new").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;
  const processingCount = orders.filter((o) => o.status === "processing").length;
  const shippedCount = orders.filter((o) => o.status === "shipped").length;
  const deliveredCount = orders.filter((o) => o.status === "delivered").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (!q) return true;
      return [
        o.order_number,
        o.customer_name,
        o.phone,
        o.product_name,
        o.product_code,
        o.delivery_address,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, filter, search]);

  return (
    <div className="space-y-7 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
            ZZERKOFF / STUDIO
          </span>
          <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground sm:text-2xl">
            ORDERS
          </h1>
          <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            {orders.length} total · {newCount} new
          </p>
        </div>

        <button
          type="button"
          onClick={() => ordersQuery.refetch()}
          className="flex items-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className={`size-3.5 ${ordersQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["NEW", newCount],
          ["CONFIRMED", confirmedCount],
          ["PROCESSING", processingCount],
          ["SHIPPED", shippedCount],
          ["DELIVERED", deliveredCount],
          ["CANCELLED", cancelledCount],
        ].map(([label, value]) => (
          <div key={String(label)} className="glass-panel rounded-[20px] p-4">
            <span className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">{label}</span>
            <p className="mt-2 font-display text-xl tracking-[0.14em] text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="glass-panel rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order / customer / phone..."
            className="min-w-0 flex-1 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-3 text-[10px] tracking-[0.08em] text-foreground outline-none placeholder:text-muted-foreground/60 focus:border-chrome/60"
          />

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {(["all", ...STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`shrink-0 rounded-xl border px-3 py-3 text-[8px] uppercase tracking-[0.25em] transition-colors ${
                  filter === status
                    ? "border-chrome/60 bg-white/[0.06] text-foreground"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ordersQuery.isLoading ? (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading orders…
        </p>
      ) : ordersQuery.error ? (
        <div className="glass-panel rounded-[24px] p-6">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Could not load orders. Make sure the order database SQL has been installed in Lovable Cloud.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel rounded-[24px] p-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
            No orders found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => {
            const selected = [order.selected_size, order.selected_finish]
              .filter(Boolean)
              .join(" / ");
            const timeline = [
              ["PLACED", order.created_at],
              ["CONFIRMED", order.confirmed_at],
              ["PROCESSING", order.processing_at],
              ["SHIPPED", order.shipped_at],
              ["DELIVERED", order.delivered_at],
              ["CANCELLED", order.cancelled_at],
            ].filter(([, time]) => Boolean(time));

            return (
              <article key={order.id} className="glass-panel rounded-[24px] p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/50 pb-5">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                      {new Date(order.created_at).toLocaleString("en-GB", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                    <h2 className="mt-3 font-display text-base tracking-[0.16em] text-foreground">
                      {order.order_number}
                    </h2>
                    <p className="mt-2 text-[8px] uppercase tracking-[0.28em] text-chrome">
                      {order.source || "website"}
                    </p>
                  </div>

                  <div className="flex max-w-xl flex-wrap justify-end gap-2">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateStatus.mutate({ id: order.id, status })}
                        disabled={updateStatus.isPending}
                        className={`rounded-xl border px-3 py-3 text-[8px] uppercase tracking-[0.22em] transition-colors ${
                          order.status === status
                            ? "border-chrome/70 bg-white/[0.07] text-foreground"
                            : "border-border/50 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">
                      Customer
                    </span>
                    <p className="mt-3 text-xs tracking-[0.08em] text-foreground">
                      {order.customer_name}
                    </p>
                    <a
                      href={`tel:${order.phone}`}
                      className="mt-2 block text-xs tracking-[0.08em] text-chrome hover:text-foreground"
                    >
                      {order.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">
                      Object
                    </span>
                    <p className="mt-3 font-display text-sm tracking-[0.12em] text-foreground">
                      {order.product_name}
                    </p>
                    <p className="mt-2 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                      {order.product_code}
                      {selected ? ` · ${selected}` : ""}
                      {` · QTY ${order.quantity}`}
                    </p>
                    <p className="mt-3 text-xs tracking-[0.15em] text-chrome">
                      {site.currencySymbol}
                      {Number(order.total_price).toLocaleString("en-US")}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">
                      Delivery
                    </span>
                    <p className="mt-3 whitespace-pre-line text-xs leading-relaxed tracking-[0.06em] text-muted-foreground">
                      {order.delivery_address}
                    </p>
                    {order.map_url && (
                      <a
                        href={order.map_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-chrome hover:text-foreground"
                      >
                        Open map
                        <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-border/50 pt-5">
                  <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">Payment</span>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-xl border border-border/60 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-foreground">{order.payment_method}</span>
                    <span className="rounded-xl border border-chrome/40 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-chrome">{order.payment_status}</span>
                    {order.transaction_id && <span className="text-[9px] tracking-[0.12em] text-muted-foreground">TrxID: {order.transaction_id}</span>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.payment_status !== "paid" && (
                      <button
                        type="button"
                        onClick={() => updatePayment.mutate({ id: order.id, payment_status: "paid" })}
                        disabled={updatePayment.isPending}
                        className="rounded-xl border border-chrome/60 px-3 py-3 text-[8px] uppercase tracking-[0.22em] text-foreground"
                      >
                        Mark paid
                      </button>
                    )}
                    {order.payment_method !== "cod" && order.payment_status !== "rejected" && (
                      <button
                        type="button"
                        onClick={() => updatePayment.mutate({ id: order.id, payment_status: "rejected" })}
                        disabled={updatePayment.isPending}
                        className="rounded-xl border border-border/60 px-3 py-3 text-[8px] uppercase tracking-[0.22em] text-muted-foreground"
                      >
                        Reject payment
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-5 border-t border-border/50 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">
                        Courier / Steadfast
                      </span>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-xl border px-3 py-2 text-[8px] uppercase tracking-[0.22em] ${
                          order.steadfast_state === "connected"
                            ? "border-chrome/50 text-chrome"
                            : "border-border/50 text-muted-foreground"
                        }`}>
                          {order.steadfast_state || "not_sent"}
                        </span>
                        {order.steadfast_status && (
                          <span className="rounded-xl border border-border/50 px-3 py-2 text-[8px] uppercase tracking-[0.22em] text-foreground">
                            {order.steadfast_status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>

                      {order.steadfast_consignment_id && (
                        <p className="mt-3 text-[9px] tracking-[0.1em] text-muted-foreground">
                          Consignment ID: {order.steadfast_consignment_id}
                        </p>
                      )}
                      {order.steadfast_tracking_code && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-[9px] tracking-[0.1em] text-muted-foreground">
                            Tracking: {order.steadfast_tracking_code}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(order.steadfast_tracking_code || "")}
                            className="text-[8px] uppercase tracking-[0.22em] text-chrome"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                      {order.steadfast_synced_at && (
                        <p className="mt-2 text-[8px] uppercase tracking-[0.18em] text-muted-foreground">
                          Synced {new Date(order.steadfast_synced_at).toLocaleString("en-GB", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      )}
                      {order.steadfast_last_error && (
                        <p className="mt-3 max-w-2xl text-[9px] leading-relaxed text-muted-foreground">
                          {order.steadfast_last_error}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {order.status !== "new" &&
                        order.status !== "cancelled" &&
                        order.status !== "delivered" &&
                        order.steadfast_state !== "connected" && (
                          <button
                            type="button"
                            onClick={() => connectSteadfast.mutate(order.id)}
                            disabled={connectSteadfast.isPending}
                            className="rounded-xl border border-chrome/60 px-3 py-3 text-[8px] uppercase tracking-[0.22em] text-foreground disabled:opacity-50"
                          >
                            {order.steadfast_state === "error" ? "Retry Steadfast" : "Send to Steadfast"}
                          </button>
                        )}

                      {order.steadfast_state === "connected" && (
                        <button
                          type="button"
                          onClick={() => syncSteadfast.mutate(order.id)}
                          disabled={syncSteadfast.isPending}
                          className="rounded-xl border border-chrome/60 px-3 py-3 text-[8px] uppercase tracking-[0.22em] text-foreground disabled:opacity-50"
                        >
                          Sync Steadfast
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {timeline.length > 0 && (
                  <div className="mt-5 border-t border-border/50 pt-5">
                    <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">Order timeline</span>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {timeline.map(([label, time]) => (
                        <div key={String(label)} className="rounded-xl border border-border/40 px-3 py-3">
                          <span className="block text-[8px] uppercase tracking-[0.22em] text-foreground">{label}</span>
                          <span className="mt-2 block text-[9px] text-muted-foreground">
                            {new Date(String(time)).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {order.customer_note && (
                  <div className="mt-5 border-t border-border/50 pt-5">
                    <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">
                      Customer note
                    </span>
                    <p className="mt-3 text-xs leading-relaxed tracking-[0.06em] text-muted-foreground">
                      {order.customer_note}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
