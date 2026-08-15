import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  component: NewProduct,
});

function NewProduct() {
  return (
    <div className="pb-20">
      <h1 className="font-display text-lg tracking-[0.25em] text-foreground">NEW OBJECT</h1>
      <p className="mt-3 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
        Product code is generated automatically from the category
      </p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}