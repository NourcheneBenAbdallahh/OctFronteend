const PENDING_KEY = "oct-onboarding-pending";
const DONE_PREFIX = "oct-onboarding-done:";

export function setOnboardingPending(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_KEY, userId);
}

export function clearOnboardingPending(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_KEY);
}

export function isOnboardingPendingForUser(userId: string | undefined | null): boolean {
  if (typeof window === "undefined" || !userId) return false;
  return localStorage.getItem(PENDING_KEY) === userId;
}

export function markOnboardingDone(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${DONE_PREFIX}${userId}`, "1");
  clearOnboardingPending();
}

export function hasCompletedOnboarding(userId: string | undefined | null): boolean {
  if (typeof window === "undefined" || !userId) return false;
  return localStorage.getItem(`${DONE_PREFIX}${userId}`) === "1";
}
