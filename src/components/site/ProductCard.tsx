import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "./SmartImage";
import { formatPrice, isSoldOut, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const soldOut = isSoldOut(product);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group glass-panel block overflow-hidden rounded-[24px] transition-all duration-700 hover:border-chrome/60"
    >
      <div className="relative overflow-hidden bg-black">
        <SmartImage
          src={product.primary_image}
          alt={product.name}
          width={1024}
          height={1280}
          className="aspect-4/5 w-full object-cover grayscale transition-transform duration-[1600ms] ease-out group-hover:scale-105"
        />
        <div className="grain-overlay" />
        {soldOut && (
          <span className="absolute left-4 top-4 rounded-full border border-chrome/50 bg-black/70 px-3 py-2 text-[8px] uppercase tracking-[0.35em] text-foreground backdrop-blur-md">
            Sold out
          </span>
        )}
        {product.stock_status === "LOW STOCK" && (
          <span className="absolute left-4 top-4 rounded-full border border-border/60 bg-black/70 px-3 py-2 text-[8px] uppercase tracking-[0.35em] text-muted-foreground backdrop-blur-md">
            Low stock
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <span className="block text-[9px] tracking-[0.4em] text-muted-foreground">
            {product.product_code}
          </span>
          <h3 className="mt-2 truncate text-[11px] uppercase tracking-[0.28em] text-foreground transition-transform duration-700 group-hover:translate-x-1">
            {product.name}
          </h3>
          <p className="mt-2 text-[11px] tracking-[0.2em] text-chrome">
            {formatPrice(product.price)}
            {product.old_price ? (
              <span className="ml-2 text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </span>
            ) : null}
          </p>
          <span className="mt-2 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground">
            {product.category.replace("-", " ")}
          </span>
        </div>
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-all duration-700 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground" />
      </div>
    </Link>
  );
}