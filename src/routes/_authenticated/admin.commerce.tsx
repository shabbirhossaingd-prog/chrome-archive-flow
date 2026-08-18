import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Layers3, Percent, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts } from "@/lib/products";
import { useSite } from "@/lib/settings";
import { AdminButton, adminField } from "@/components/admin/AdminUI";
import { SmartImage } from "@/components/site/SmartImage";

export const Route = createFileRoute("/_authenticated/admin/commerce")({
  component: AdminCommerce,
});

function Section({
  icon,
  eyebrow,
  title,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="glass-panel rounded-[24px] p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <span className="text-[8px] uppercase tracking-[0.34em] text-muted-foreground">
            {eyebrow}
          </span>
          <h2 className="mt-2 font-display text-sm tracking-[0.16em] text-foreground">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function ProductPicker({
  selected,
  onChange,
  max = 4,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const { data: products = [] } = useAdminProducts();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {products
        .filter((product) => !product.archived)
        .map((product) => {
          const active = selected.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                if (active) {
                  onChange(selected.filter((id) => id !== product.id));
                  return;
                }
                if (selected.length >= max) {
                  toast.error(`Select up to ${max} objects.`);
                  return;
                }
                onChange([...selected, product.id]);
              }}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                active
                  ? "border-chrome/55 bg-white/[0.04]"
                  : "border-border/45"
              }`}
            >
              <SmartImage
                src={product.primary_image}
                alt={product.name}
                width={80}
                height={80}
                className="size-11 rounded-xl object-cover grayscale"
              />
              <span className="min-w-0">
                <span className="block text-[8px] uppercase tracking-[0.22em] text-muted-foreground">
                  {product.product_code}
                </span>
                <span className="mt-1 block truncate text-[10px] text-foreground">
                  {product.name}
                </span>
              </span>
            </button>
          );
        })}
    </div>
  );
}

function AdminCommerce() {
  const queryClient = useQueryClient();
  const site = useSite();
  const { data: products = [] } = useAdminProducts();

  // Promo form
  const [promoCode, setPromoCode] = useState("");
  const [promoType, setPromoType] = useState<"percent" | "fixed">("percent");
  const [promoValue, setPromoValue] = useState("");
  const [promoMin, setPromoMin] = useState("0");
  const [promoMaxUses, setPromoMaxUses] = useState("");

  // Bundle form
  const [bundleCode, setBundleCode] = useState("");
  const [bundleName, setBundleName] = useState("");
  const [bundleDescription, setBundleDescription] = useState("");
  const [bundlePrice, setBundlePrice] = useState("");
  const [bundleImage, setBundleImage] = useState("");
  const [bundleProducts, setBundleProducts] = useState<string[]>([]);

  // Look form
  const [lookTitle, setLookTitle] = useState("");
  const [lookTagline, setLookTagline] = useState("");
  const [lookImage, setLookImage] = useState("");
  const [lookProducts, setLookProducts] = useState<string[]>([]);

  const promosQuery = useQuery({
    queryKey: ["admin-commerce-promos"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_promos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const bundlesQuery = useQuery({
    queryKey: ["admin-commerce-bundles"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_bundles")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const looksQuery = useQuery({
    queryKey: ["admin-commerce-looks"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_shop_looks")
        .select("*")
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["admin-commerce-notifications"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("commerce_notification_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const createPromo = useMutation({
    mutationFn: async () => {
      const code = promoCode.trim().toUpperCase();
      const discountValue = Number(promoValue);
      const minimumOrder = Number(promoMin || 0);
      const maxUses = promoMaxUses ? Number(promoMaxUses) : null;

      if (!code) throw new Error("Enter a promo code.");
      if (!/^[A-Z0-9_-]{2,32}$/.test(code)) {
        throw new Error("Use 2–32 letters, numbers, - or _ for the promo code.");
      }
      if (!Number.isFinite(discountValue) || discountValue <= 0) {
        throw new Error("Discount must be greater than 0.");
      }
      if (promoType === "percent" && discountValue > 100) {
        throw new Error("Percentage discount cannot be more than 100%.");
      }
      if (!Number.isFinite(minimumOrder) || minimumOrder < 0) {
        throw new Error("Minimum order must be 0 or more.");
      }
      if (
        maxUses !== null &&
        (!Number.isInteger(maxUses) || maxUses < 1)
      ) {
        throw new Error("Max uses must be a whole number of 1 or more.");
      }

      const { error } = await (supabase as any).from("commerce_promos").insert({
        code,
        discount_type: promoType,
        discount_value: discountValue,
        min_order_amount: minimumOrder,
        max_uses: maxUses,
        active: true,
      });

      if (error?.code === "23505") {
        throw new Error("This promo code already exists.");
      }
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promo created and ready to use.");
      setPromoCode("");
      setPromoValue("");
      setPromoMin("0");
      setPromoMaxUses("");
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-promos"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create promo."),
  });

  const togglePromo = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from("commerce_promos")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-promos"] }),
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("commerce_promos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-promos"] }),
  });

  const createBundle = useMutation({
    mutationFn: async () => {
      if (!bundleCode.trim() || !bundleName.trim()) {
        throw new Error("Bundle code and name are required.");
      }
      if (bundleProducts.length < 2) {
        throw new Error("Choose at least 2 objects.");
      }
      const first = productMap.get(bundleProducts[0]);
      const { error } = await (supabase as any).from("commerce_bundles").insert({
        code: bundleCode.trim().toUpperCase(),
        name: bundleName.trim(),
        description: bundleDescription.trim(),
        bundle_price: Number(bundlePrice || 0),
        hero_image: bundleImage.trim() || first?.primary_image || "",
        product_ids: bundleProducts,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bundle created.");
      setBundleCode("");
      setBundleName("");
      setBundleDescription("");
      setBundlePrice("");
      setBundleImage("");
      setBundleProducts([]);
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["commerce-bundles-public"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create bundle."),
  });

  const toggleBundle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await (supabase as any)
        .from("commerce_bundles")
        .update({ active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-bundles"] });
      queryClient.invalidateQueries({ queryKey: ["commerce-bundles-public"] });
    },
  });

  const deleteBundle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("commerce_bundles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-bundles"] }),
  });

  const createLook = useMutation({
    mutationFn: async () => {
      if (!lookTitle.trim()) throw new Error("Enter a look title.");
      if (lookProducts.length < 1) throw new Error("Choose at least 1 object.");
      const first = productMap.get(lookProducts[0]);
      const { error } = await (supabase as any).from("commerce_shop_looks").insert({
        title: lookTitle.trim(),
        tagline: lookTagline.trim(),
        image_url: lookImage.trim() || first?.primary_image || "",
        product_ids: lookProducts,
        published: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Shop the Look published.");
      setLookTitle("");
      setLookTagline("");
      setLookImage("");
      setLookProducts([]);
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-looks"] });
      queryClient.invalidateQueries({ queryKey: ["commerce-shop-looks-public"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Could not create look."),
  });

  const toggleLook = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await (supabase as any)
        .from("commerce_shop_looks")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-looks"] });
      queryClient.invalidateQueries({ queryKey: ["commerce-shop-looks-public"] });
    },
  });

  const deleteLook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("commerce_shop_looks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-commerce-looks"] }),
  });

  return (
    <div className="space-y-7 pb-20">
      <div>
        <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
          STORE / EXPERIENCE
        </span>
        <h1 className="mt-4 font-display text-xl tracking-[0.22em] text-foreground">
          COMMERCE
        </h1>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          One place for promos, bundles, Shop the Look and notification readiness.
        </p>
      </div>

      <Section icon={<Percent className="size-5" />} eyebrow="Checkout" title="PROMO CODES">
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          <input
            className={adminField}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="CODE"
          />
          <select
            className={adminField}
            value={promoType}
            onChange={(e) => setPromoType(e.target.value as "percent" | "fixed")}
          >
            <option value="percent">Percent %</option>
            <option value="fixed">Fixed {site.currencySymbol}</option>
          </select>
          <input
            type="number"
            min="0"
            className={adminField}
            value={promoValue}
            onChange={(e) => setPromoValue(e.target.value)}
            placeholder="Discount"
          />
          <input
            type="number"
            min="0"
            className={adminField}
            value={promoMin}
            onChange={(e) => setPromoMin(e.target.value)}
            placeholder="Min order"
          />
          <input
            type="number"
            min="1"
            className={adminField}
            value={promoMaxUses}
            onChange={(e) => setPromoMaxUses(e.target.value)}
            placeholder="Max uses"
          />
        </div>
        <AdminButton
          tone="primary"
          className="mt-4"
          onClick={() => createPromo.mutate()}
          disabled={createPromo.isPending}
        >
          Create promo
        </AdminButton>

        <div className="mt-6 space-y-2">
          {(promosQuery.data ?? []).map((promo: any) => (
            <div
              key={promo.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/45 p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-[0.16em] text-foreground">
                  {promo.code}
                </p>
                <p className="mt-1 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                  {promo.discount_type} {promo.discount_value} · used {promo.usage_count}
                  {promo.max_uses ? ` / ${promo.max_uses}` : ""}
                </p>
              </div>
              <AdminButton
                onClick={() =>
                  togglePromo.mutate({ id: promo.id, active: !promo.active })
                }
              >
                {promo.active ? "Disable" : "Enable"}
              </AdminButton>
              <button
                type="button"
                onClick={() => deletePromo.mutate(promo.id)}
                className="grid size-10 place-items-center rounded-xl border border-border/50 text-muted-foreground"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<Layers3 className="size-5" />} eyebrow="Curated sets" title="BUNDLES">
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            className={adminField}
            value={bundleCode}
            onChange={(e) => setBundleCode(e.target.value)}
            placeholder="BND-001"
          />
          <input
            className={adminField}
            value={bundleName}
            onChange={(e) => setBundleName(e.target.value)}
            placeholder="Bundle name"
          />
          <input
            type="number"
            min="0"
            className={adminField}
            value={bundlePrice}
            onChange={(e) => setBundlePrice(e.target.value)}
            placeholder="Bundle price"
          />
          <input
            className={adminField}
            value={bundleImage}
            onChange={(e) => setBundleImage(e.target.value)}
            placeholder="Hero image URL / storage ref (optional)"
          />
          <textarea
            rows={3}
            className={`${adminField} sm:col-span-2`}
            value={bundleDescription}
            onChange={(e) => setBundleDescription(e.target.value)}
            placeholder="Bundle description"
          />
        </div>
        <p className="mb-3 mt-5 text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
          Choose 2–4 objects
        </p>
        <ProductPicker
          selected={bundleProducts}
          onChange={setBundleProducts}
          max={4}
        />
        <AdminButton
          tone="primary"
          className="mt-4"
          onClick={() => createBundle.mutate()}
          disabled={createBundle.isPending}
        >
          Create bundle
        </AdminButton>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {(bundlesQuery.data ?? []).map((bundle: any) => (
            <article
              key={bundle.id}
              className="rounded-[22px] border border-border/45 p-4"
            >
              <div className="flex items-start gap-3">
                {bundle.hero_image ? (
                  <SmartImage
                    src={bundle.hero_image}
                    alt={bundle.name}
                    width={100}
                    height={100}
                    className="size-14 rounded-xl object-cover grayscale"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                    {bundle.code}
                  </span>
                  <p className="mt-2 text-xs text-foreground">{bundle.name}</p>
                  <p className="mt-2 text-[9px] text-chrome">
                    {site.price(bundle.bundle_price)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-border/35 pt-4">
                <AdminButton
                  onClick={() =>
                    toggleBundle.mutate({ id: bundle.id, active: !bundle.active })
                  }
                >
                  {bundle.active ? "Hide" : "Show"}
                </AdminButton>
                <button
                  type="button"
                  onClick={() => deleteBundle.mutate(bundle.id)}
                  className="grid size-10 place-items-center rounded-xl border border-border/50 text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section icon={<ScanLine className="size-5" />} eyebrow="Editorial selling" title="SHOP THE LOOK">
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input
            className={adminField}
            value={lookTitle}
            onChange={(e) => setLookTitle(e.target.value)}
            placeholder="Look title"
          />
          <input
            className={adminField}
            value={lookImage}
            onChange={(e) => setLookImage(e.target.value)}
            placeholder="Look image URL / storage ref (optional)"
          />
          <textarea
            rows={3}
            className={`${adminField} sm:col-span-2`}
            value={lookTagline}
            onChange={(e) => setLookTagline(e.target.value)}
            placeholder="Styling line / caption"
          />
        </div>
        <p className="mb-3 mt-5 text-[8px] uppercase tracking-[0.28em] text-muted-foreground">
          Attach up to 4 objects
        </p>
        <ProductPicker selected={lookProducts} onChange={setLookProducts} max={4} />
        <AdminButton
          tone="primary"
          className="mt-4"
          onClick={() => createLook.mutate()}
          disabled={createLook.isPending}
        >
          Publish look
        </AdminButton>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {(looksQuery.data ?? []).map((look: any) => (
            <article
              key={look.id}
              className="rounded-[22px] border border-border/45 p-4"
            >
              <div className="flex items-start gap-3">
                {look.image_url ? (
                  <SmartImage
                    src={look.image_url}
                    alt={look.title}
                    width={100}
                    height={100}
                    className="size-14 rounded-xl object-cover grayscale"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                    {look.published ? "PUBLISHED" : "HIDDEN"}
                  </span>
                  <p className="mt-2 text-xs text-foreground">{look.title}</p>
                  <p className="mt-2 text-[9px] text-muted-foreground">
                    {(look.product_ids ?? []).length} objects
                  </p>
                </div>
              </div>
              <div className="mt-4 flex gap-2 border-t border-border/35 pt-4">
                <AdminButton
                  onClick={() =>
                    toggleLook.mutate({
                      id: look.id,
                      published: !look.published,
                    })
                  }
                >
                  {look.published ? "Hide" : "Publish"}
                </AdminButton>
                <button
                  type="button"
                  onClick={() => deleteLook.mutate(look.id)}
                  className="grid size-10 place-items-center rounded-xl border border-border/50 text-muted-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section icon={<BellRing className="size-5" />} eyebrow="Order events" title="NOTIFICATIONS">
        <div className="mt-5 rounded-2xl border border-chrome/35 bg-white/[0.025] p-4">
          <p className="text-[9px] leading-relaxed text-muted-foreground">
            Notification events are now queued automatically for order received,
            status changes and payment changes. Actual SMS / WhatsApp / email sending
            stays OFF until a provider is connected, so there is no accidental charge
            or message during testing.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          {(notificationsQuery.data ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">
              New order events will appear here.
            </p>
          ) : (
            (notificationsQuery.data ?? []).map((event: any) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] uppercase tracking-[0.24em] text-muted-foreground">
                    {event.order_number}
                  </span>
                  <p className="mt-1 text-[10px] text-foreground">
                    {event.event_type.replace(/_/g, " ")}
                  </p>
                </div>
                <span className="rounded-xl border border-border/50 px-3 py-2 text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
                  {event.delivery_status}
                </span>
              </div>
            ))
          )}
        </div>
      </Section>
    </div>
  );
}
