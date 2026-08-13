/**
 * ZZERKOFF — GLOBAL SETTINGS
 * Change these values once and they update everywhere on the site.
 */
export const SITE = {
  brand: "ZZERKOFF",
  tagline: "Objects for the Afterdark.",
  currencySymbol: "৳",
  currencyCode: "BDT",
  /** WhatsApp number in international format, digits only. */
  whatsappNumber: "8801XXXXXXXXX",
  instagramHandle: "@zzerkoff",
  instagramUrl: "https://instagram.com/zzerkoff",
  email: "hello@zzerkoff.com",
  location: "DHAKA / BANGLADESH",
  delivery: "Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.",
} as const;

export const formatPrice = (n: number | string) =>
  `${SITE.currencySymbol}${Number(n).toLocaleString("en-US")}`;

export const STOCK_OPTIONS = ["IN STOCK", "LOW STOCK", "SOLD OUT"] as const;

export function whatsappUrl(text: string) {
  return `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export function orderMessage(opts: {
  name: string;
  code: string;
  price: number | string;
  size?: string | null;
  quantity: number;
}) {
  return [
    `Hi ${SITE.brand},`,
    "",
    "I want to order:",
    "",
    `Product: ${opts.name}`,
    `Product Code: ${opts.code}`,
    `Price: ${SITE.currencySymbol}${Number(opts.price).toLocaleString("en-US")}`,
    `Selected Size: ${opts.size || "—"}`,
    `Quantity: ${opts.quantity}`,
    "",
    "Please confirm availability.",
  ].join("\n");
}

export function restockMessage(name: string, code: string) {
  return `Hi ${SITE.brand},\n\nIs ${name} (${code}) going to be restocked?`;
}