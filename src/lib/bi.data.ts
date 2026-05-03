import type { Stock } from "@/types/stock";
import type { Commande } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import { listCommandes } from "@/lib/commandes.api";
import { listFactures } from "@/lib/factures.api";

export type BiPeriodKey = "7d" | "30d" | "90d" | "180d" | "365d" | "all";

export type BiKpi = {
  volumeEntrees: number;
  volumeSorties: number;
  netFlux: number;
  mouvements: number;
  skusActifs: number;
  /** Commandes non clôturées (hors période — indicateur de stock logistique). */
  commandesPipeline: number;
  /** Nouvelles commandes enregistrées sur la période sélectionnée. */
  commandesCreees: number;
  chiffreFacturesTtc: number;
  alertesSeuil: number;
};

export type BiDailyPoint = { day: string; label: string; entrees: number; sorties: number };

export type BiNamedSplit = { name: string; entrees: number; sorties: number; volume: number };

export type BiCommandeStat = { statut: string; count: number };

export type BiFactureStat = { statut: string; count: number; montantTtc: number };

/** Une journée dans la fenêtre « 56 derniers jours » (même logique que l’ancien calendrier). */
export type BiActivityDay = {
  dateYmd: string;
  labelShort: string;
  labelLong: string;
  count: number;
};

export async function fetchAllCommandes(token?: string | null): Promise<Commande[]> {
  const acc: Commande[] = [];
  let page = 1;
  const first = 150;
  for (;;) {
    const { commandes } = await listCommandes(page, first, {
      token: token ?? undefined,
    });
    acc.push(...commandes.data);
    if (page >= commandes.paginatorInfo.lastPage) break;
    page++;
    if (page > 120) break;
  }
  return acc;
}

export async function fetchAllFactures(token?: string | null): Promise<Facture[]> {
  const acc: Facture[] = [];
  let page = 1;
  for (;;) {
    const { factures } = await listFactures(page, { token: token ?? undefined });
    acc.push(...factures.data);
    if (page >= factures.paginatorInfo.lastPage) break;
    page++;
    if (page > 200) break;
  }
  return acc;
}

function atDayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function atDayEnd(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Jour civil local YYYY-MM-DD — évite le décalage UTC de `toISOString()` sur agrégations jour / séries. */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getDataTimeBounds(stocks: Stock[]): { min: Date; max: Date } | null {
  if (!stocks.length) return null;
  let minT = Infinity;
  let maxT = -Infinity;
  for (const s of stocks) {
    const t = new Date(s.date_stock).getTime();
    if (!Number.isFinite(t)) continue;
    minT = Math.min(minT, t);
    maxT = Math.max(maxT, t);
  }
  if (!Number.isFinite(minT) || !Number.isFinite(maxT)) return null;
  return { min: new Date(minT), max: new Date(maxT) };
}

export function resolvePeriodRange(
  key: BiPeriodKey,
  anchor: Date,
  bounds: { min: Date; max: Date } | null
): { start: Date; end: Date } {
  const end = atDayEnd(anchor);
  if (key === "all" && bounds) {
    return { start: atDayStart(bounds.min), end: atDayEnd(bounds.max) };
  }
  const days =
    key === "7d"
      ? 7
      : key === "30d"
        ? 30
        : key === "90d"
          ? 90
          : key === "180d"
            ? 180
            : key === "365d"
              ? 365
              : 30;
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start: atDayStart(start), end };
}

export function previousPeriod(
  start: Date,
  end: Date
): { start: Date; end: Date } {
  const len = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - len);
  return { start: atDayStart(prevStart), end: atDayEnd(prevEnd) };
}

function inRange(ts: number, start: Date, end: Date): boolean {
  return ts >= start.getTime() && ts <= end.getTime();
}

function emballageLabel(s: Stock): string {
  return s.emballage?.name || s.emballage?.code || "Inconnu";
}

function entrepotLabel(s: Stock): string {
  return s.entrepot?.nom || "—";
}

export function filterStocksByEntrepot(
  stocks: Stock[],
  entrepot: string | "all"
): Stock[] {
  if (entrepot === "all") return stocks;
  return stocks.filter((s) => entrepotLabel(s) === entrepot);
}

export function uniqueEntrepotNames(stocks: Stock[]): string[] {
  const set = new Set<string>();
  for (const s of stocks) set.add(entrepotLabel(s));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
}

export function computeAlertesSeuil(stocks: Stock[], seuilDefaut = 500): number {
  const byEmb: Record<string, { net: number; min: number | null | undefined }> = {};
  for (const s of stocks) {
    const id = emballageLabel(s);
    const q = Number(s.quantite) || 0;
    if (!byEmb[id]) {
      byEmb[id] = { net: 0, min: s.emballage?.min_stock ?? null };
    }
    byEmb[id].net += s.sens === "entree" ? q : -q;
    if (s.emballage?.min_stock != null) byEmb[id].min = s.emballage.min_stock;
  }
  let count = 0;
  for (const id of Object.keys(byEmb)) {
    const { net, min } = byEmb[id];
    const threshold =
      min != null && Number(min) > 0 ? Number(min) : seuilDefaut;
    if (net < threshold) count++;
  }
  return count;
}

