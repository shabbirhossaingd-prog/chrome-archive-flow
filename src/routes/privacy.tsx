import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — ZZERKOFF" },
      { name: "description", content: "Privacy information for ZZERKOFF website orders." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyLayout label="ZZ / POLICY" title="PRIVACY" intro="This page explains the information used to process website orders and support requests.">
      <PolicySection title="ORDER INFORMATION">
        <p>When you order, the website can collect your name, phone number, delivery address, selected product details, quantity, optional note and optional map location.</p>
      </PolicySection>
      <PolicySection title="PAYMENT INFORMATION">
        <p>For enabled manual bKash or Nagad payments, the website may record the payment method and transaction ID for manual verification. ZZERKOFF does not ask for your wallet PIN or OTP.</p>
      </PolicySection>
      <PolicySection title="HOW INFORMATION IS USED">
        <p>Order information is used to confirm, prepare, deliver, support and track your order. Public order tracking requires both the order number and matching phone number and does not display your delivery address or transaction ID.</p>
      </PolicySection>
      <PolicySection title="CONTACT">
        <p>If you have a privacy question about an order, contact ZZERKOFF through the Contact page and include the order number when relevant.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
