import { describe, expect, it } from "vitest";
import { needsDestination, needsLot, needsSource } from "./mouvement.config";

describe("mouvement.config", () => {
  it("PRD nécessite source et lot", () => {
    expect(needsSource("PRD")).toBe(true);
    expect(needsDestination("PRD")).toBe(false);
    expect(needsLot("PRD")).toBe(true);
  });

  it("CDD nécessite source, destination et lot", () => {
    expect(needsSource("CDD")).toBe(true);
    expect(needsDestination("CDD")).toBe(true);
    expect(needsLot("CDD")).toBe(true);
  });

  it("SPL nécessite destination sans source", () => {
    expect(needsSource("SPL")).toBe(false);
    expect(needsDestination("SPL")).toBe(true);
    expect(needsLot("SPL")).toBe(false);
  });

  it("PTE nécessite source et lot", () => {
    expect(needsSource("PTE")).toBe(true);
    expect(needsDestination("PTE")).toBe(false);
    expect(needsLot("PTE")).toBe(true);
  });

  it("EMC est réservé aux réceptions BL (destination sans source)", () => {
    expect(needsSource("EMC")).toBe(false);
    expect(needsDestination("EMC")).toBe(true);
    expect(needsLot("EMC")).toBe(false);
  });
});
