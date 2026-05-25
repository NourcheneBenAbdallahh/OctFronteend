import { describe, expect, it } from "vitest";
import type { Stock } from "@/types/stock";
import {
  applyStockFilters,
  computeStocksStats,
  EMPTY_STOCK_FILTERS,
  paginateRows,
  stockTotalPages,
} from "./stock.filters";

function row(partial: Partial<Stock>): Stock {
  return {
    id: "1",
    entrepot_id: "10",
    emballage_id: "20",
    date_stock: "2026-05-15T10:00:00",
    quantite: 10,
    sens: "entree",
    entrepot: { id: "10", nom: "Tunis" },
    emballage: { id: "20", name: "Sac", code: "SAC-1" },
    user: { id: "30", name: "Alice", email: "alice@test.com" },
    ...partial,
  };
}

describe("stock.filters", () => {
  const data: Stock[] = [
    row({ id: "1", sens: "entree", quantite: 10, lot: { id: "99", code_lot: "LOT-A" } }),
    row({
      id: "2",
      sens: "sortie",
      quantite: 3,
      entrepot_id: "11",
      entrepot: { id: "11", nom: "Sfax" },
      emballage_id: "21",
      emballage: { id: "21", name: "Carton", code: "CTN-1" },
      date_stock: "2026-05-20T10:00:00",
    }),
    row({
      id: "3",
      sens: "entree",
      quantite: 50,
      user_id: "31",
      user: { id: "31", name: "Bob", email: "bob@test.com" },
      date_stock: "2026-04-01T10:00:00",
    }),
  ];

  it("filtre par recherche, entrepôt, sens et dates", () => {
    const out = applyStockFilters(data, {
      ...EMPTY_STOCK_FILTERS,
      search: "lot-a",
      entrepot: "10",
      sens: "entree",
      dateFrom: "2026-05-01",
      dateTo: "2026-05-31",
    });
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("1");
  });

  it("filtre par emballage et utilisateur", () => {
    expect(
      applyStockFilters(data, { ...EMPTY_STOCK_FILTERS, emballage: "21" })
    ).toHaveLength(1);
    expect(
      applyStockFilters(data, { ...EMPTY_STOCK_FILTERS, user: "31" })
    ).toHaveLength(1);
  });

  it("trie par quantité décroissante", () => {
    const out = applyStockFilters(data, {
      ...EMPTY_STOCK_FILTERS,
      sort: "quantite_desc",
    });
    expect(out.map((r) => r.id)).toEqual(["3", "1", "2"]);
  });

  it("paginate les lignes filtrées", () => {
    const filtered = applyStockFilters(data, EMPTY_STOCK_FILTERS);
    expect(paginateRows(filtered, 1, 2)).toHaveLength(2);
    expect(paginateRows(filtered, 2, 2)).toHaveLength(1);
    expect(stockTotalPages(filtered.length, 2)).toBe(2);
  });

  it("calcule les statistiques entrées, sorties et mouvements du jour", () => {
    const today = new Date().toISOString();
    const stats = computeStocksStats([
      row({ id: "1", sens: "entree", quantite: 10, date_stock: today }),
      row({ id: "2", sens: "sortie", quantite: 4, date_stock: today }),
      row({ id: "3", sens: "entree", quantite: 5, date_stock: "2020-01-01T00:00:00" }),
    ]);
    expect(stats.totalMouvements).toBe(3);
    expect(stats.totalEntrees).toBe(15);
    expect(stats.totalSorties).toBe(4);
    expect(stats.mouvementsToday).toBe(2);
  });
});
