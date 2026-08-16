import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — ZZERKOFF" },
      { name: "description", content: "Shipping and delivery information for ZZERKOFF orders." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/shipping" }],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PolicyLayout label="ZZ / POLICY" title="SHIPPING & DELIVERY" intro="How ZZERKOFF prepares, confirms and delivers orders.">
      <PolicySection title="ORDER CONFIRMATION">
        <p>Orders are reviewed by the studio after checkout. We may contact the phone number provided to confirm delivery details before dispatch.</p>
      </PolicySection>
      <PolicySection title="DELIVERY TIME">
        <p>Delivery estimates shown on the product page or during communication are estimates, not guaranteed arrival times. Timing can vary by destination, courier availability and external conditions.</p>
      </PolicySection>
      <PolicySection title="ADDRESS & LOCATION">
        <p>Please provide a complete delivery address. Sharing your current map location is optional and is used only to help identify the delivery point.</p>
      </PolicySection>
      <PolicySection title="ORDER STATUS">
        <p>Use the Track Order page with your order number and the same phone number used at checkout to see the latest status recorded by the studio.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
