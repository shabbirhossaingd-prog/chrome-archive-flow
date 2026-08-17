import { Heart } from "lucide-react";
import { useWishlist, toggleWishlistId } from "@/lib/commerce";
import { cn } from "@/lib/utils";

export function WishlistButton({
  productId,
  className,
  label = false,
}: {
  productId: string;
  className?: string;
  label?: boolean;
}) {
  const ids = useWishlist();
  const active = ids.includes(productId);

  return (
    <button
      type="button"
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleWishlistId(productId);
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-border/60 bg-black/55 text-muted-foreground backdrop-blur-md transition-colors hover:border-chrome/60 hover:text-foreground",
        label ? "px-5 py-4 text-[9px] uppercase tracking-[0.28em]" : "size-10",
        active && "border-chrome/60 text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
      {label ? (active ? "Saved" : "Wishlist") : null}
    </button>
  );
}
