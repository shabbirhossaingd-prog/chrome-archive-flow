import { useEffect, useState } from "react";

export type CartItem = {
  key: string;
  kind: "product" | "bundle";
  id: string;
  slug?: string;
  name: string;
  code: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  finish?: string;
  color?: string;
  productIds?: string[];
};

const WISHLIST_KEY = "zzerkoff:wishlist:v1";
const CART_KEY = "zzerkoff:cart:v1";
const EVENT = "zzerkoff:commerce-change";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}

export function wishlistIds() {
  return readJson<string[]>(WISHLIST_KEY, []);
}

export function toggleWishlistId(id: string) {
  const current = wishlistIds();
  const next = current.includes(id)
    ? current.filter((value) => value !== id)
    : [...current, id];
  writeJson(WISHLIST_KEY, next);
  return next;
}

export function cartItems() {
  return readJson<CartItem[]>(CART_KEY, []);
}

export function addCartItem(item: CartItem) {
  const current = cartItems();
  const existing = current.findIndex((row) => row.key === item.key);
  const next = [...current];

  if (existing >= 0) {
    next[existing] = {
      ...next[existing],
      quantity: next[existing].quantity + item.quantity,
    };
  } else {
    next.push(item);
  }

  writeJson(CART_KEY, next);
  return next;
}

export function updateCartQuantity(key: string, quantity: number) {
  const next = cartItems()
    .map((item) =>
      item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item,
    )
    .filter((item) => item.quantity > 0);
  writeJson(CART_KEY, next);
  return next;
}

export function removeCartItem(key: string) {
  const next = cartItems().filter((item) => item.key !== key);
  writeJson(CART_KEY, next);
  return next;
}

export function clearCart() {
  writeJson(CART_KEY, []);
}

function useCommerceValue<T>(reader: () => T) {
  const [value, setValue] = useState<T>(() => reader());

  useEffect(() => {
    const sync = () => setValue(reader());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [reader]);

  return value;
}

export function useWishlist() {
  return useCommerceValue(wishlistIds);
}

export function useCart() {
  return useCommerceValue(cartItems);
}

export function productCartKey(
  id: string,
  size?: string,
  finish?: string,
  color?: string,
) {
  return ["product", id, size || "-", finish || "-", color || "-"].join(":");
}
