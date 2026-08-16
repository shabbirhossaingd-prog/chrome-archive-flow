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
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const total = unitPrice * quantity;

  useEffect(() => {
    if (!open) return;
    (supabase as any)
      .from("site_settings")
      .select("cod_enabled,bkash_enabled,bkash_number,nagad_enabled,nagad_number")
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: any }) => setPaymentSettings(data ?? null));
  }, [open]);

  if (!open) return null;

  const close = () => {
    setError("");
    setOrderNumber("");
    setCopied(false);
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
    const phoneDigits = phone.replace(/\D/g, "");
    const normalizedPhone =
      phoneDigits.length === 13 && phoneDigits.startsWith("8801")
        ? `0${phoneDigits.slice(3)}`
        : phoneDigits;

    if (normalizedPhone.length !== 11) {
      setError("Please enter an 11-digit Bangladesh phone number.");
      return;
    }
    if (address.trim().length < 5) {
      setError("Please enter your full delivery address.");
      return;
    }

    if (paymentMethod !== "cod" && transactionId.trim().length < 4) {
      setError("Please enter your transaction ID.");
      return;
    }

    setSubmitting(true);
    setError("");

    const { data, error: submitError } = await (supabase as any).rpc(
      "create_public_order",
      {
        p_product_id: productId,
        p_customer_name: name.trim(),
        p_phone: normalizedPhone,
        p_address: address.trim(),
        p_size: size || null,
        p_finish: finish || null,
        p_quantity: quantity,
        p_map_url: mapUrl || null,
        p_latitude: latitude,
        p_longitude: longitude,
        p_note: note.trim() || null,
        p_payment_method: paymentMethod,
        p_transaction_id: paymentMethod === "cod" ? null : transactionId.trim(),
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
            <div className="py-8 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-full border border-chrome/60 bg-white/[0.04]">
                <Check className="size-5 text-foreground" />
              </div>
              <span className="mt-7 block text-[9px] uppercase tracking-[0.45em] text-muted-foreground">
                ZZERKOFF / ORDER
              </span>
              <h2 className="mt-4 font-display text-xl tracking-[0.2em] text-foreground sm:text-2xl">
                ORDER RECEIVED
              </h2>

              <div className="mx-auto mt-6 max-w-sm rounded-[20px] border border-border/60 bg-white/[0.02] p-4 text-left">
                <span className="text-[8px] uppercase tracking-[0.32em] text-muted-foreground">Order ID</span>
                <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-chrome">{orderNumber}</p>
                <div className="mt-4 flex items-end justify-between gap-4 border-t border-border/40 pt-4">
                  <div>
                    <p className="font-display text-xs tracking-[0.12em] text-foreground">{productName}</p>
                    <p className="mt-2 text-[8px] uppercase tracking-[0.25em] text-muted-foreground">QTY {quantity} · {paymentMethod}</p>
                  </div>
                  <p className="text-xs tracking-[0.14em] text-foreground">
                    {currencySymbol}{total.toLocaleString("en-US")}
                  </p>
                </div>
              </div>

              <p className="mx-auto mt-6 max-w-sm text-xs leading-relaxed tracking-[0.08em] text-muted-foreground">
                Keep your order ID. We will contact the phone number you provided to confirm delivery.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(orderNumber);
                      setCopied(true);
                    } catch {
                      setCopied(false);
                    }
                  }}
                  className="rounded-full border border-border/70 px-6 py-5 text-[9px] uppercase tracking-[0.32em] text-muted-foreground transition-colors hover:border-chrome/60 hover:text-foreground"
                >
                  {copied ? "Copied" : "Copy order ID"}
                </button>
                <a
                  href="/track-order"
                  className="rounded-full border border-chrome/50 bg-white/[0.04] px-6 py-5 text-[9px] uppercase tracking-[0.32em] text-foreground transition-colors hover:bg-white/[0.08]"
                >
                  Track order
                </a>
              </div>

              <button
                type="button"
                onClick={close}
                className="mt-3 w-full rounded-full border border-border/50 px-8 py-5 text-[9px] uppercase tracking-[0.34em] text-muted-foreground transition-colors hover:text-foreground"
              >
                Continue shopping
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
                    Payment method
                  </label>
                  <div className="space-y-2">
                    {(paymentSettings?.cod_enabled !== false) && (
                      <button type="button" onClick={() => { setPaymentMethod("cod"); setTransactionId(""); }} className={`w-full rounded-2xl border px-4 py-4 text-left ${paymentMethod === "cod" ? "border-chrome/60 bg-white/[0.05]" : "border-border/60 bg-white/[0.02]"}`}>
                        <span className="text-[9px] uppercase tracking-[0.28em] text-foreground">Cash on delivery</span>
                      </button>
                    )}
                    {paymentSettings?.bkash_enabled && paymentSettings?.bkash_number && (
                      <button type="button" onClick={() => { setPaymentMethod("bkash"); setTransactionId(""); }} className={`w-full rounded-2xl border px-4 py-4 text-left ${paymentMethod === "bkash" ? "border-chrome/60 bg-white/[0.05]" : "border-border/60 bg-white/[0.02]"}`}>
                        <span className="block text-[9px] uppercase tracking-[0.28em] text-foreground">bKash</span>
                        <span className="mt-2 block text-[9px] tracking-[0.12em] text-muted-foreground">Send Money to: {paymentSettings.bkash_number}</span>
                        <span className="mt-1 block text-[9px] tracking-[0.12em] text-chrome">Amount: {currencySymbol}{total.toLocaleString("en-US")}</span>
                      </button>
                    )}
                    {paymentSettings?.nagad_enabled && paymentSettings?.nagad_number && (
                      <button type="button" onClick={() => { setPaymentMethod("nagad"); setTransactionId(""); }} className={`w-full rounded-2xl border px-4 py-4 text-left ${paymentMethod === "nagad" ? "border-chrome/60 bg-white/[0.05]" : "border-border/60 bg-white/[0.02]"}`}>
                        <span className="block text-[9px] uppercase tracking-[0.28em] text-foreground">Nagad</span>
                        <span className="mt-2 block text-[9px] tracking-[0.12em] text-muted-foreground">Send Money to: {paymentSettings.nagad_number}</span>
                        <span className="mt-1 block text-[9px] tracking-[0.12em] text-chrome">Amount: {currencySymbol}{total.toLocaleString("en-US")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {paymentMethod !== "cod" && (
                  <div>
                    <label className="mb-2 block text-[8px] uppercase tracking-[0.35em] text-muted-foreground">
                      Transaction ID *
                    </label>
                    <input value={transactionId} onChange={(e) => setTransactionId(e.target.value)} placeholder="Enter bKash / Nagad TrxID" className={inputClass} />
                    <p className="mt-2 text-[9px] leading-relaxed tracking-[0.06em] text-muted-foreground">
                      Send Money first, then enter the TrxID. Never share your PIN or OTP.
                    </p>
                  </div>
                )}

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
