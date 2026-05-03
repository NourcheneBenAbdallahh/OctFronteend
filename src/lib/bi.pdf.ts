import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { BiKpi, BiDailyPoint, BiNamedSplit, BiCommandeStat, BiFactureStat, BiActivityDay } from "./bi.data";
import { formatDelta } from "./bi.data";

type ParetoRow = { name: string; value: number; cumulPct: number };

export type BiSummaryPdfInput = {
  periodLabel: string;
  entrepotLabel: string;
  range: { start: Date; end: Date };
  kpis: BiKpi;
  prevKpis: BiKpi | null;
  daily: BiDailyPoint[];
  entrepots: BiNamedSplit[];
  emballages: BiNamedSplit[];
  pareto: ParetoRow[];
  commandesStat: BiCommandeStat[];
  facturesStat: BiFactureStat[];
  busiestDays: BiActivityDay[];
  statutFr: Record<string, string>;
  factureFr: Record<string, string>;
};

/**
 * jsPDF (Helvetica) étire mal les séparateurs Unicode (ex. U+202F). On les remplace par des espaces normales.
 */
function pdfSafeLocale(s: string): string {
  return s.replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

const fmt = (n: number) =>
  pdfSafeLocale(n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }));

const fmtMoney = (n: number) =>
  pdfSafeLocale(
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    })
  ) + " TND";

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function afterTable(doc: DocWithTable): number {
  return (doc.lastAutoTable?.finalY ?? 20) + 8;
}

const PDF_MARGIN_MM = 14;

