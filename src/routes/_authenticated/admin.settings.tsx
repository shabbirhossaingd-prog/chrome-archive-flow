import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/settings";
import { SITE } from "@/lib/site-config";
import { AdminButton, Field, adminField } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

type Form = {
  brand_name: string;
  instagram_url: string;
  whatsapp_number: string;
  email: string;
  location: string;
  currency_code: string;
  currency_symbol: string;
  default_delivery: string;
  default_care: string;
  default_size_guide: string;
};

function AdminSettings() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery(settingsQuery);
  const [form, setForm] = useState<Form | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const current: Form =
    form ??
    {
      brand_name: settings?.brand_name ?? SITE.brand,
      instagram_url: settings?.instagram_url ?? SITE.instagramUrl,
      whatsapp_number: settings?.whatsapp_number ?? SITE.whatsappNumber,
      email: settings?.email ?? SITE.email,
      location: settings?.location ?? SITE.location,
      currency_code: settings?.currency_code ?? SITE.currencyCode,
      currency_symbol: settings?.currency_symbol ?? SITE.currencySymbol,
      default_delivery:
        settings?.default_delivery ??
        "Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.",
      default_care:
        settings?.default_care ??
        "Keep away from water, perfume and humidity. Wipe with a dry cloth after wear.",
      default_size_guide:
        settings?.default_size_guide ??
        "Message ZZERKOFF on WhatsApp for exact measurements before ordering.",
    };

  const set = (key: keyof Form, value: string) => {
    setDirty(true);
    setForm({ ...current, [key]: value });
  };

  const save = useMutation({
    mutationFn: async () => {
      const values = {
        ...current,
        whatsapp_number: current.whatsapp_number.replace(/\D/g, ""),
      };
      if (settings) {
        const { error } = await supabase
          .from("site_settings")
          .update(values)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert(values);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved successfully.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Could not save settings"),
  });

  return (
    <div className="pb-20">
      <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
        GLOBAL / WEBSITE
      </span>
      <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
        SETTINGS
      </h1>

      {isLoading ? (
        <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading settings…
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
          className="mt-8 space-y-8"
        >
          <div className="glass-panel grid gap-5 rounded-[24px] p-6 sm:grid-cols-2">
            <Field label="Brand">
              <input
                className={adminField}
                value={current.brand_name}
                onChange={(e) => set("brand_name", e.target.value)}
              />
            </Field>
            <Field label="Instagram URL">
              <input
                className={adminField}
                value={current.instagram_url}
                onChange={(e) => set("instagram_url", e.target.value)}
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                className={adminField}
                value={current.whatsapp_number}
                onChange={(e) => set("whatsapp_number", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={adminField}
                type="email"
                value={current.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Location">
              <input
                className={adminField}
                value={current.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </Field>
            <Field label="Currency code">
              <input
                className={adminField}
                value={current.currency_code}
                onChange={(e) => set("currency_code", e.target.value)}
              />
            </Field>
            <Field label="Currency symbol">
              <input
                className={adminField}
                value={current.currency_symbol}
                onChange={(e) => set("currency_symbol", e.target.value)}
              />
            </Field>
          </div>

          <div className="glass-panel space-y-5 rounded-[24px] p-6">
            <h2 className="font-display text-sm tracking-[0.22em] text-foreground">
              GLOBAL PRODUCT DEFAULTS
            </h2>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Product-specific content can override these defaults.
            </p>
            <Field label="Default delivery information">
              <textarea
                className={adminField}
                rows={4}
                value={current.default_delivery}
                onChange={(e) => set("default_delivery", e.target.value)}
              />
            </Field>
            <Field label="Default care information">
              <textarea
                className={adminField}
                rows={4}
                value={current.default_care}
                onChange={(e) => set("default_care", e.target.value)}
              />
            </Field>
            <Field label="Default size guide">
              <textarea
                className={adminField}
                rows={4}
                value={current.default_size_guide}
                onChange={(e) => set("default_size_guide", e.target.value)}
              />
            </Field>
          </div>

          <AdminButton type="submit" tone="primary" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </AdminButton>
        </form>
      )}
    </div>
  );
}
