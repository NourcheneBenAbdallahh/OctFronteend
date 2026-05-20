import { describe, expect, it } from "vitest";
import type { Stock } from "@/types/stock";
import {
  computeAlertesSeuil,
  filterStocksByEntrepot,
  getDataTimeBounds,
  resolvePeriodRange,
  toLocalYmd,
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
