import { createFileRoute } from "@tanstack/react-router";
import { PolicyLayout, PolicySection } from "@/components/site/PolicyLayout";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size Guide — ZZERKOFF" },
      { name: "description", content: "Sizing guidance for ZZERKOFF rings, chains and accessories." },
    ],
    links: [{ rel: "canonical", href: "https://zzerkoff.vercel.app/size-guide" }],
  }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <PolicyLayout label="ZZ / GUIDE" title="SIZE GUIDE" intro="Use the measurements shown on each object page first. Product-specific sizing always takes priority over general guidance.">
      <PolicySection title="RINGS">
        <p>For adjustable rings, fit range depends on the individual design. For fixed-size rings, compare the listed internal diameter or circumference with a ring that already fits you.</p>
      </PolicySection>
      <PolicySection title="CHAINS & BRACELETS">
        <p>Compare the listed length with a chain or bracelet you already own. Consider whether you want a close or relaxed fit before selecting a size.</p>
      </PolicySection>
      <PolicySection title="NEED HELP?">
        <p>If a product page does not give enough information, contact ZZERKOFF with the object code before placing the order.</p>
      </PolicySection>
    </PolicyLayout>
  );
}
