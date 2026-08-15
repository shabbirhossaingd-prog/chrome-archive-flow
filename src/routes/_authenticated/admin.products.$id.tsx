import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
      <h1 className="font-display text-lg tracking-[0.25em] text-foreground">EDIT OBJECT</h1>
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
        <>
          <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            {product.product_code}
          </p>
          <div className="mt-8">
            <ProductForm product={product} />
          </div>
        </>
      )}
    </div>
  );
}