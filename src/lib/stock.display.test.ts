import { describe, expect, it } from "vitest";
import type { Stock } from "@/types/stock";
import type { UniteMesure } from "@/types/unite-mesure";
import { formatStockQuantity, stockUnitCode } from "@/lib/stock.display";

const unites: UniteMesure[] = [
  {
    id: "1",
    code: "KG",
    label: "Kilogramme",
    dimension: "masse",
    facteur_vers_kg: 1,
    facteur_vers_l: null,
    sort_order: 20,
  },
  {
    id: "2",
    code: "L",
    label: "Litre",
    dimension: "volume",
    facteur_vers_kg: null,
    facteur_vers_l: 1,
    sort_order: 50,
  },
];

const baseStock = (overrides: Partial<Stock> = {}): Stock => ({
  id: 1,
  entrepot_id: 1,
  emballage_id: 1,
  date_stock: "2026-05-15T10:00:00",
  quantite: 27,
  sens: "sortie",
  ...overrides,
});

describe("stock.display", () => {
  it("résout l'unité depuis capacity_unit de l'emballage", () => {
    const stock = baseStock({
      emballage: { id: 1, name: "Sac", code: "SAC", capacity_unit: "KG" },
    });
    expect(stockUnitCode(stock, unites)).toBe("KG");
    expect(formatStockQuantity(stock, unites)).toBe("27 KG");
  });

  it("affiche L pour un fut plastique", () => {
    const stock = baseStock({
      quantite: 400,
      emballage: { id: 2, name: "Fut", code: "FUT", capacity_unit: "L" },
    });
    expect(formatStockQuantity(stock, unites)).toBe("400 L");
  });
});
