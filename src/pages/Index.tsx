import { useState } from "react";
import { HeroSection } from "@/components/sections/HeroSection";
import { ConversionSections } from "@/components/sections/ConversionSections";
import { StorefrontSection } from "@/components/sections/StorefrontSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { MobileCommandCenter } from "@/components/navigation/MobileCommandCenter";
import { ScrollReactiveGrid } from "@/components/effects/ScrollReactiveGrid";
import { ExitIntentOverlay } from "@/components/effects/ExitIntentOverlay";
import { useExitIntent } from "@/hooks/useExitIntent";
import { usePageMeta } from "@/hooks/usePageMeta";

const Index = () => {
  const [showExitIntent, setShowExitIntent] = useState(false);

  useExitIntent({
    enabled: true,
    onTrigger: () => setShowExitIntent(true),
  });

  usePageMeta({
    title: "AI Automation for Arkansas Businesses | DREBUILDS",
    description: "DREBUILDS designs AI agents and workflow automation for Arkansas businesses. Automate lead follow-up, documents, reporting, scheduling, and operations. Start with a free audit.",
    canonical: "https://www.drebuilds.online/",
    schema: {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      name: "DREBUILDS",
      url: "https://www.drebuilds.online/",
      telephone: "+1-479-221-0524",
      email: "andrebrassfield@gmail.com",
      areaServed: "Arkansas",
      serviceType: ["AI automation", "Workflow automation", "AI consulting", "Custom AI agents"],
    },
  });

  const handleDisconnect = () => {
    setShowExitIntent(false);
  };

  return (
    <>
      <ScrollReactiveGrid className="min-h-screen">
        <main className="relative min-h-screen bg-background">
          <HeroSection />
          <ConversionSections />
          <StorefrontSection />
          <section id="newsletter"><NewsletterSection /></section>
          <FooterSection />
          <MobileCommandCenter />
        </main>
      </ScrollReactiveGrid>

      {/* Exit Intent Overlay - rendered outside scroll container */}
      <ExitIntentOverlay
        isOpen={showExitIntent}
        onAccept={() => {
          setShowExitIntent(false);
          window.location.assign("/audit");
        }}
        onDismiss={handleDisconnect}
      />
    </>
  );
};

export default Index;
