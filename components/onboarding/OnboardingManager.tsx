"use client";

import { useState, useEffect } from "react";
import { WelcomeScreens } from "./WelcomeScreens";
import { SpotlightTour }  from "./SpotlightTour";

/** localStorage key — single source of truth */
export const ONBOARDED_KEY = "tonmirror-onboarded";

export function OnboardingManager() {
  // Default to "done" on SSR/first paint to avoid hydration mismatch.
  // Promote to "welcome" on the client if the key is absent.
  const [stage, setStage] = useState<"welcome" | "tour" | "done">("done");

  useEffect(() => {
    if (!localStorage.getItem(ONBOARDED_KEY)) {
      setStage("welcome");
    }
  }, []);

  if (stage === "done") return null;

  if (stage === "welcome") {
    return <WelcomeScreens onComplete={() => setStage("tour")} />;
  }

  return (
    <SpotlightTour
      onComplete={() => {
        localStorage.setItem(ONBOARDED_KEY, "1");
        setStage("done");
      }}
    />
  );
}