/** PDF texte + tableaux (pas de capture d'ecran). */
export function exportBiSummaryPdf(data: BiSummaryPdfInput): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as DocWithTable;
  const pageW = doc.internal.pageSize.getWidth();
  /** Largeur utile des tableaux (marges gauche/droite). */
  const tableW = pageW - PDF_MARGIN_MM * 2;
  /** Colonne chiffres : largeur fixe suffisante pour « 999 999,999 TND ». */
  const colNumMm = Math.min(78, tableW * 0.36);

  doc.setFontSize(16);
  doc.setTextColor(28, 36, 52);
  doc.text("Resume — Tableau de bord BI", 14, 14);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Export : ${new Date().toLocaleString("fr-FR")}`, 14, 22);
  doc.text(
    `Periode (${data.periodLabel}) : ${data.range.start.toLocaleDateString("fr-FR")} — ${data.range.end.toLocaleDateString("fr-FR")}`,
    14,
    27
  );
  doc.text(`Entrepot : ${data.entrepotLabel}`, 14, 32);

  doc.setTextColor(28, 36, 52);
  doc.setFontSize(11);
  doc.text("Indicateurs cles", 14, 40);

  autoTable(doc, {
    startY: 44,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Volume entrees (unites)", fmt(data.kpis.volumeEntrees)],
      ["Volume sorties (unites)", fmt(data.kpis.volumeSorties)],
      ["Flux net (unites)", fmt(data.kpis.netFlux)],
      ["Nombre de mouvements stock", fmt(data.kpis.mouvements)],
      ["SKU actifs (periode)", fmt(data.kpis.skusActifs)],
      ["Commandes creees (periode)", fmt(data.kpis.commandesCreees)],
      ["Pipeline commandes ouvert", fmt(data.kpis.commandesPipeline)],
      ["CA factures TTC (periode)", fmtMoney(data.kpis.chiffreFacturesTtc)],
      ["Alertes sous seuil (SKU)", fmt(data.kpis.alertesSeuil)],
    ],
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW - colNumMm },
      1: { cellWidth: colNumMm, halign: "right" },
    },
  });

  let y = afterTable(doc);

  if (data.prevKpis) {
    doc.setFontSize(11);
    doc.text("Variation vs periode precedente", 14, y);
    y += 6;
    autoTable(doc, {
      startY: y,
      margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
      tableWidth: tableW,
      head: [["Indicateur", "Evolution %"]],
      body: [
        ["Volume entrees", pdfSafeLocale(formatDelta(data.kpis.volumeEntrees, data.prevKpis.volumeEntrees))],
        ["Volume sorties", pdfSafeLocale(formatDelta(data.kpis.volumeSorties, data.prevKpis.volumeSorties))],
        ["Mouvements", pdfSafeLocale(formatDelta(data.kpis.mouvements, data.prevKpis.mouvements))],
        ["Commandes creees", pdfSafeLocale(formatDelta(data.kpis.commandesCreees, data.prevKpis.commandesCreees))],
        ["CA factures TTC", pdfSafeLocale(formatDelta(data.kpis.chiffreFacturesTtc, data.prevKpis.chiffreFacturesTtc))],
      ],
      theme: "grid",
      styles: { fontSize: 9, overflow: "linebreak" },
      headStyles: { fillColor: [28, 36, 52], textColor: 255 },
      columnStyles: {
        0: { cellWidth: tableW - colNumMm },
        1: { cellWidth: colNumMm, halign: "right" },
      },
    });
    y = afterTable(doc);
  }

  doc.setFontSize(11);
  doc.text("Entrees vs sorties par jour", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Jour", "Entrees", "Sorties"]],
    body: data.daily.map((d) => [d.label, fmt(d.entrees), fmt(d.sorties)]),
    theme: "striped",
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW * 0.42 },
      1: { cellWidth: tableW * 0.29, halign: "right" },
      2: { cellWidth: tableW * 0.29, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Activite par entrepot", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Entrepot", "Entrees", "Sorties", "Volume total"]],
    body: data.entrepots.map((e) => [e.name, fmt(e.entrees), fmt(e.sorties), fmt(e.volume)]),
    theme: "striped",
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW * 0.34 },
      1: { cellWidth: tableW * 0.22, halign: "right" },
      2: { cellWidth: tableW * 0.22, halign: "right" },
      3: { cellWidth: tableW * 0.22, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Top emballages (volume)", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Emballage", "Entrees", "Sorties", "Volume"]],
    body: data.emballages.map((e) => [e.name, fmt(e.entrees), fmt(e.sorties), fmt(e.volume)]),
    theme: "striped",
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW * 0.34 },
      1: { cellWidth: tableW * 0.22, halign: "right" },
      2: { cellWidth: tableW * 0.22, halign: "right" },
      3: { cellWidth: tableW * 0.22, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Pareto (cumul %)", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Article", "Volume", "Cumul %"]],
    body: data.pareto.map((p) => [p.name, fmt(p.value), `${p.cumulPct} %`]),
    theme: "grid",
    styles: { fontSize: 8, overflow: "linebreak" },
    headStyles: { fillColor: [28, 36, 52], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW * 0.52 },
      1: { cellWidth: tableW * 0.24, halign: "right" },
      2: { cellWidth: tableW * 0.24, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Commandes par statut", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Statut", "Nombre"]],
    body: data.commandesStat.map((c) => [data.statutFr[c.statut] ?? c.statut, fmt(c.count)]),
    theme: "striped",
    styles: { fontSize: 9, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW - colNumMm },
      1: { cellWidth: colNumMm, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Facturation par statut", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Statut", "Nombre", "Montant TTC"]],
    body: data.facturesStat.map((f) => [
      data.factureFr[f.statut] ?? f.statut,
      fmt(f.count),
      fmtMoney(f.montantTtc),
    ]),
    theme: "striped",
    styles: { fontSize: 9, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW * 0.46 },
      1: { cellWidth: tableW * 0.18, halign: "right" },
      2: { cellWidth: tableW * 0.36, halign: "right" },
    },
  });
  y = afterTable(doc);

  doc.text("Jours les plus charges (56 derniers jours)", 14, y);
  y += 5;
  autoTable(doc, {
    startY: y,
    margin: { left: PDF_MARGIN_MM, right: PDF_MARGIN_MM },
    tableWidth: tableW,
    head: [["Date", "Operations stock"]],
    body:
      data.busiestDays.length > 0
        ? data.busiestDays.map((d) => [d.labelLong, fmt(d.count)])
        : [["—", "Aucune operation"]],
    theme: "grid",
    styles: { fontSize: 9, overflow: "linebreak" },
    headStyles: { fillColor: [0, 160, 157], textColor: 255 },
    columnStyles: {
      0: { cellWidth: tableW - colNumMm },
      1: { cellWidth: colNumMm, halign: "right" },
    },
  });

  doc.save(`tableau-bi-resume-${new Date().toISOString().slice(0, 10)}.pdf`);
}
