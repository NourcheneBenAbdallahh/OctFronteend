import type { TableFacture } from "@/types/facture";

const SEP = ";";
const CSV_NULL = "null";

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtNum(n: number): string {
  return Number(n).toFixed(3).replace(".", ",");
}

/** Échappe une cellule CSV (séparateur ; et guillemets). */
function cell(value: string): string {
  const s = value.replace(/\r\n|\r|\n/g, " ");
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isBlankString(v: unknown): boolean {
  return typeof v === "string" && v.trim() === "";
}

/** Chaîne affichable : null / undefined / chaîne vide → littéral `null` dans le fichier. */
function strCell(v: string | null | undefined): string {
  if (v === null || v === undefined || isBlankString(v)) return cell(CSV_NULL);
  return cell(v);
}

function dateCell(v: string | Date | null | undefined): string {
  if (v === null || v === undefined) return cell(CSV_NULL);
  const t = new Date(v).getTime();
  if (Number.isNaN(t)) return cell(CSV_NULL);
  return cell(fmtDate(v));
}

function numCell(v: unknown): string {
  if (v === null || v === undefined) return cell(CSV_NULL);
  const num = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(num)) return cell(CSV_NULL);
  return cell(fmtNum(num));
}

function intCell(v: unknown): string {
  if (v === null || v === undefined) return cell(CSV_NULL);
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return cell(CSV_NULL);
  return cell(String(Math.trunc(n)));
}

function idCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined || isBlankString(v)) return cell(CSV_NULL);
  return cell(String(v));
}

/** Lignes d'en-tête du fichier (lisibles dans Excel). Sans `;` pour rester sur une seule colonne. */
function buildCsvPreamble(factureCount: number): string {
  const iso = new Date().toISOString();
  const lines = [
    "# Export factures - Office du Commerce de la Tunisie",
    `# Genere le (UTC): ${iso}`,
    `# Nombre de lignes (factures): ${factureCount}`,
    "# Separateur: point-virgule ; encodage UTF-8 avec BOM",
    "# Champs sans valeur: texte litteral null dans la colonne",
    "#",
  ];
  return lines.join("\r\n");
}

/**
 * Télécharge un CSV des factures sélectionnées (récap une ligne par facture).
 * Préambule commenté (#) + en-têtes en français.
 * Valeurs absentes → littéral `null`.
 * BOM UTF-8 + séparateur ; pour Excel (locale FR).
 */
export function exportFacturesCsv(factures: TableFacture[]): void {
  if (!factures.length || typeof window === "undefined") return;

  const headerLabels = [
    "ID facture",
    "N° facture",
    "Date facture",
    "Statut",
    "Fournisseur (raison sociale)",
    "Contrat (n°)",
    "Montant HT (DT)",
    "Montant TTC (DT)",
    "Montant pénalités (DT)",
    "Jours retard (total)",
    "Nombre de BL",
    "Numeros BL (liste)",
    "Valide par (ID utilisateur)",
  ];

  const headerLine = headerLabels.map((h) => cell(h)).join(SEP);

  const rows = factures.map((f) => {
    const bls = f.bon_livraisons || [];
    const blListe =
      bls.length > 0 ? bls.map((b) => b.numero_bl).join(" | ") : null;

    return [
      idCell(f.id),
      strCell(f.numero_facture ?? null),
      dateCell(f.date_facture),
      strCell(f.statut ?? null),
      strCell(f.fournisseur?.raison_sociale ?? null),
      strCell(f.contrat?.numero_contrat ?? null),
      numCell(f.montant_ht),
      numCell(f.montant_ttc),
      numCell(f.montant_penalites),
      intCell(f.jours_retard_total),
      intCell(bls.length),
      strCell(blListe),
      f.valide_par != null && !isBlankString(f.valide_par)
        ? cell(String(f.valide_par))
        : cell(CSV_NULL),
    ].join(SEP);
  });

  const bom = "\ufeff";
  const preamble = buildCsvPreamble(factures.length);
  const body = [preamble, headerLine, ...rows].join("\r\n");
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
