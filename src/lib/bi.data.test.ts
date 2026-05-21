import { describe, expect, it } from "vitest";
import type { Stock } from "@/types/stock";
import type { Commande } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import {
  aggregateByEntrepot,
  buildActivitySeries56,
  buildDailySeries,
  commandesByStatut,
  computeAlertesSeuil,
  computeBiModel,
  facturesAvecRetardSurPeriode,
  facturesByStatut,
  facturesEncoursSurPeriode,
  facturesMontantHtSurPeriode,
  facturesPenalitesSurPeriode,
  filterStocksByEntrepot,
  formatDelta,
  getDataTimeBounds,
  paretoLine,
  previousPeriod,
  resolvePeriodRange,
  toLocalYmd,
  topBusyDays,
  topEmballages,
  uniqueEntrepotNames,
} from "./bi.data";

function stock(partial: Partial<Stock> & Pick<Stock, "quantite" | "sens">): Stock {
  return {
    id: "1",
    entrepot_id: "1",
    emballage_id: "1",
    date_stock: "2026-01-15T10:00:00Z",
    ...partial,
  };
}

describe("toLocalYmd", () => {
  it("formate en YYYY-MM-DD local", () => {
    expect(toLocalYmd(new Date(2026, 4, 20))).toBe("2026-05-20");
  });
});

describe("getDataTimeBounds", () => {
  it("retourne null si liste vide", () => {
    expect(getDataTimeBounds([])).toBeNull();
  });

  it("calcule min et max", () => {
    const bounds = getDataTimeBounds([
      stock({ quantite: 1, sens: "entree", date_stock: "2026-01-01" }),
      stock({ quantite: 1, sens: "entree", date_stock: "2026-06-01" }),
    ]);
    expect(bounds).not.toBeNull();
    expect(bounds!.min.getFullYear()).toBe(2026);
  });
});

describe("resolvePeriodRange", () => {
  it("retourne 7 jours calendaires pour la clé 7d", () => {
    const anchor = new Date(2026, 4, 20, 15, 0, 0);
    const { start, end } = resolvePeriodRange("7d", anchor, null);
    expect(toLocalYmd(start)).toBe("2026-05-14");
    expect(toLocalYmd(end)).toBe("2026-05-20");
  });
});

describe("filterStocksByEntrepot", () => {
  const rows = [
    stock({
      quantite: 1,
      sens: "entree",
      entrepot: { id: 1, nom: "Tunis" },
    }),
    stock({
      quantite: 1,
      sens: "entree",
      entrepot: { id: 2, nom: "Sfax" },
    }),
  ];

  it("retourne tout pour all", () => {
    expect(filterStocksByEntrepot(rows, "all")).toHaveLength(2);
  });

  it("filtre par nom entrepôt", () => {
    expect(filterStocksByEntrepot(rows, "Tunis")).toHaveLength(1);
  });
});

describe("uniqueEntrepotNames", () => {
  it("liste triée sans doublons", () => {
    const names = uniqueEntrepotNames([
      stock({ quantite: 1, sens: "entree", entrepot: { id: 1, nom: "B" } }),
      stock({ quantite: 1, sens: "entree", entrepot: { id: 2, nom: "A" } }),
      stock({ quantite: 1, sens: "entree", entrepot: { id: 3, nom: "B" } }),
    ]);
    expect(names).toEqual(["A", "B"]);
  });
});

describe("computeAlertesSeuil", () => {
  it("compte les emballages dont le stock net est sous le seuil", () => {
    const count = computeAlertesSeuil(
      [
        stock({
          quantite: 80,
          sens: "sortie",
          emballage: { id: 1, name: "Sac", min_stock: 100 },
        }),
        stock({
          quantite: 200,
          sens: "entree",
          emballage: { id: 2, name: "Carton", min_stock: 50 },
        }),
      ],
      500
    );
    expect(count).toBe(1);
  });
});

describe("formatDelta", () => {
  it("affiche la variation en pourcentage", () => {
    expect(formatDelta(110, 100)).toBe("+10%");
    expect(formatDelta(90, 100)).toBe("-10%");
  });

  it("retourne tiret si précédent nul", () => {
    expect(formatDelta(10, 0)).toBe("—");
    expect(formatDelta(0, 0)).toBe("0%");
  });
});

describe("previousPeriod", () => {
  it("recule d'une période de même durée", () => {
    const start = new Date(2026, 4, 10);
    const end = new Date(2026, 4, 20, 23, 59, 59);
    const prev = previousPeriod(start, end);
    expect(prev.end.getTime()).toBeLessThan(start.getTime());
    expect(prev.start.getTime()).toBeLessThan(prev.end.getTime());
  });
});

describe("buildDailySeries", () => {
  it("agrège entrées et sorties par jour", () => {
    const start = new Date(2026, 4, 10);
    const end = new Date(2026, 4, 12);
    const series = buildDailySeries(
      [
        stock({ quantite: 10, sens: "entree", date_stock: "2026-05-11" }),
        stock({ quantite: 3, sens: "sortie", date_stock: "2026-05-11" }),
      ],
      start,
      end
    );
    const may11 = series.find((d) => d.day === "2026-05-11");
    expect(may11?.entrees).toBe(10);
    expect(may11?.sorties).toBe(3);
  });
});