function computeKpis(
  stocks: Stock[],
  commandes: Commande[],
  factures: Facture[],
  start: Date,
  end: Date
): BiKpi {
  let volumeEntrees = 0;
  let volumeSorties = 0;
  let mouvements = 0;
  const skuSet = new Set<string>();

  for (const s of stocks) {
    const t = new Date(s.date_stock).getTime();
    if (!inRange(t, start, end)) continue;
    mouvements++;
    const q = Number(s.quantite) || 0;
    skuSet.add(emballageLabel(s));
    if (s.sens === "entree") volumeEntrees += q;
    else volumeSorties += q;
  }

  let commandesPipeline = 0;
  for (const c of commandes) {
    if (c.statut === "ANNULEE" || c.statut === "RECEPTIONNEE") continue;
    commandesPipeline++;
  }

  let commandesCreees = 0;
  for (const c of commandes) {
    const t = new Date(c.date_commande).getTime();
    if (!inRange(t, start, end)) continue;
    commandesCreees++;
  }

  let chiffreFacturesTtc = 0;
  for (const f of factures) {
    const t = new Date(f.date_facture).getTime();
    if (!inRange(t, start, end)) continue;
    if (f.statut === "ANNULE") continue;
    chiffreFacturesTtc += Number(f.montant_ttc) || 0;
  }

  return {
    volumeEntrees,
    volumeSorties,
    netFlux: volumeEntrees - volumeSorties,
    mouvements,
    skusActifs: skuSet.size,
    commandesPipeline,
    commandesCreees,
    chiffreFacturesTtc,
    alertesSeuil: computeAlertesSeuil(stocks),
  };
}

export function buildDailySeries(
  stocks: Stock[],
  start: Date,
  end: Date
): BiDailyPoint[] {
  const days: BiDailyPoint[] = [];
  const cur = atDayStart(start);
  const endT = end.getTime();

  const bucketEnt: Record<string, number> = {};
  const bucketSor: Record<string, number> = {};

  for (const s of stocks) {
    const t = new Date(s.date_stock);
    const key = toLocalYmd(t);
    const q = Number(s.quantite) || 0;
    if (s.sens === "entree") bucketEnt[key] = (bucketEnt[key] || 0) + q;
    else bucketSor[key] = (bucketSor[key] || 0) + q;
  }

  while (cur.getTime() <= endT) {
    const key = toLocalYmd(cur);
    const label = cur.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
    days.push({
      day: key,
      label,
      entrees: bucketEnt[key] || 0,
      sorties: bucketSor[key] || 0,
    });
    cur.setDate(cur.getDate() + 1);
  }

  return days;
}

export function aggregateByEntrepot(
  stocks: Stock[],
  start: Date,
  end: Date
): BiNamedSplit[] {
  const map: Record<string, { entrees: number; sorties: number }> = {};
  for (const s of stocks) {
    const t = new Date(s.date_stock).getTime();
    if (!inRange(t, start, end)) continue;
    const name = entrepotLabel(s);
    if (!map[name]) map[name] = { entrees: 0, sorties: 0 };
    const q = Number(s.quantite) || 0;
    if (s.sens === "entree") map[name].entrees += q;
    else map[name].sorties += q;
  }
  return Object.entries(map)
    .map(([name, v]) => ({
      name,
      entrees: v.entrees,
      sorties: v.sorties,
      volume: v.entrees + v.sorties,
    }))
    .sort((a, b) => b.volume - a.volume);
}

