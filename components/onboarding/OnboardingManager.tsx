"use client";

import { useState } from "react";
import { WelcomeScreens } from "./WelcomeScreens";
import { SpotlightTour }  from "./SpotlightTour";

export function OnboardingManager() {
  const [stage, setStage] = useState<"welcome" | "tour" | "done">(() => {
    if (typeof window === "undefined") return "done";
    return localStorage.getItem("tonmirror-onboarded") ? "done" : "welcome";
  });

  if (stage === "done") return null;

  if (stage === "welcome") {
    return (
      <WelcomeScreens
        onComplete={() => setStage("tour")}
      />
    );
  }

  return (
    <SpotlightTour
      onComplete={() => {
        localStorage.setItem("tonmirror-onboarded", "1");
        setStage("done");
      }}
    />
  );
}
