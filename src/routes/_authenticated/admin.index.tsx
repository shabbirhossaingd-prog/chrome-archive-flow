import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAdminProducts, isSoldOut, type Product } from "@/lib/products";
import { useSite } from "@/lib/settings";
import { SmartImage } from "@/components/site/SmartImage";
import { AdminButton } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminObjects,
});

function AdminObjects() {
  const { data: products = [], isLoading } = useAdminProducts();
  const { price } = useSite();
  const queryClient = useQueryClient();

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Product> }) => {
      const { error } = await supabase.from("products").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Object deleted");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

  const stats = [
    { label: "OBJECTS", value: products.length },
    { label: "PUBLISHED", value: products.filter((p) => p.published).length },
    { label: "SOLD OUT", value: products.filter(isSoldOut).length },
    { label: "ARCHIVED", value: products.filter((p) => p.archived).length },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass-panel rounded-[22px] p-5">
            <span className="text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
              {s.label}
            </span>
            <p className="mt-3 font-display text-2xl tracking-[0.15em] text-foreground">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-lg tracking-[0.25em] text-foreground">OBJECT LIST</h1>
        <Link
          to="/admin/products/new"
          className="rounded-xl border border-chrome/60 bg-white/[0.05] px-5 py-3 text-[9px] uppercase tracking-[0.35em] text-foreground hover:bg-white/[0.1]"
        >
          New object
        </Link>
      </div>

      {isLoading && (
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Loading…</p>
      )}

      <div className="space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="glass-panel flex flex-wrap items-center gap-5 rounded-[22px] p-4"
          >
            <SmartImage
              src={p.primary_image}
              alt={p.name}
              width={120}
              height={150}
              className="size-16 shrink-0 rounded-xl object-cover grayscale"
            />
            <div className="min-w-[10rem] flex-1">
              <span className="block text-[9px] tracking-[0.4em] text-muted-foreground">
                {p.product_code} · {p.category.toUpperCase()}
              </span>
              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-foreground">
                {p.name}
              </p>
              <p className="mt-1 text-[10px] tracking-[0.2em] text-chrome">
                {price(p.price)} · QTY {p.quantity_available} · {p.stock_status}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminButton
                onClick={() => patch.mutate({ id: p.id, values: { published: !p.published } })}
              >
                {p.published ? "Published" : "Draft"}
              </AdminButton>
              <AdminButton
                onClick={() => patch.mutate({ id: p.id, values: { featured: !p.featured } })}
              >
                {p.featured ? "Featured" : "Not featured"}
              </AdminButton>
              <AdminButton
                onClick={() => patch.mutate({ id: p.id, values: { archived: !p.archived } })}
              >
                {p.archived ? "Archived" : "Live"}
              </AdminButton>
              <Link
                to="/admin/products/$id"
                params={{ id: p.id }}
                className="rounded-xl border border-chrome/60 px-5 py-3 text-[9px] uppercase tracking-[0.35em] text-foreground"
              >
                Edit
              </Link>
              <AdminButton
                tone="danger"
                onClick={() => {
                  if (confirm(`Delete ${p.name}? This cannot be undone.`)) remove.mutate(p.id);
                }}
              >
                Delete
              </AdminButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}