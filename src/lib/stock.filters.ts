import type { Stock, StockFiltersState, StocksStats } from "@/types/stock";
import type { StocksQueryFilters, StockDashboardStatsResult } from "@/lib/stock.api";
import { dateToGraphqlDateTime, dateToGraphqlDateTimeOrNull } from "@/lib/graphqlDateTime";

export const EMPTY_STOCK_FILTERS: StockFiltersState = {
  search: "",
  entrepot: "",
  emballage: "",
  sens: "",
  user: "",
  sort: "recent",
  dateFrom: "",
  dateTo: "",
};

export function applyStockFilters(
  data: Stock[],
  filters: StockFiltersState
): Stock[] {
  let rows = [...data];
  const q = filters.search.trim().toLowerCase();

  if (q) {
    rows = rows.filter((stock) => {
      const entrepot = stock.entrepot?.nom || stock.entrepot?.name || "";
      const emballage = stock.emballage?.name || stock.emballage?.code || "";
      const user = stock.user?.name || stock.user?.email || "";
      const lot = stock.lot?.code_lot || "";

      return (
        entrepot.toLowerCase().includes(q) ||
        emballage.toLowerCase().includes(q) ||
        user.toLowerCase().includes(q) ||
        lot.toLowerCase().includes(q) ||
        String(stock.id).includes(q)
      );
    });
  }

  if (filters.entrepot) {
    rows = rows.filter(
      (stock) => String(stock.entrepot_id) === String(filters.entrepot)
    );
  }

  if (filters.emballage) {
    rows = rows.filter(
      (stock) => String(stock.emballage_id) === String(filters.emballage)
    );
  }

  if (filters.user) {
    rows = rows.filter(
      (stock) => String(stock.user_id) === String(filters.user)
    );
  }

  if (filters.sens) {
    rows = rows.filter((stock) => stock.sens === filters.sens);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    rows = rows.filter((stock) => {
      if (!stock.date_stock) return false;
      return new Date(stock.date_stock) >= from;
    });
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    rows = rows.filter((stock) => {
      if (!stock.date_stock) return false;
      return new Date(stock.date_stock) <= to;
    });
  }

  if (filters.sort === "recent") {
    rows.sort(
      (a, b) =>
        new Date(b.date_stock || 0).getTime() -
        new Date(a.date_stock || 0).getTime()
    );
  } else if (filters.sort === "oldest") {
    rows.sort(
      (a, b) =>
        new Date(a.date_stock || 0).getTime() -
        new Date(b.date_stock || 0).getTime()
    );
  } else if (filters.sort === "quantite_desc") {
    rows.sort((a, b) => Number(b.quantite || 0) - Number(a.quantite || 0));
  } else if (filters.sort === "quantite_asc") {
    rows.sort((a, b) => Number(a.quantite || 0) - Number(b.quantite || 0));
  }

  return rows;
}

export function paginateRows<T>(
  rows: T[],
  page: number,
  pageSize: number
): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function stockTotalPages(rowCount: number, pageSize: number): number {
  return Math.ceil(rowCount / pageSize);
}

export function toStocksServerFilters(
  filters: StockFiltersState
): StocksQueryFilters {
  const toGraphqlEnd = (date: string) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return dateToGraphqlDateTime(d);
  };

  return {
    from: filters.dateFrom
      ? dateToGraphqlDateTime(new Date(filters.dateFrom))
      : null,
    to: filters.dateTo ? toGraphqlEnd(filters.dateTo) : null,
    entrepot_id: filters.entrepot || null,
    emballage_id: filters.emballage || null,
    sens: filters.sens || null,
    user_id: filters.user || null,
    search: filters.search.trim() || null,
    sort: filters.sort || "recent",
  };
}

export function mapDashboardStats(raw: StockDashboardStatsResult): StocksStats {
  return {
    totalMouvements: raw.total_mouvements,
    totalEntrees: raw.total_entrees,
    totalSorties: raw.total_sorties,
    mouvementsToday: raw.mouvements_today,
  };
}

export function computeStocksStats(rows: Stock[]): StocksStats {
  const today = new Date().toDateString();
  return {
    totalMouvements: rows.length,
    totalEntrees: rows
      .filter((r) => r.sens === "entree")
      .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
    totalSorties: rows
      .filter((r) => r.sens === "sortie")
      .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
    mouvementsToday: rows.filter((r) => {
      if (!r.date_stock) return false;
      return new Date(r.date_stock).toDateString() === today;
    }).length,
  };
}
