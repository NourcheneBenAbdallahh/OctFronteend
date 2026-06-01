import { describe, expect, it } from "vitest";
import { getContratStatus, getProgressColor, getContratStatutNote, matchesMontantHtRange } from "./contratAnalytics";

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

  it("getContratStatutNote utilise la note personnalisée ou la suggestion", () => {
    expect(getContratStatutNote("ACTIF", "Note interne")).toBe("Note interne");
    expect(getContratStatutNote("SUSPENDU")).toContain("suspendu");
  });

  it("matchesMontantHtRange filtre par plage HT", () => {
    expect(matchesMontantHtRange(50000, "10000", "100000")).toBe(true);
    expect(matchesMontantHtRange(5000, "10000", "")).toBe(false);
    expect(matchesMontantHtRange(500000, "", "100000")).toBe(false);
  });
});
