import { describe, expect, it } from "vitest";
import {
  computeContratDashboardStats,
  getContratStatus,
  getProgressColor,
  getContratStatutNote,
  isContratASurveiller,
  isContratEcheanceProche,
  isContratEnDepassement,
  isContratInactif,
  matchesContratInsightFilter,
  matchesMontantHtRange,
} from "./contratAnalytics";

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

  it("computeContratDashboardStats agrège volumes et statuts", () => {
    const stats = computeContratDashboardStats([
      {
        statut: "ACTIF",
        quantite_contractuelle: 100,
        quantite_realisee: 90,
        montant_ht: 50000,
        date_fin: "2099-12-31",
      },
      {
        statut: "EXPIRE",
        quantite_contractuelle: 50,
        quantite_realisee: 60,
        montant_ht: null,
      },
    ]);
    expect(stats.total).toBe(2);
    expect(stats.actifs).toBe(1);
    expect(stats.expires).toBe(1);
    expect(stats.inactifs).toBe(1);
    expect(stats.aSurveiller).toBe(1);
    expect(stats.totalContractuel).toBe(150);
    expect(stats.totalRealise).toBe(150);
    expect(stats.realisation).toBe(100);
    expect(stats.enDepassement).toBe(1);
    expect(stats.montantHtEngage).toBe(50000);
  });

  it("filtres insight détectent les cas métier", () => {
    const actifPresquePlein = {
      statut: "ACTIF" as const,
      quantite_contractuelle: 100,
      quantite_realisee: 85,
      date_fin: "2099-12-31",
    };
    const depasse = {
      statut: "ACTIF" as const,
      quantite_contractuelle: 100,
      quantite_realisee: 110,
    };
    const suspendu = { statut: "SUSPENDU" as const };

    expect(isContratASurveiller(actifPresquePlein)).toBe(true);
    expect(isContratEnDepassement(depasse)).toBe(true);
    expect(isContratInactif(suspendu)).toBe(true);
    expect(
      matchesContratInsightFilter(depasse, "DEPASSEMENT")
    ).toBe(true);
    expect(
      matchesContratInsightFilter(actifPresquePlein, "SURVEILLER")
    ).toBe(true);
    expect(
      matchesContratInsightFilter(suspendu, "INACTIFS")
    ).toBe(true);
  });

  it("isContratEcheanceProche respecte la fenêtre de 30 jours", () => {
    const ref = new Date("2026-06-01");
    ref.setHours(0, 0, 0, 0);
    expect(
      isContratEcheanceProche(
        { statut: "ACTIF", date_fin: "2026-06-20" },
        ref
      )
    ).toBe(true);
    expect(
      isContratEcheanceProche(
        { statut: "ACTIF", date_fin: "2026-08-01" },
        ref
      )
    ).toBe(false);
  });
});
