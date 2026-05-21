import { rowMatchesDateMode } from "@/lib/inventaire.dates";
import type { InventaireFilters, TableInventaire } from "@/types/inventaire";

function parseMs(v: string | null | undefined): number | null {
  if (!v?.trim()) return null;
  const t = new Date(v.replace(" ", "T")).getTime();
  return Number.isFinite(t) ? t : null;
}

/** Filtre date d'inventaire (plage inclusive sur le jour si seule la date sans heure). */
function inDateInvRange(row: TableInventaire, from: string, to: string): boolean {
  const rowMs = parseMs(row.date_inventaire);
  if (rowMs === null) return false;
  const fromMs = parseMs(from);
  const toMs = parseMs(to);
  if (fromMs != null && rowMs < fromMs) return false;
  if (toMs != null && rowMs > toMs) return false;
  return true;
}

/** Chevauchement des périodes stockées vs filtre. */
function overlapsPeriode(
  row: TableInventaire,
  periodeFrom: string,
  periodeTo: string
): boolean {
  const rDebut = parseMs(row.periode_debut);
  const rFin = parseMs(row.periode_fin);
  if (rDebut === null || rFin === null) return false;

  const fDebut = parseMs(periodeFrom);
  const fFin = parseMs(periodeTo);
  if (fDebut === null || fFin === null) return true;

  return rDebut <= fFin && rFin >= fDebut;
}

export function applyInventaireFilters(
  data: TableInventaire[],
  filters: InventaireFilters
): TableInventaire[] {
  let rows = [...data];

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.emballage_name.toLowerCase().includes(q) ||
        r.entrepot_name.toLowerCase().includes(q) ||
        (r.code_session || "").toLowerCase().includes(q)
    );
  }

  if (filters.entrepot) {
    rows = rows.filter((r) => r.entrepot_id === filters.entrepot);
  }

  if (filters.date_mode !== "all") {
    rows = rows.filter((r) =>
      rowMatchesDateMode(
        r.date_inventaire,
        r.periode_debut,
        r.periode_fin,
        filters.date_mode,
        filters.pivot_day,
        filters.pivot_year
      )
    );
  }

  if (filters.code_session) {
    rows = rows.filter((r) => r.code_session === filters.code_session);
  }

  if (filters.date_inventaire_from || filters.date_inventaire_to) {
    rows = rows.filter((r) =>
      inDateInvRange(r, filters.date_inventaire_from, filters.date_inventaire_to)
    );
  }

  if (filters.periode_debut_from || filters.periode_fin_to) {
    rows = rows.filter((r) =>
      overlapsPeriode(r, filters.periode_debut_from, filters.periode_fin_to)
    );
  }

  if (filters.status === "perfect") {
    rows = rows.filter((r) => Math.abs(r.ecart) < 0.0001);
  } else if (filters.status === "negative") {
    rows = rows.filter((r) => r.ecart < 0);
  } else if (filters.status === "positive") {
    rows = rows.filter((r) => r.ecart > 0);
  } else if (filters.status === "non_regularise") {
    rows = rows.filter((r) => r.statut !== "REGULARISEE");
  }

  return rows.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));
}

export function buildInventaireFiltersLabel(filters: InventaireFilters): string {
  const parts: string[] = [];
  if (filters.entrepot) parts.push("entrepot filtre");
  if (filters.date_mode === "day" && filters.pivot_day) {
    parts.push(`jour ${filters.pivot_day.slice(0, 10)}`);
  }
  if (filters.date_mode === "year" && filters.pivot_year) {
    parts.push(`annee ${filters.pivot_year}`);
  }
  if (filters.code_session) parts.push(`session ${filters.code_session}`);
  if (filters.date_inventaire_from || filters.date_inventaire_to) {
    parts.push(
      `date inv. ${filters.date_inventaire_from || "…"} → ${filters.date_inventaire_to || "…"}`
    );
  }
  if (filters.periode_debut_from || filters.periode_fin_to) {
    parts.push(
      `periode ${filters.periode_debut_from || "…"} → ${filters.periode_fin_to || "…"}`
    );
  }
  if (filters.status !== "all") parts.push(`statut ${filters.status}`);
  return parts.length ? parts.join(" | ") : "Tous les inventaires";
}

export const EMPTY_INVENTAIRE_FILTERS: InventaireFilters = {
  search: "",
  status: "all",
  entrepot: "",
  code_session: "",
  date_mode: "all",
  pivot_day: "",
  pivot_year: "",
  date_inventaire_from: "",
  date_inventaire_to: "",
  periode_debut_from: "",
  periode_fin_to: "",
};
