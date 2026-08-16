import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSite } from "@/lib/settings";
import {
  ErpButton,
  ErpLabel,
  ErpPanel,
  erpField,
} from "@/components/erp/ErpUI";

export const Route = createFileRoute("/_authenticated/erp/settings")({
  component: ErpSettings,
});

function ErpSettings() {
  const site = useSite();
  const queryClient = useQueryClient();
  const settings = site.settings as any;

  const [courier, setCourier] = useState("0");
  const [packaging, setPackaging] = useState("0");
  const [mobileFee, setMobileFee] = useState("0");
  const [autoClose, setAutoClose] = useState(true);

  useEffect(() => {
    setCourier(String(settings?.erp_default_courier_cost ?? 0));
    setPackaging(String(settings?.erp_default_packaging_cost ?? 0));
    setMobileFee(String(settings?.erp_mobile_payment_fee_percent ?? 0));
    setAutoClose(Boolean(settings?.erp_auto_month_close ?? true));
  }, [settings?.id]);

  const save = useMutation({
    mutationFn: async () => {
      if (!settings?.id) {
        throw new Error("Site settings row not found.");
      }

      const { error } = await (supabase as any)
        .from("site_settings")
        .update({
          erp_default_courier_cost: Number(courier || 0),
          erp_default_packaging_cost: Number(packaging || 0),
          erp_mobile_payment_fee_percent: Number(mobileFee || 0),
          erp_auto_month_close: autoClose,
        })
        .eq("id", settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("ERP defaults saved.");
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["erp-metrics"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not save ERP settings."),
  });

  return (
    <div className="space-y-6 pb-8">
      <div>
        <ErpLabel>ERP / CONFIGURATION</ErpLabel>
        <h1 className="mt-4 font-display text-2xl tracking-[0.16em] text-foreground">
          ERP SETTINGS
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Set default per-order costs used when an order does not have an explicit cost snapshot.
        </p>
      </div>

      <ErpPanel className="max-w-3xl">
        <ErpLabel>Automatic costing</ErpLabel>
        <h2 className="mt-3 font-display text-base tracking-[0.14em] text-foreground">
          DEFAULT ORDER COSTS
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <label>
            <ErpLabel className="mb-2">Courier / order</ErpLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              className={erpField}
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            />
          </label>
          <label>
            <ErpLabel className="mb-2">Packaging / order</ErpLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              className={erpField}
              value={packaging}
              onChange={(e) => setPackaging(e.target.value)}
            />
          </label>
          <label>
            <ErpLabel className="mb-2">bKash/Nagad fee %</ErpLabel>
            <input
              type="number"
              min="0"
              step="0.01"
              className={erpField}
              value={mobileFee}
              onChange={(e) => setMobileFee(e.target.value)}
            />
          </label>
        </div>

        <label className="mt-5 flex items-center justify-between gap-5 rounded-2xl border border-border/50 px-4 py-4">
          <div>
            <ErpLabel>Auto month close</ErpLabel>
            <p className="mt-2 max-w-lg text-[9px] leading-relaxed text-muted-foreground">
              On the first ERP visit of a new month, automatically archive the previous month if it is not already closed.
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoClose}
            onChange={(e) => setAutoClose(e.target.checked)}
          />
        </label>

        <div className="mt-5 rounded-2xl border border-border/45 bg-white/[0.02] p-4">
          <ErpLabel>How automation works</ErpLabel>
          <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">
            Delivered orders automatically freeze product cost, courier default and packaging default.
            Expenses flow into reports. Purchases update stock and weighted average cost. Month Close stores a permanent snapshot.
          </p>
        </div>

        <ErpButton
          tone="primary"
          className="mt-5"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving…" : "Save ERP settings"}
        </ErpButton>
      </ErpPanel>
    </div>
  );
}
