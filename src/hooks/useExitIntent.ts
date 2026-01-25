import { useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "exitIntent_lastShown";
const COOLDOWN_DAYS = 7;
const INIT_DELAY_MS = 2000;

interface UseExitIntentOptions {
  enabled: boolean;
  onTrigger: () => void;
}

const shouldShowIntent = (): boolean => {
  const lastShown = localStorage.getItem(STORAGE_KEY);
  if (!lastShown) return true;

  const daysSinceShown =
    (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
  return daysSinceShown >= COOLDOWN_DAYS;
};

export const markExitIntentShown = (): void => {
  localStorage.setItem(STORAGE_KEY, Date.now().toString());
};

export const useExitIntent = ({ enabled, onTrigger }: UseExitIntentOptions) => {
  const hasTriggered = useRef(false);
  const isInitialized = useRef(false);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when cursor leaves from the top of the viewport
      if (e.clientY > 0) return;

      // Prevent multiple triggers
      if (hasTriggered.current) return;

      // Check if we should show based on cooldown
      if (!shouldShowIntent()) return;

      hasTriggered.current = true;
      onTrigger();
    },
    [onTrigger]
  );

  useEffect(() => {
    if (!enabled) return;

    // Check if touch device - disable exit intent on mobile
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    // Delay initialization to prevent accidental triggers on page load
    const initTimer = setTimeout(() => {
      isInitialized.current = true;
    }, INIT_DELAY_MS);

    const wrappedHandler = (e: MouseEvent) => {
      if (!isInitialized.current) return;
      handleMouseLeave(e);
    };

    document.addEventListener("mouseleave", wrappedHandler);

    return () => {
      clearTimeout(initTimer);
      document.removeEventListener("mouseleave", wrappedHandler);
    };
  }, [enabled, handleMouseLeave]);
};
