import { useState, useEffect } from "react";
import Lenis from "lenis";
import { BootSequence } from "@/components/sections/BootSequence";
import { HeroSection } from "@/components/sections/HeroSection";
import { LogicGatesSection } from "@/components/sections/LogicGatesSection";
import { ContentMarquee } from "@/components/sections/ContentMarquee";
import { TechStackSection } from "@/components/sections/TechStackSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
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
        duration: 1.8,
        easing: (t) => {
          // Custom easing with more "resistance" - heavier brutalist feel
          return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
        },
        smoothWheel: true,
        wheelMultiplier: 0.8,
        touchMultiplier: 1.5,
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

  const handleAcceptTransfer = () => {
    setShowExitIntent(false);
    // Scroll to newsletter section
    setTimeout(() => {
      const newsletter = document.getElementById("newsletter");
      newsletter?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

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
            <section id="testimonials">
              <TestimonialsSection />
            </section>
            <FooterSection />
            <MobileCommandCenter />
          </main>
        </ScrollReactiveGrid>
      )}

      {/* Exit Intent Overlay - rendered outside scroll container */}
      <ExitIntentOverlay
        isOpen={showExitIntent}
        onAccept={handleAcceptTransfer}
        onDismiss={handleDisconnect}
      />
    </>
  );
};

export default Index;
