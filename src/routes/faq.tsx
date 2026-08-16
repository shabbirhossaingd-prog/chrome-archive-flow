import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — ZZERKOFF" },
      { name: "description", content: "Frequently asked questions about ZZERKOFF orders and objects." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/faq" }],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PolicyLayout label="ZZ / SUPPORT" title="FREQUENTLY ASKED QUESTIONS" intro="Essential information about ordering, payment, stock and delivery.">
      <PolicySection title="HOW DO I ORDER?">
        <p>Open an available object, select the available size or finish, choose quantity and use Place Order.</p>
      </PolicySection>
      <PolicySection title="HOW DO I TRACK AN ORDER?">
        <p>Open Track Order and enter your ZZERKOFF order number plus the same phone number used during checkout.</p>
      </PolicySection>
      <PolicySection title="WHAT PAYMENT METHODS ARE AVAILABLE?">
        <p>The checkout only displays payment methods currently enabled by the studio. Manual mobile-wallet payments require the transaction ID shown after Send Money.</p>
      </PolicySection>
      <PolicySection title="CAN SOLD-OUT OBJECTS RETURN?">
        <p>Some objects may be restocked and others may remain archive-only. Use the available restock/contact option on the object page when shown.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
