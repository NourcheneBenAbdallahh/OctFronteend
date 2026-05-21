/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, beforeEach } from "vitest";
import { computeViewportAnchoredDropdown } from "./dropdownViewportPosition";

describe("computeViewportAnchoredDropdown", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { value: 800, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 600, configurable: true });
  });

  it("place le panneau en dessous si plus de place", () => {
    const trigger = {
      left: 100,
      right: 300,
      top: 200,
      bottom: 220,
      width: 200,
      height: 20,
    } as DOMRect;

    const pos = computeViewportAnchoredDropdown(trigger);
    expect(pos.placement).toBe("below");
    if (pos.placement === "below") {
      expect(pos.top).toBeGreaterThan(trigger.bottom);
      expect(pos.maxHeight).toBeGreaterThan(0);
    }
  });

  it("place le panneau au-dessus si peu de place en dessous", () => {
    const trigger = {
      left: 50,
      right: 250,
      top: 500,
      bottom: 520,
      width: 200,
      height: 20,
    } as DOMRect;

    const pos = computeViewportAnchoredDropdown(trigger);
    expect(pos.placement).toBe("above");
  });
});
