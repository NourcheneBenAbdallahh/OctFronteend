export type UnitesMesureFiltersState = {
  search: string;
  dimension: "" | "masse" | "volume" | "nombre" | "surface";
};

export const EMPTY_UNITES_FILTERS: UnitesMesureFiltersState = {
  search: "",
  dimension: "",
};

export function countActiveUniteFilters(filters: UnitesMesureFiltersState): number {
  let n = 0;
  if (filters.dimension) n += 1;
  return n;
}

export const DIMENSION_FILTER_OPTIONS = [
  { id: "" as const, label: "Toutes" },
  { id: "masse" as const, label: "Masse" },
  { id: "volume" as const, label: "Volume" },
  { id: "nombre" as const, label: "Nombre" },
  { id: "surface" as const, label: "Surface" },
] as const;

export function dimensionFilterClass(dimension: UnitesMesureFiltersState["dimension"], active: boolean): string {
  if (!active) {
    return "border border-gray-100 bg-white text-gray-500 hover:border-[#00A09D]/40 hover:text-[#00A09D]";
  }
  switch (dimension) {
    case "masse":
      return "bg-amber-500 text-white shadow-md shadow-amber-500/25";
    case "volume":
      return "bg-sky-500 text-white shadow-md shadow-sky-500/25";
    case "nombre":
      return "bg-gray-700 text-white shadow-md";
    case "surface":
      return "bg-violet-500 text-white shadow-md shadow-violet-500/25";
    default:
      return "bg-[#1C2434] text-white shadow-md";
  }
}
