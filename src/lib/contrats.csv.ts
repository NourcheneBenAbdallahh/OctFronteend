import type { TableContrat } from "@/types/contrat";

const SEP = ";";
const CSV_NULL = "null";

export type ContratsExportStats = {
  totalContrats: number;
  totalContractuel: number;
  totalRealise: number;
  totalRestant: number;
  tauxGlobal: number;
};

export type ContratUsageHistoryCsvRow = {
  date: string;
  numero: string;
  statut: string;
  qteCommandee: number;
  qteRecue: number;
  cumulRealise: number;
  resteCommande: number;
};

function cell(value: string): string {
  const s = value.replace(/\r\n|\r|\n/g, " ");
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isBlankString(v: unknown): boolean {
  return typeof v === "string" && v.trim() === "";
}

function strCell(v: string | null | undefined): string {
  if (v === null || v === undefined || isBlankString(v)) return cell(CSV_NULL);
  return cell(v);
}

function numCell(v: unknown, decimals = 2): string {
  if (v === null || v === undefined) return cell(CSV_NULL);
  const num = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(num)) return cell(CSV_NULL);
  return cell(num.toFixed(decimals).replace(".", ","));
}

function idCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined || isBlankString(v)) return cell(CSV_NULL);
  return cell(String(v));
}

function buildPreamble(rowCount: number, periodLabel: string): string {
  const iso = new Date().toISOString();
  return [
    "# Export contrats - Office du Commerce de la Tunisie",
    `# Genere le (UTC): ${iso}`,
    `# Periode / filtres affiches: ${periodLabel.replace(/;/g, " ")}`,
    `# Nombre de lignes (contrats): ${rowCount}`,
    "# Separateur: point-virgule ; encodage UTF-8 avec BOM",
    "# Champs sans valeur: texte litteral null",
    "#",
  ].join("\r\n");
}

function contratDataLine(r: TableContrat): string {
  const qContractuelle = Number(r.quantite_contractuelle || 0);
  const qRealisee = Number(r.quantite_realisee || 0);
  const restant = qContractuelle - qRealisee;
  const rawRate = Number(r.taux_depassement_autorise ?? 0);
  const tauxDepassementPercent = rawRate <= 1 ? rawRate * 100 : rawRate;
  const restantAvecDepassement = restant + (restant * tauxDepassementPercent) / 100;
  const taux = qContractuelle > 0 ? (qRealisee / qContractuelle) * 100 : 0;

  return [
    idCell(r.id),
    strCell(r.numero_contrat ?? null),
    strCell(r.fournisseur?.raison_sociale ?? null),
    strCell(r.emballage?.name ?? null),
    strCell(r.date_debut ?? null),
    strCell(r.date_fin ?? null),
    numCell(qContractuelle, 2),
    numCell(qRealisee, 2),
    numCell(restant, 2),
    numCell(tauxDepassementPercent, 2),
    numCell(restantAvecDepassement, 2),
    numCell(taux, 2),
    strCell(r.statut ?? null),
  ].join(SEP);
}

/**
 * CSV aligné sur l’export PDF (synthèse + tableau contrats + historique optionnel).
 */
export function exportContratsCsv(
  rows: TableContrat[],
  stats: ContratsExportStats,
  periodLabel: string,
  history: ContratUsageHistoryCsvRow[] = []
): void {
  if (!rows.length || typeof window === "undefined") return;

  const preamble = buildPreamble(rows.length, periodLabel);

  const synthHeader = ["Indicateur", "Valeur"].map((h) => cell(h)).join(SEP);
  const synthRows = [
    ["Nombre de contrats", String(stats.totalContrats)],
    ["Quantite contractuelle", String(stats.totalContractuel)],
    ["Quantite realisee", String(stats.totalRealise)],
    ["Reste", String(stats.totalRestant)],
    ["Taux global (%)", stats.tauxGlobal.toFixed(2).replace(".", ",")],
  ].map(([a, b]) => [cell(a), cell(b)].join(SEP));

  const contratHeaders = [
    "ID contrat",
    "N° contrat",
    "Fournisseur",
    "Emballage",
    "Date debut",
    "Date fin",
    "Quantite contractuelle",
    "Quantite realisee",
    "Reste",
    "Taux depassement (%)",
    "Reste avec depassement",
    "Taux realisation (%)",
    "Statut",
  ]
    .map((h) => cell(h))
    .join(SEP);

  const contratLines = rows.map((r) => contratDataLine(r));

  const parts: string[] = [
    preamble,
    "# --- Synthese ---",
    synthHeader,
    ...synthRows,
    "#",
    "# --- Detail contrats ---",
    contratHeaders,
    ...contratLines,
  ];

  if (history.length > 0) {
    const histHeader = [
      "Date commande",
      "N° commande",
      "Statut",
      "Quantite commandee",
      "Quantite recue",
      "Cumul realise",
      "Reste commande",
    ]
      .map((h) => cell(h))
      .join(SEP);
    const histLines = history.map((h) =>
      [
        strCell(h.date),
        strCell(h.numero),
        strCell(h.statut),
        numCell(h.qteCommandee, 2),
        numCell(h.qteRecue, 2),
        numCell(h.cumulRealise, 2),
        numCell(h.resteCommande, 2),
      ].join(SEP)
    );
    parts.push("#", "# --- Historique commandes (contrat filtre) ---", histHeader, ...histLines);
  }

  const bom = "\ufeff";
  const body = parts.join("\r\n");
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `etat-contrats-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
