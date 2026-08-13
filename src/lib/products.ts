import ring from "@/assets/product-ring.jpg";
import chain from "@/assets/product-chain.jpg";
import bracelet from "@/assets/product-bracelet.jpg";

export type Category = "RINGS" | "CHAINS" | "BRACELETS";

export type Product = {
  slug: string;
  number: string;
  name: string;
  price: number;
  category: Category;
  image: string;
  specs: string[];
  description: string;
  details: string;
  size: string;
  care: string;
  delivery: string;
};

export const products: Product[] = [
  {
    slug: "chrome-signet",
    number: "01",
    name: "CHROME SIGNET",
    price: 650,
    category: "RINGS",
    image: ring,
    specs: ["Polished metal", "Adjustable", "Unisex"],
    description:
      "A heavy signet cast in polished metal. Distorted relief, mirror shoulders, built to catch light in dark rooms.",
    details: "Polished stainless alloy. Hand-finished relief face. Weight approx. 14g.",
    size: "Adjustable band, fits most. Face width 17mm.",
    care: "Wipe with a dry cloth. Keep away from perfume and water.",
    delivery: "Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.",
  },
  {
    slug: "molten-curb-chain",
    number: "02",
    name: "MOLTEN CURB CHAIN",
    price: 1250,
    category: "CHAINS",
    image: chain,
    specs: ["Polished metal", "Lobster clasp", "Unisex"],
    description:
      "Flattened curb links with a molten finish and a star charm terminal. Worn tight or long.",
    details: "Polished stainless alloy links, 8mm gauge, star charm terminal.",
    size: "Length 50cm. Adjustable 5cm extender.",
    care: "Wipe with a dry cloth. Store flat and dry.",
    delivery: "Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.",
  },
  {
    slug: "gothic-cross-bracelet",
    number: "03",
    name: "GOTHIC CROSS BRACELET",
    price: 890,
    category: "BRACELETS",
    image: bracelet,
    specs: ["Polished metal", "Adjustable", "Unisex"],
    description:
      "Interlocked chrome links broken by an ornamental cross station. Vintage metal, afterdark form.",
    details: "Polished stainless alloy. Cross station 14mm. Weight approx. 22g.",
    size: "Length 20cm, adjustable to 18cm.",
    care: "Wipe with a dry cloth. Remove before showering.",
    delivery: "Dhaka 1-2 days. Outside Dhaka 2-4 days. Cash on delivery available.",
  },
];

export const categories: { name: Category; slug: string; image: string; count: number }[] = [
  { name: "RINGS", slug: "rings", image: ring, count: 1 },
  { name: "CHAINS", slug: "chains", image: chain, count: 1 },
  { name: "BRACELETS", slug: "bracelets", image: bracelet, count: 1 },
];

export const upcomingCategories = ["EARRINGS", "PANT CHAINS", "CHROME GLASSES"];

export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const WHATSAPP_NUMBER = "8801000000000";