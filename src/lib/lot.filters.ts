import type { Lot, LotFiltersState } from "@/types/lot";

export const EMPTY_LOT_FILTERS: LotFiltersState = {
  search: "",
  emballage: "",
  user: "",
  commentOnly: false,
  sort: "recent",
  dateFrom: "",
  dateTo: "",
};

export function countActiveLotFilters(filters: LotFiltersState): number {
  let count = 0;
  if (filters.emballage) count += 1;
  if (filters.user) count += 1;
  if (filters.commentOnly) count += 1;
  if (filters.sort !== "recent") count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

export function applyLotFilters(data: Lot[], filters: LotFiltersState): Lot[] {
  let rows = [...data];
  const q = filters.search.trim().toLowerCase();

  if (q) {
    rows = rows.filter((lot) => {
      const emballage =
        lot.emballage?.name || lot.emballage?.code || "";
      const user = lot.user?.name || lot.user?.email || "";
      const commentaire = lot.commentaire || "";

      return (
        (lot.code_lot || "").toLowerCase().includes(q) ||
        emballage.toLowerCase().includes(q) ||
        user.toLowerCase().includes(q) ||
        commentaire.toLowerCase().includes(q) ||
        String(lot.id).includes(q)
      );
    });
  }

  if (filters.emballage) {
    rows = rows.filter(
      (lot) => String(lot.emballage_id) === String(filters.emballage)
    );
  }

  if (filters.user) {
    rows = rows.filter(
      (lot) => String(lot.user_id) === String(filters.user)
    );
  }

  if (filters.commentOnly) {
    rows = rows.filter((lot) => Boolean(lot.commentaire?.trim()));
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    rows = rows.filter((lot) => {
      if (!lot.date_mvt) return false;
      return new Date(lot.date_mvt) >= from;
    });
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    rows = rows.filter((lot) => {
      if (!lot.date_mvt) return false;
      return new Date(lot.date_mvt) <= to;
    });
  }

  if (filters.sort === "recent") {
    rows.sort(
      (a, b) =>
        new Date(b.date_mvt || 0).getTime() -
        new Date(a.date_mvt || 0).getTime()
    );
  } else if (filters.sort === "oldest") {
    rows.sort(
      (a, b) =>
        new Date(a.date_mvt || 0).getTime() -
        new Date(b.date_mvt || 0).getTime()
    );
  } else if (filters.sort === "qty_desc") {
    rows.sort((a, b) => Number(b.quantite || 0) - Number(a.quantite || 0));
  } else if (filters.sort === "qty_asc") {
    rows.sort((a, b) => Number(a.quantite || 0) - Number(b.quantite || 0));
  }

  return rows;
}

export function paginateLotRows<T>(rows: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function lotTotalPages(rowCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(rowCount / pageSize));
}