describe("aggregateByEntrepot et topEmballages", () => {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31, 23, 59, 59);
  const rows = [
    stock({
      quantite: 5,
      sens: "entree",
      date_stock: "2026-03-01",
      entrepot: { id: 1, nom: "Tunis" },
      emballage: { id: 1, name: "Sac" },
    }),
    stock({
      quantite: 2,
      sens: "sortie",
      date_stock: "2026-03-02",
      entrepot: { id: 1, nom: "Tunis" },
      emballage: { id: 2, name: "Carton" },
    }),
  ];

  it("aggregateByEntrepot cumule par entrepôt", () => {
    const agg = aggregateByEntrepot(rows, start, end);
    expect(agg[0].name).toBe("Tunis");
    expect(agg[0].entrees).toBe(5);
    expect(agg[0].sorties).toBe(2);
  });

  it("topEmballages limite le nombre de lignes", () => {
    expect(topEmballages(rows, start, end, 1)).toHaveLength(1);
  });

  it("paretoLine calcule le cumul", () => {
    const splits = topEmballages(rows, start, end, 5);
    const pareto = paretoLine(splits);
    expect(pareto[pareto.length - 1].cumulPct).toBe(100);
  });
});

describe("commandesByStatut", () => {
  it("compte par statut dans la période", () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 11, 31, 23, 59, 59);
    const stats = commandesByStatut(
      [
        { date_commande: "2026-04-01", statut: "VALIDEE" } as Commande,
        { date_commande: "2026-04-02", statut: "VALIDEE" } as Commande,
      ],
      start,
      end
    );
    expect(stats.find((s) => s.statut === "VALIDEE")?.count).toBe(2);
  });
});

describe("factures BI helpers", () => {
  const start = new Date(2026, 0, 1);
  const end = new Date(2026, 11, 31, 23, 59, 59);
  const factures = [
    {
      date_facture: "2026-04-01",
      statut: "VALIDE",
      montant_ttc: 100,
      montant_ht: 80,
      montant_penalites: 5,
      jours_retard_total: 2,
    },
    {
      date_facture: "2026-04-02",
      statut: "PAYE",
      montant_ttc: 50,
      montant_ht: 40,
      montant_penalites: 0,
      jours_retard_total: 0,
    },
    {
      date_facture: "2026-04-03",
      statut: "ANNULE",
      montant_ttc: 999,
      montant_ht: 0,
      montant_penalites: 0,
      jours_retard_total: 0,
    },
  ] as Facture[];

  it("facturesByStatut agrège TTC", () => {
    const stats = facturesByStatut(factures, start, end);
    expect(stats.some((s) => s.statut === "VALIDE" && s.montantTtc === 100)).toBe(
      true
    );
  });

  it("facturesEncoursSurPeriode ignore PAYE et ANNULE", () => {
    const encours = facturesEncoursSurPeriode(factures, start, end);
    expect(encours.encoursCount).toBe(1);
    expect(encours.encoursTtc).toBe(100);
  });

  it("facturesPenalitesSurPeriode et montant HT", () => {
    expect(facturesPenalitesSurPeriode(factures, start, end)).toBe(5);
    expect(facturesMontantHtSurPeriode(factures, start, end)).toBe(120);
  });

  it("facturesAvecRetardSurPeriode compte les retards", () => {
    const retard = facturesAvecRetardSurPeriode(factures, start, end);
    expect(retard.count).toBe(1);
    expect(retard.ttc).toBe(100);
  });
});

describe("computeBiModel", () => {
  it("assemble KPIs et séries pour une période", () => {
    const anchor = new Date(2026, 4, 20);
    const model = computeBiModel(
      [
        stock({
          quantite: 5,
          sens: "entree",
          date_stock: "2026-05-15",
          entrepot: { id: 1, nom: "Tunis" },
        }),
      ],
      [{ date_commande: "2026-05-10", statut: "VALIDEE" } as Commande],
      [
        {
          date_facture: "2026-05-12",
          statut: "VALIDE",
          montant_ttc: 100,
          montant_ht: 80,
          montant_penalites: 0,
          jours_retard_total: 0,
        } as Facture,
      ],
      "30d",
      anchor
    );
    expect(model.kpis.mouvements).toBeGreaterThanOrEqual(1);
    expect(model.daily.length).toBeGreaterThan(0);
    expect(model.activity56).toHaveLength(56);
    expect(model.prevKpis).not.toBeNull();
  });
});

describe("buildActivitySeries56", () => {
  it("produit 56 points et topBusyDays les trie", () => {
    const end = new Date(2026, 4, 20);
    const activity = buildActivitySeries56(
      [
        stock({ quantite: 1, sens: "entree", date_stock: "2026-05-20" }),
        stock({ quantite: 1, sens: "entree", date_stock: "2026-05-20" }),
      ],
      end
    );
    expect(activity).toHaveLength(56);
    const busy = topBusyDays(activity, 3);
    expect(busy[0]?.count).toBeGreaterThanOrEqual(busy[1]?.count ?? 0);
  });
});