export function topEmballages(
  stocks: Stock[],
  start: Date,
  end: Date,
  limit = 10
): BiNamedSplit[] {
  const map: Record<string, { entrees: number; sorties: number }> = {};
  for (const s of stocks) {
    const t = new Date(s.date_stock).getTime();
    if (!inRange(t, start, end)) continue;
    const name = emballageLabel(s);
    if (!map[name]) map[name] = { entrees: 0, sorties: 0 };
    const q = Number(s.quantite) || 0;
    if (s.sens === "entree") map[name].entrees += q;
    else map[name].sorties += q;
  }
  return Object.entries(map)
    .map(([name, v]) => ({
      name,
      entrees: v.entrees,
      sorties: v.sorties,
      volume: v.entrees + v.sorties,
    }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

export function paretoLine(
  rows: BiNamedSplit[]
): { name: string; value: number; cumulPct: number }[] {
  const total = rows.reduce((a, r) => a + r.volume, 0) || 1;
  let cumul = 0;
  return rows.map((r) => {
    cumul += r.volume;
    return {
      name: r.name,
      value: r.volume,
      cumulPct: Math.round((cumul / total) * 1000) / 10,
    };
  });
}

export function commandesByStatut(
  commandes: Commande[],
  start: Date,
  end: Date
): BiCommandeStat[] {
  const m: Record<string, number> = {};
  for (const c of commandes) {
    const t = new Date(c.date_commande).getTime();
    if (!inRange(t, start, end)) continue;
    const st = String(c.statut);
    m[st] = (m[st] || 0) + 1;
  }
  return Object.entries(m)
    .map(([statut, count]) => ({ statut, count }))
    .sort((a, b) => b.count - a.count);
}

export function facturesByStatut(
  factures: Facture[],
  start: Date,
  end: Date
): BiFactureStat[] {
  const m: Record<string, { count: number; montantTtc: number }> = {};
  for (const f of factures) {
    const t = new Date(f.date_facture).getTime();
    if (!inRange(t, start, end)) continue;
    const st = String(f.statut);
    if (!m[st]) m[st] = { count: 0, montantTtc: 0 };
    m[st].count++;
    m[st].montantTtc += Number(f.montant_ttc) || 0;
  }
  return Object.entries(m)
    .map(([statut, v]) => ({
      statut,
      count: v.count,
      montantTtc: v.montantTtc,
    }))
    .sort((a, b) => b.montantTtc - a.montantTtc);
}

/** Compte les opérations stock par jour sur les 56 derniers jours (8 semaines × 7 jours), ordre chronologique. */
export function buildActivitySeries56(stocks: Stock[], end: Date): BiActivityDay[] {
  const cols = 7;
  const rows = 8;
  const anchor = atDayEnd(end);
  const startMonday = new Date(anchor);
  const dow = (startMonday.getDay() + 6) % 7;
  startMonday.setDate(startMonday.getDate() - dow - (rows - 1) * 7);
  startMonday.setHours(0, 0, 0, 0);

  const points: BiActivityDay[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = new Date(startMonday);
      d.setDate(d.getDate() + r * 7 + c);
      const dateYmd = toLocalYmd(d);
      let n = 0;
      for (const s of stocks) {
        if (toLocalYmd(new Date(s.date_stock)) === dateYmd) n++;
      }
      points.push({
        dateYmd,
        labelShort: d.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        labelLong: d.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        count: n,
      });
    }
  }
  return points;
}

/** Jours avec le plus d’opérations (pour encadré récap). */
export function topBusyDays(points: BiActivityDay[], limit = 5): BiActivityDay[] {
  return [...points]
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export type BiComputed = {
  range: { start: Date; end: Date };
  prevRange: { start: Date; end: Date };
  kpis: BiKpi;
  prevKpis: BiKpi | null;
  daily: BiDailyPoint[];
  entrepots: BiNamedSplit[];
  emballages: BiNamedSplit[];
  pareto: ReturnType<typeof paretoLine>;
  commandesStat: BiCommandeStat[];
  facturesStat: BiFactureStat[];
  /** 56 jours glissants jusqu’à aujourd’hui (entrées/sorties stock enregistrées). */
  activity56: BiActivityDay[];
};

export function computeBiModel(
  stocks: Stock[],
  commandes: Commande[],
  factures: Facture[],
  periodKey: BiPeriodKey,
  anchor: Date
): BiComputed {
  const bounds = getDataTimeBounds(stocks);
  const range = resolvePeriodRange(periodKey, anchor, bounds);
  const prevRange = previousPeriod(range.start, range.end);

  const kpis = computeKpis(stocks, commandes, factures, range.start, range.end);
  let prevKpis: BiKpi | null = null;
  if (periodKey !== "all") {
    prevKpis = computeKpis(
      stocks,
      commandes,
      factures,
      prevRange.start,
      prevRange.end
    );
  }

  const emballagesFull = topEmballages(stocks, range.start, range.end, 30);

  return {
    range,
    prevRange,
    kpis,
    prevKpis,
    daily: buildDailySeries(stocks, range.start, range.end),
    entrepots: aggregateByEntrepot(stocks, range.start, range.end),
    emballages: topEmballages(stocks, range.start, range.end, 12),
    pareto: paretoLine(emballagesFull.slice(0, 15)),
    commandesStat: commandesByStatut(commandes, range.start, range.end),
    facturesStat: facturesByStatut(factures, range.start, range.end),
    activity56: buildActivitySeries56(stocks, range.end),
  };
}

function deltaPct(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function formatDelta(current: number, previous: number): string {
  const d = deltaPct(current, previous);
  if (d === null) return "—";
  const sign = d > 0 ? "+" : "";
  return `${sign}${d}%`;
}
