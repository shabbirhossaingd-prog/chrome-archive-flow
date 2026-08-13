import { ProductCard } from "./ProductCard";
import { Reveal } from "./Reveal";
import type { Product } from "@/lib/products";

export function ProductGrid({
  products,
  loading,
  empty = "No objects in this category yet.",
}: {
  products: Product[];
  loading?: boolean;
  empty?: string;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-panel aspect-4/5 animate-pulse rounded-[24px] bg-white/[0.02]"
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="py-16 text-center text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
        {empty}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <Reveal key={p.id} delay={Math.min(i, 6) * 90}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </div>
  );
}