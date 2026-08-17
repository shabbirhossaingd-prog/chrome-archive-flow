import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Palette } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();

  const { data: product, isLoading } = useQuery({
    queryKey: ["products", "admin", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-lg tracking-[0.25em] text-foreground">
            EDIT OBJECT
          </h1>
          {product ? (
            <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
              {product.product_code}
            </p>
          ) : null}
        </div>

        {product ? (
          <Link
            to="/admin/products/$id/colors"
            params={{ id: product.id }}
            className="inline-flex items-center gap-2 rounded-xl border border-chrome/45 bg-white/[0.035] px-5 py-3 text-[8px] uppercase tracking-[0.3em] text-foreground"
          >
            <Palette className="size-3.5" />
            Color inventory
          </Link>
        ) : null}
      </div>

      {isLoading && (
        <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Loading…
        </p>
      )}

      {!isLoading && !product && (
        <p className="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Object not found
        </p>
      )}

      {product && (
        <div className="mt-8">
          <ProductForm product={product} />
        </div>
      )}
    </div>
  );
}
