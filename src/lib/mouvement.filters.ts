import type { MouvementFiltersState } from "@/types/mouvement";

export const EMPTY_MOUVEMENT_FILTERS: MouvementFiltersState = {
  search: "",
  type: "ALL",
  statut: "ALL",
  sort: "recent",
  dateFrom: "",
  dateTo: "",
};

export function countActiveMouvementFilters(filters: MouvementFiltersState): number {
  let count = 0;
  if (filters.type !== "ALL") count += 1;
  if (filters.statut !== "ALL") count += 1;
  if (filters.sort !== "recent") count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}
