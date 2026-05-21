import { describe, expect, it } from "vitest";
import { getContratStatus, getProgressColor } from "./contratAnalytics";

describe("contratAnalytics", () => {
  it("getContratStatus détecte dépassement", () => {
    const status = getContratStatus({
      quantite_realisee: 120,
      quantite_contractuelle: 100,
    });
    expect(status.label).toBe("Dépassement");
    expect(status.color).toContain("red");
  });

  it("getContratStatus retourne Normal en dessous de 80%", () => {
    const status = getContratStatus({
      quantite_realisee: 50,
      quantite_contractuelle: 100,
    });
    expect(status.label).toBe("Normal");
    expect(status.color).toContain("green");
  });

  it("getContratStatus détecte presque atteint", () => {
    const status = getContratStatus({
      quantite_realisee: 85,
      quantite_contractuelle: 100,
    });
    expect(status.label).toBe("Presque atteint");
  });

  it("getProgressColor suit les seuils", () => {
    expect(getProgressColor(100)).toContain("red");
    expect(getProgressColor(85)).toContain("orange");
    expect(getProgressColor(50)).toContain("indigo");
  });
});
