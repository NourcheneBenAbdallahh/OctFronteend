import type { InventaireDateMode } from "@/types/inventaire";

export function todayIsoDay(): string {
  return new Date().toISOString().slice(0, 10);
}

export function currentYear(): string {
  return String(new Date().getFullYear());
}

/** Bornes du jour pour filtre et API (date_inventaire à midi). */
export function dayScopeBounds(isoDay: string): {
  filterFrom: string;
  filterTo: string;
  dateInventaire: string;
} {
  const d = isoDay.slice(0, 10);
  return {
    filterFrom: `${d}T00:00:00`,
    filterTo: `${d}T23:59:59`,
    dateInventaire: `${d} 12:00:00`,
  };
}

/** Inventaire annuel : période 01/01 → 31/12, pointage au 31/12. */
export function yearScopeBounds(year: string): {
  filterFrom: string;
  filterTo: string;
  dateInventaire: string;
  periodeDebut: string;
  periodeFin: string;
} {
  const y = year.slice(0, 4);
  return {
    filterFrom: `${y}-01-01T00:00:00`,
    filterTo: `${y}-12-31T23:59:59`,
    dateInventaire: `${y}-12-31 23:59:59`,
    periodeDebut: `${y}-01-01 00:00:00`,
    periodeFin: `${y}-12-31 23:59:59`,
  };
}

export function yearOptions(count = 6): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: count }, (_, i) => String(y - i));
}

export function rowMatchesDateMode(
  dateInventaire: string,
  periodeDebut: string | null | undefined,
  periodeFin: string | null | undefined,
  mode: InventaireDateMode,
  pivotDay: string,
  pivotYear: string
): boolean {
  const rowMs = new Date(dateInventaire.replace(" ", "T")).getTime();
  if (!Number.isFinite(rowMs)) return false;

  if (mode === "day") {
    if (!pivotDay?.trim()) return true;
    const { filterFrom, filterTo } = dayScopeBounds(pivotDay);
    const fromMs = new Date(filterFrom).getTime();
    const toMs = new Date(filterTo).getTime();
    return rowMs >= fromMs && rowMs <= toMs;
  }

  if (!pivotYear?.trim()) return true;
  const y = parseInt(pivotYear, 10);
  if (!Number.isFinite(y)) return true;

  const rowYear = new Date(dateInventaire.replace(" ", "T")).getFullYear();
  if (rowYear === y) return true;

  const pDebut = periodeDebut ? new Date(periodeDebut.replace(" ", "T")).getTime() : null;
  const pFin = periodeFin ? new Date(periodeFin.replace(" ", "T")).getTime() : null;
  if (pDebut === null || pFin === null || !Number.isFinite(pDebut) || !Number.isFinite(pFin)) {
    return false;
  }

  const yearStart = new Date(`${y}-01-01T00:00:00`).getTime();
  const yearEnd = new Date(`${y}-12-31T23:59:59`).getTime();

  return pDebut <= yearEnd && pFin >= yearStart;
}

export function describeInventaireScope(
  mode: InventaireDateMode,
  pivotDay: string,
  pivotYear: string,
  entrepotName?: string
): string {
  const wh = entrepotName ? ` — ${entrepotName}` : "";
  if (mode === "day" && pivotDay) {
    return `Inventaire du ${pivotDay.slice(0, 10)}${wh}`;
  }
  if (mode === "year" && pivotYear) {
    return `Inventaire année ${pivotYear}${wh}`;
  }
  return `Inventaire${wh}`;
}
