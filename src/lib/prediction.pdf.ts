import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { drawOctPdfHeader } from "@/lib/octPdfHeader";
import type { AlertLevel, ForecastInsight, ModelMetrics, PredictionPoint } from "@/lib/prediction";
import {
  alertLevelActionHint,
  alertLevelLabel,
  modelTypeLabel,
  reliabilityPlainLabel,
} from "@/lib/prediction";

export type PredictionPdfInput = {
  productName: string;
  unitLabel: string;
  entrepotLabel?: string | null;
  insight: ForecastInsight;
  metrics: ModelMetrics;
  predictions: PredictionPoint[];
};

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

const MARGIN = 14;
const OCT_TEAL: [number, number, number] = [0, 160, 157];
const OCT_NAVY: [number, number, number] = [28, 36, 52];

const ALERT_FILL: Record<AlertLevel, [number, number, number]> = {
  STABLE: [236, 253, 245],
  ATTENTION: [255, 251, 235],
  URGENT: [255, 237, 213],
  CRITIQUE: [254, 226, 226],
};

const ALERT_ACCENT: Record<AlertLevel, [number, number, number]> = {
  STABLE: [22, 163, 74],
  ATTENTION: [217, 119, 6],
  URGENT: [234, 88, 12],
  CRITIQUE: [220, 38, 38],
};

function pdfSafe(s: string): string {
  return s.replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

function fmtNum(n: number, maxFrac = 2): string {
  return pdfSafe(
    n.toLocaleString("fr-FR", {
      maximumFractionDigits: maxFrac,
      minimumFractionDigits: 0,
    })
  );
}

function fmtDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function afterTable(doc: DocWithTable): number {
  return (doc.lastAutoTable?.finalY ?? 20) + 8;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...OCT_NAVY);
  doc.text(pdfSafe(text), MARGIN, y);
  doc.setDrawColor(...OCT_TEAL);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 2, doc.internal.pageSize.getWidth() - MARGIN, y + 2);
  return y + 8;
}

function drawAlertBanner(
  doc: jsPDF,
  level: AlertLevel,
  y: number,
  pageW: number
): number {
  const fill = ALERT_FILL[level];
  const accent = ALERT_ACCENT[level];
  const h = 22;
  doc.setFillColor(...fill);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN, y, pageW - MARGIN * 2, h, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...accent);
  doc.text(pdfSafe(alertLevelLabel(level)), MARGIN + 4, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const hint = pdfSafe(alertLevelActionHint(level));
  const lines = doc.splitTextToSize(hint, pageW - MARGIN * 2 - 8);
  doc.text(lines, MARGIN + 4, y + 14);

  return y + h + 6;
}

/** PDF prévision stock : logo OCT, synthèse structurée et tableau des 7 jours. */
export async function exportPredictionPdf(input: PredictionPdfInput): Promise<void> {
  const { productName, unitLabel, entrepotLabel, insight, metrics, predictions } = input;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" }) as DocWithTable;
  const pageW = doc.internal.pageSize.getWidth();
  const tableW = pageW - MARGIN * 2;

  let y = await drawOctPdfHeader(doc, "Faut-il commander ? — Récapitulatif prévision", 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Export : ${new Date().toLocaleString("fr-FR")}`, MARGIN, y);
  y += 5;
  doc.text(pdfSafe(`Produit : ${productName}`), MARGIN, y);
  y += 5;
  if (entrepotLabel) {
    doc.text(pdfSafe(`Entrepôt : ${entrepotLabel}`), MARGIN, y);
    y += 5;
  }
  y += 4;

  y = drawAlertBanner(doc, insight.niveau_alerte, y, pageW);

  y = sectionTitle(doc, "Contexte et synthèse", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: tableW,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: OCT_TEAL, textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: tableW * 0.42, fontStyle: "bold", textColor: OCT_NAVY },
      1: { cellWidth: tableW * 0.58 },
    },
    head: [["Indicateur", "Valeur"]],
    body: [
      ["Niveau d'alerte", alertLevelLabel(insight.niveau_alerte)],
      ["Stock actuel", `${fmtNum(insight.stock_actuel)} ${unitLabel}`],
      ["Autonomie estimée", `${fmtNum(insight.jours_avant_rupture, 1)} jour(s)`],
      ["Quantité suggérée à commander", `${fmtNum(insight.quantite_a_commander)} ${unitLabel}`],
      ["Réserve de sécurité", `${fmtNum(metrics.safety_stock)} ${unitLabel}`],
      ["Consommation moyenne / jour", `${fmtNum(insight.conso_moyenne_jour)} ${unitLabel}`],
      ["Commandes en cours", fmtNum(insight.commandes_en_cours, 0)],
      ["Délai fournisseur (lead time)", `${fmtNum(insight.lead_time_jours, 0)} jour(s)`],
      ["Historique analysé", `${fmtNum(insight.history_days, 0)} jour(s)`],
    ],
  });

  y = afterTable(doc);
  y = sectionTitle(doc, "Analyse et recommandation", y);

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: tableW,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
    columnStyles: {
      0: { cellWidth: tableW * 0.32, fontStyle: "bold", textColor: OCT_NAVY },
      1: { cellWidth: tableW * 0.68 },
    },
    body: [
      ["Message de synthèse", pdfSafe(insight.message_agent)],
      [
        "Méthode de calcul",
        pdfSafe(metrics.method ?? modelTypeLabel(metrics.model_type)),
      ],
      [
        "Qualité de l'estimation",
        pdfSafe(
          metrics.reliability_score != null
            ? `${reliabilityPlainLabel(metrics.reliability_score)} (${Math.round(metrics.reliability_score)} %)`
            : reliabilityPlainLabel(metrics.reliability_score)
        ),
      ],
      ["Type de modèle", pdfSafe(modelTypeLabel(metrics.model_type))],
      ...(metrics.cap_applied
        ? [
            [
              "Ajustement consommation",
              pdfSafe(
                `Plafond appliqué — environ ${fmtNum(metrics.cap_value ?? 0)} ${unitLabel} / jour`
              ),
            ],
          ]
        : []),
    ],
  });

  y = afterTable(doc);

  if (predictions.length > 0) {
    y = sectionTitle(doc, "Sorties estimées — 7 prochains jours", y);

    const predictionRows = [...predictions]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p, index) => [
        String(index + 1),
        fmtDateShort(p.date),
        fmtNum(p.quantite_predite),
        fmtNum(p.borne_basse),
        fmtNum(p.borne_haute),
        unitLabel,
      ]);

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: tableW,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 2.5, halign: "center", overflow: "linebreak" },
      headStyles: { fillColor: OCT_TEAL, textColor: 255, fontStyle: "bold", halign: "center" },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: tableW * 0.38, halign: "left" },
        2: { cellWidth: tableW * 0.16, halign: "right" },
        3: { cellWidth: tableW * 0.14, halign: "right" },
        4: { cellWidth: tableW * 0.14, halign: "right" },
        5: { cellWidth: tableW * 0.08, halign: "center", fontSize: 7 },
      },
      head: [
        [
          "#",
          "Jour",
          "Sorties estimées",
          "Borne basse",
          "Borne haute",
          "Unité",
        ],
      ],
      body: predictionRows,
    });

    y = afterTable(doc);
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      pdfSafe("OCT — Gestion des emballages — Document généré automatiquement"),
      MARGIN,
      pageH - 8
    );
    doc.text(`Page ${i} / ${pageCount}`, pageW - MARGIN, pageH - 8, { align: "right" });
  }

  const safeName = productName.replace(/[^\w\-]+/g, "_").slice(0, 40);
  doc.save(`Prevision_OCT_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
