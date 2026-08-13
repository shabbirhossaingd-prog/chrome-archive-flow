import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group glass-panel block overflow-hidden rounded-[24px] transition-all duration-700 hover:border-chrome/60"
    >
      <div className="relative overflow-hidden bg-black">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1280}
          className="aspect-4/5 w-full object-cover grayscale transition-transform duration-[1600ms] ease-out group-hover:scale-105"
        />
        <div className="grain-overlay" />
      </div>
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <span className="block text-[9px] tracking-[0.4em] text-muted-foreground">
            {product.number}
          </span>
          <h3 className="mt-2 truncate text-[11px] uppercase tracking-[0.28em] text-foreground transition-transform duration-700 group-hover:translate-x-1">
            {product.name}
          </h3>
          <p className="mt-2 text-[11px] tracking-[0.2em] text-chrome">
            {formatPrice(product.price)}
          </p>
        </div>
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-all duration-700 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
      </div>
    </Link>
  );
}