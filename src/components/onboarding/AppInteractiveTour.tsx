"use client";

import { useEffect, useRef } from "react";
import { useAppTour } from "@/hooks/useAppTour";
import { markOnboardingDone } from "@/lib/onboardingStorage";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
  active: boolean;
  onDone: () => void;
};

/** Lance la visite guidée interactive (surlignage + Suivant) dans l’interface réelle. */
export default function AppInteractiveTour({ active, onDone }: Props) {
  const user = useAuthStore((s) => s.user);
  const { startTour, stopTour } = useAppTour();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active || !user?.id) {
      startedRef.current = false;
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    const timer = window.setTimeout(() => {
      startTour(user.role, () => {
        markOnboardingDone(user.id);
        onDone();
      });
    }, 400);

    return () => {
      window.clearTimeout(timer);
      stopTour();
    };
  }, [active, onDone, startTour, stopTour, user?.id, user?.role]);

  return null;
}
