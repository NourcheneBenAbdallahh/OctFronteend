"use client";

import { useCallback, useEffect, useState } from "react";
import {
  hasCompletedOnboarding,
  isOnboardingPendingForUser,
} from "@/lib/onboardingStorage";
import { useAuthStore } from "@/store/useAuthStore";

export function useFirstLoginOnboarding() {
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setIsOpen(false);
      return;
    }
    if (hasCompletedOnboarding(userId)) {
      setIsOpen(false);
      return;
    }
    if (isOnboardingPendingForUser(userId)) {
      setIsOpen(true);
    }
  }, [isAuthenticated, userId]);

  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, close };
}
