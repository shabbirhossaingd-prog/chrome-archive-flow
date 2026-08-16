import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns & Exchanges — ZZERKOFF" },
      { name: "description", content: "Returns and exchange guidance for ZZERKOFF objects." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/returns" }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <PolicyLayout label="ZZ / POLICY" title="RETURNS & EXCHANGES" intro="If there is an issue with an object, contact the studio as soon as possible with your order number.">
      <PolicySection title="ELIGIBILITY">
        <p>Return or exchange eligibility depends on the item condition, the reason for the request and whether the object can be safely resold. Worn, altered or damaged items may not be eligible unless the issue was present on delivery.</p>
      </PolicySection>
      <PolicySection title="WRONG OR DAMAGED ITEM">
        <p>If you receive an incorrect or damaged object, keep the packaging and contact ZZERKOFF with the order number and clear photos so the studio can review the issue.</p>
      </PolicySection>
      <PolicySection title="SIZE / FIT">
        <p>Check the product size information before ordering. Exchange availability can depend on remaining stock.</p>
      </PolicySection>
      <PolicySection title="HOW TO REQUEST">
        <p>Use the Contact page, WhatsApp or email and include your order number. The studio will confirm the available resolution before an item is sent back.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
