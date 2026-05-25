/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearOnboardingPending,
  hasCompletedOnboarding,
  isOnboardingPendingForUser,
  markOnboardingDone,
  setOnboardingPending,
} from "./onboardingStorage";

describe("onboardingStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("gère le flux pending → done", () => {
    setOnboardingPending("42");
    expect(isOnboardingPendingForUser("42")).toBe(true);
    expect(hasCompletedOnboarding("42")).toBe(false);

    markOnboardingDone("42");
    expect(isOnboardingPendingForUser("42")).toBe(false);
    expect(hasCompletedOnboarding("42")).toBe(true);
  });

  it("clearOnboardingPending retire le flag", () => {
    setOnboardingPending("1");
    clearOnboardingPending();
    expect(isOnboardingPendingForUser("1")).toBe(false);
  });
});
