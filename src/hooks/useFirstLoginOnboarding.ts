"use client";

import { useCallback, useState } from "react";
import {
  hasCompletedOnboarding,
  isOnboardingPendingForUser,
} from "@/lib/onboardingStorage";
import { useAuthStore } from "@/store/useAuthStore";

export function useFirstLoginOnboarding() {
  const userId = useAuthStore((s) => s.user?.id);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [dismissedForUserId, setDismissedForUserId] = useState<string | null>(
    null
  );

  const shouldShow =
    Boolean(isAuthenticated && userId) &&
    !hasCompletedOnboarding(userId!) &&
    isOnboardingPendingForUser(userId!);
  const isOpen = shouldShow && dismissedForUserId !== userId;

  const close = useCallback(
    () => setDismissedForUserId(userId ?? null),
    [userId]
  );

  return { isOpen, close };
}
