import { useState, useEffect } from "react";
import Lenis from "lenis";
import { BootSequence } from "@/components/sections/BootSequence";
import { HeroSection } from "@/components/sections/HeroSection";
import { LogicGatesSection } from "@/components/sections/LogicGatesSection";
import { ContentMarquee } from "@/components/sections/ContentMarquee";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { FooterSection } from "@/components/sections/FooterSection";
import { MobileCommandCenter } from "@/components/navigation/MobileCommandCenter";
import { ScrollReactiveGrid } from "@/components/effects/ScrollReactiveGrid";
import { ExitIntentOverlay } from "@/components/effects/ExitIntentOverlay";
import { useExitIntent } from "@/hooks/useExitIntent";

const Index = () => {
  const [isBooted, setIsBooted] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);

  // Exit intent hook - only active after boot sequence
  useExitIntent({
    enabled: isBooted,
    onTrigger: () => setShowExitIntent(true),
  });

  useEffect(() => {
    if (isBooted) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo-out for smooth deceleration
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0,
        syncTouch: false,
        syncTouchLerp: 0.075,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, [isBooted]);

  const handleDisconnect = () => {
    setShowExitIntent(false);
  };

  return (
    <>
      {!isBooted && <BootSequence onComplete={() => setIsBooted(true)} />}

      {isBooted && (
        <ScrollReactiveGrid className="min-h-screen">
          <main className="relative bg-background min-h-screen">
            <HeroSection />
            <LogicGatesSection />
            <ContentMarquee />
            <TechStackSection />
            <section id="newsletter">
              <NewsletterSection />
            </section>
            <FooterSection />
            <MobileCommandCenter />
          </main>
        </ScrollReactiveGrid>
      )}

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
