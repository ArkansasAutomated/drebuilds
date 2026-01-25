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

const Index = () => {
  const [isBooted, setIsBooted] = useState(false);

  useEffect(() => {
    if (isBooted) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
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

  return (
    <>
      {!isBooted && <BootSequence onComplete={() => setIsBooted(true)} />}
      
      {isBooted && (
        <main className="relative bg-background min-h-screen">
          <HeroSection />
          <LogicGatesSection />
          <ContentMarquee />
          <TechStackSection />
          <NewsletterSection />
          <TestimonialsSection />
          <FooterSection />
        </main>
      )}
    </>
  );
};

export default Index;
