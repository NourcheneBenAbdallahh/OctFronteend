import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InventaireFilters, TableInventaire } from "@/types/inventaire";
import { buildInventaireFiltersLabel } from "@/lib/inventaire.filters";

const SEP = ";";

function cell(value: string): string {
  const s = value.replace(/\r\n|\r|\n/g, " ");
  if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return "-";
  try {
    return new Date(v.replace(" ", "T")).toLocaleString("fr-FR");
  } catch {
    return v;
  }
}

export function exportInventaireCsv(
  rows: TableInventaire[],
  filters: InventaireFilters
): void {
  if (!rows.length || typeof window === "undefined") return;

  const periodLabel = buildInventaireFiltersLabel(filters);
  const header = [
    "ID",
    "Session",
    "Entrepot",
    "Emballage",
    "Date inventaire",
    "Periode debut",
    "Periode fin",
    "Stock systeme fige",
    "Stock physique",
    "Ecart",
    "Statut",
    "Motif ecart",
    "Regularise le",
    "Mouvement stock",
    "Type mouvement",
    "Lot",
  ].join(SEP);

  const lines = rows.map((r) =>
    [
      r.id,
      r.code_session || "",
      r.entrepot_name,
      r.emballage_name,
      fmtDate(r.date_inventaire),
      fmtDate(r.periode_debut),
      fmtDate(r.periode_fin),
      String(r.stock_theorique_fige ?? r.stock_theorique),
      String(r.stock_physique),
      String(r.ecart),
      r.statut,
      r.motif_ecart || "",
      r.regularise_at ? fmtDate(r.regularise_at) : "",
      r.mouvementStock?.code_mouvement || r.mouvement_stock_id || "",
      r.mouvementStock?.type_mouvement || "",
      r.lot?.code_lot || "",
    ]
      .map(cell)
      .join(SEP)
  );

  const preamble = [
    "# Export inventaire stock - OCT",
    `# Genere: ${new Date().toISOString()}`,
    `# Filtres: ${periodLabel}`,
    `# Lignes: ${rows.length}`,
    "",
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + preamble + header + "\r\n" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `inventaire-stock-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportInventairePdf(
  rows: TableInventaire[],
  filters: InventaireFilters
): void {
  if (!rows.length || typeof window === "undefined") return;

  const doc = new jsPDF({ orientation: "landscape" });
  const periodLabel = buildInventaireFiltersLabel(filters);

  doc.setFontSize(10);
  doc.text("Inventaire stock — Comparaison systeme / reel", 14, 14);
  doc.setFontSize(9);
  doc.text(`Export: ${new Date().toLocaleString("fr-FR")}`, 14, 21);
  doc.text(`Filtres: ${periodLabel}`, 14, 27);
  doc.text(`Lignes: ${rows.length}`, 14, 33);

  const conformes = rows.filter((r) => Math.abs(r.ecart) < 0.0001).length;
  const nonReg = rows.filter((r) => r.statut !== "REGULARISEE").length;

  autoTable(doc, {
    startY: 38,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Lignes exportees", String(rows.length)],
      ["Conformes (ecart 0)", String(conformes)],
      ["Non regularisees", String(nonReg)],
    ],
    theme: "grid",
    styles: { fontSize: 9 },
  });

  autoTable(doc, {
    startY: (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 8,
    head: [
      [
        "Entrepot",
        "Emballage",
        "Date inv.",
        "Periode",
        "Systeme",
        "Physique",
        "Ecart",
        "Statut",
        "Mouvement",
      ],
    ],
    body: rows.map((r) => {
      const periode =
        r.periode_debut && r.periode_fin
          ? `${fmtDate(r.periode_debut)} → ${fmtDate(r.periode_fin)}`
          : "-";
      return [
        r.entrepot_name,
        r.emballage_name,
        fmtDate(r.date_inventaire),
        periode,
        String(r.stock_theorique_fige ?? r.stock_theorique),
        String(r.stock_physique),
        String(r.ecart),
        r.statut,
        r.mouvementStock
          ? `${r.mouvementStock.type_mouvement} ${r.mouvementStock.code_mouvement || ""}`
          : "-",
      ];
    }),
    theme: "grid",
    styles: { fontSize: 7 },
    headStyles: { fillColor: [28, 36, 52] },
    didParseCell: (hookData) => {
      if (hookData.section !== "body") return;
      if (hookData.column.index !== 6) return;
      const value = Number(String(hookData.cell.raw).replace(",", "."));
      if (Number.isNaN(value)) return;
      if (value < 0) hookData.cell.styles.textColor = [220, 38, 38];
      else if (Math.abs(value) < 0.0001) hookData.cell.styles.textColor = [22, 163, 74];
      else hookData.cell.styles.textColor = [37, 99, 235];
    },
  });

  doc.save(`inventaire-stock-${new Date().toISOString().slice(0, 10)}.pdf`);
}
