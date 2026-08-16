import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — ZZERKOFF" },
      { name: "description", content: "Website ordering terms for ZZERKOFF." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyLayout label="ZZ / POLICY" title="TERMS" intro="By placing a website order, you submit the order details for studio review and fulfilment.">
      <PolicySection title="PRODUCT AVAILABILITY">
        <p>Stock can change while customers are shopping. An order can only be placed when the requested quantity is available in the website inventory at checkout.</p>
      </PolicySection>
      <PolicySection title="ORDER DETAILS">
        <p>You are responsible for providing accurate phone, delivery and selection information. Contact the studio promptly if an order detail needs correction.</p>
      </PolicySection>
      <PolicySection title="PRICING & PAYMENT">
        <p>The website calculates the order total from the current product price and quantity. A manual mobile-wallet transaction is treated as pending until the studio verifies it.</p>
      </PolicySection>
      <PolicySection title="CANCELLATION & DELIVERY">
        <p>Order status is managed by the studio. A cancellation may release reserved inventory back to stock. Delivery remains subject to address confirmation and courier availability.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
