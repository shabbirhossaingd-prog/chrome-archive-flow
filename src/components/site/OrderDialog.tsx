import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatPrice, WHATSAPP_NUMBER, type Product } from "@/lib/products";
import type { ReactNode } from "react";

const AREAS = ["Inside Dhaka", "Outside Dhaka"];

export function OrderDialog({ product, children }: { product: Product; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", address: "", area: AREAS[0] });

  const message = `ZZERKOFF ORDER\nObject: ${product.name} (ZZ / ${product.number})\nQuantity: ${qty}\nTotal: ${formatPrice(product.price * qty)}\nName: ${form.name}\nPhone: ${form.phone}\nAddress: ${form.address}\nDelivery: ${form.area}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener",
    );
    toast("Order sent", { description: "We will confirm your object shortly." });
    setOpen(false);
  };

  const field =
    "w-full rounded-xl border border-border/70 bg-black/40 px-4 py-3 text-xs tracking-[0.15em] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-chrome/60";
  const label = "mb-2 block text-[9px] uppercase tracking-[0.4em] text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="glass-panel max-h-[88vh] overflow-y-auto rounded-3xl border-border/70 bg-black/85 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-sm tracking-[0.3em] text-foreground">
            ORDER — {product.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 pt-2">
          <div className="flex items-center justify-between border-y border-border/60 py-4 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
            <span>ZZ / {product.number}</span>
            <span className="text-foreground">{formatPrice(product.price * qty)}</span>
          </div>

          <div>
            <span className={label}>Quantity</span>
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid size-9 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                −
              </button>
              <span className="text-xs tracking-[0.3em] text-foreground">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="grid size-9 place-items-center rounded-full border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="o-name">
                Name
              </label>
              <input
                id="o-name"
                required
                className={field}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className={label} htmlFor="o-phone">
                Phone
              </label>
              <input
                id="o-phone"
                required
                inputMode="tel"
                className={field}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className={label} htmlFor="o-address">
              Address
            </label>
            <textarea
              id="o-address"
              required
              rows={2}
              className={field}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div>
            <span className={label}>Delivery Area</span>
            <div className="flex gap-2">
              {AREAS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm({ ...form, area: a })}
                  className={`flex-1 rounded-xl border px-3 py-3 text-[9px] uppercase tracking-[0.3em] transition-colors ${
                    form.area === a
                      ? "border-chrome/70 text-foreground"
                      : "border-border/60 text-muted-foreground"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Cash on delivery available
            </p>
          </div>

          <button
            type="submit"
            className="w-full rounded-full border border-chrome/50 bg-white/[0.04] px-6 py-4 text-[10px] uppercase tracking-[0.45em] text-foreground transition-all duration-500 hover:border-chrome hover:bg-white/[0.08]"
          >
            Confirm order →
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}