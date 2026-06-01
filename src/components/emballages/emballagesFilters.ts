import type { TableEmballages } from "@/types/emballage";

export type EmballagesFiltersState = {
  search: string;
  status: "" | "ACTIVE" | "INACTIVE";
  type: string;
  material: string;
  capacityUnit: string;
};

export const EMPTY_EMBALLAGES_FILTERS: EmballagesFiltersState = {
  search: "",
  status: "",
  type: "",
  material: "",
  capacityUnit: "",
};

export function countActiveEmballageFilters(filters: EmballagesFiltersState): number {
  let n = 0;
  if (filters.status) n += 1;
  if (filters.type) n += 1;
  if (filters.material) n += 1;
  if (filters.capacityUnit) n += 1;
  return n;
}

export function filterEmballageRows(
  rows: TableEmballages[],
  filters: EmballagesFiltersState
): TableEmballages[] {
  const q = filters.search.trim().toLowerCase();

  return rows.filter((r) => {
    if (q) {
      const haystack = [r.name, r.code, r.type, r.material, r.capacity_unit]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.status && r.status !== filters.status) return false;
    if (filters.type && r.type !== filters.type) return false;
    if (filters.material && (r.material ?? "") !== filters.material) return false;
    if (filters.capacityUnit && (r.capacity_unit ?? "") !== filters.capacityUnit) {
      return false;
    }
    return true;
  });
}

export function uniqueEmballageFilterOptions(rows: TableEmballages[]) {
  const types = new Set<string>();
  const materials = new Set<string>();
  const units = new Set<string>();

  for (const r of rows) {
    if (r.type?.trim()) types.add(r.type.trim());
    if (r.material?.trim()) materials.add(r.material.trim());
    if (r.capacity_unit?.trim()) units.add(r.capacity_unit.trim());
  }

  return {
    types: Array.from(types).sort((a, b) => a.localeCompare(b, "fr")),
    materials: Array.from(materials).sort((a, b) => a.localeCompare(b, "fr")),
    units: Array.from(units).sort((a, b) => a.localeCompare(b, "fr")),
  };
}
