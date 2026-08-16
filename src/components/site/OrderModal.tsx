import { useEffect, useState } from "react";
import { ArrowUpRight, Check, Loader2, MapPin, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OrderModalProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  currencySymbol: string;
  size: string;
  finish: string;
  quantity: number;
};

const inputClass =
  "w-full rounded-2xl border border-border/70 bg-white/[0.02] px-4 py-4 text-xs tracking-[0.08em] text-foreground outline-none transition-colors placeholder:text-muted-foreground/55 focus:border-chrome/70";

export function OrderModal({
  open,
  onClose,
  productId,
  productName,
  productCode,
  unitPrice,
  currencySymbol,
  size,
  finish,
  quantity,
}: OrderModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const total = unitPrice * quantity;

  const close = () => {
    setError("");
    setOrderNumber("");
    onClose();
  };

  const useCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Current location is not supported on this device. You can still type your address.");
      return;
    }

    setLocating(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lng);
        setMapUrl(
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lng}`)}`,
        );
        setLocating(false);
      },
      () => {
        setMapUrl("");
        setLatitude(null);
        setLongitude(null);
        setError("Location permission was blocked. Type your full delivery address instead.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
      },
    );
  };

  const submit = async () => {
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (phone.trim().length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    if (address.trim().length < 5) {
      setError("Please enter your full delivery address.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { data, error: submitError } = await (supabase as any).rpc(
      "create_public_order",
      {
        p_product_id: productId,
        p_customer_name: name.trim(),
        p_phone: phone.trim(),
        p_address: address.trim(),
        p_size: size || null,
        p_finish: finish || null,
        p_quantity: quantity,
        p_map_url: mapUrl || null,
        p_latitude: latitude,
        p_longitude: longitude,
        p_note: note.trim() || null,
      },
    );

    setSubmitting(false);

    if (submitError) {
      setError(submitError.message || "Could not place the order. Please try again.");
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    setOrderNumber(result?.order_number ?? "ORDER RECEIVED");
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/85 px-4 py-6 backdrop-blur-md sm:py-10">
      <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="glass-panel relative w-full overflow-hidden rounded-[28px] border border-border/70 bg-background/95 p-5 shadow-2xl sm:p-8">
          <button
            type="button"
            onClick={close}
            aria-label="Close order form"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          {orderNumber ? (
            <div className="py-10 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full border border-chrome/60 bg-white/[0.04]">
                <Check className="size-5 text-foreground" />
              </div>
              <span className="mt-7 block text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
                ZZERKOFF / ORDER
              </span>
              <h2 className="mt-4 font-display text-xl tracking-[0.2em] text-foreground sm:text-2xl">
                ORDER RECEIVED
              </h2>
              <p className="mt-5 text-[10px] uppercase tracking-[0.35em] text-chrome">
                {orderNumber}
              </p>
              <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed tracking-[0.08em] text-muted-foreground">
                Your order is now in our studio. We will contact you on the phone number you provided to confirm delivery.
              </p>
              <button
                type="button"
                onClick={close}
                className="mt-8 w-full rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-5 text-[10px] uppercase tracking-[0.4em] text-foreground transition-colors hover:bg-white/[0.08]"
              >
                Continue
              </button>
            </div>
          ) : (
            <>
              <span className="text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
                ZZERKOFF / CHECKOUT
              </span>
              <h2 className="mt-4 pr-12 font-display text-xl tracking-[0.2em] text-foreground">
                PLACE ORDER
              </h2>

              <div className="mt-6 rounded-[20px] border border-border/60 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                      {productCode}
                    </span>
                    <p className="mt-2 font-display text-sm tracking-[0.14em] text-foreground">
                      {productName}
                    </p>
                    <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-muted-foreground">
                      {[size, finish].filter(Boolean).join(" / ") || "STANDARD"} · QTY {quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs tracking-[0.18em] text-chrome">
                    {currencySymbol}
                    {total.toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                    Name *
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                    Phone number *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="01XXXXXXXXX"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                    Full delivery address *
                  </label>
                  <textarea
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                    placeholder="House / road / area / district"
                    className={`${inputClass} resize-none leading-relaxed`}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-border/70 px-5 py-4 text-[9px] uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:border-chrome/60 hover:text-foreground disabled:opacity-60"
                  >
                    {locating ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : mapUrl ? (
                      <Check className="size-4" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    {locating ? "Getting location..." : mapUrl ? "Location captured" : "Use current location"}
                  </button>

                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-2 text-[8px] uppercase tracking-[0.3em] text-chrome transition-colors hover:text-foreground"
                    >
                      View map pin
                      <ArrowUpRight className="size-3" />
                    </a>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                    Note / landmark — optional
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Landmark, preferred delivery time, etc."
                    className={`${inputClass} resize-none leading-relaxed`}
                  />
                </div>
              </div>

              {error && (
                <p className="mt-5 rounded-2xl border border-border/60 bg-white/[0.02] px-4 py-3 text-[10px] leading-relaxed tracking-[0.08em] text-muted-foreground">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="group mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-chrome/50 bg-white/[0.04] px-8 py-6 text-[10px] uppercase tracking-[0.42em] text-foreground transition-all duration-500 hover:border-chrome hover:bg-white/[0.08] disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Placing order
                  </>
                ) : (
                  <>
                    Confirm order
                    <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-[8px] uppercase tracking-[0.25em] text-muted-foreground/70">
                No account required · We confirm before delivery
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
