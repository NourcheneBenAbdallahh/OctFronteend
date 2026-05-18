import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { TableFacture } from "@/types/facture";

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function fmtMoney(n: number): string {
  return `${n.toFixed(3).replace(".", ",")} DT`;
}

function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** jsPDF gère mal certains séparateurs Unicode dans les chaînes. */
function pdfSafe(s: string): string {
  return s.replace(/\u202f|\u00a0/g, " ");
}

/**
 * Génère un PDF : une page A4 par facture (bons de livraison + montants).
 */
export function exportFacturesPdf(factures: TableFacture[]): void {
  if (!factures.length) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  }) as DocWithTable;

  const pageW = doc.internal.pageSize.getWidth();
  let first = true;

  for (const f of factures) {
    if (!first) doc.addPage();
    first = false;

    let y = 14;
    doc.setFontSize(9);
    doc.setTextColor(90, 90, 90);
    doc.text(pdfSafe("Office du Commerce de la Tunisie"), 14, y);
    y += 6;
    doc.setFontSize(15);
    doc.setTextColor(0, 100, 100);
    doc.text(pdfSafe("FACTURE"), 14, y);
    y += 9;
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(pdfSafe(`N° ${f.numero_facture}`), 14, y);
    doc.text(pdfSafe(`Date : ${fmtDate(f.date_facture)}`), 95, y);
    doc.text(pdfSafe(`Statut : ${f.statut}`), pageW - 14, y, { align: "right" });
    y += 6;
    doc.text(
      pdfSafe(`Fournisseur : ${f.fournisseur?.raison_sociale || "Non renseigné"}`),
      14,
      y
    );
    doc.text(
      pdfSafe(`Contrat : ${f.contrat?.numero_contrat || "Non renseigné"}`),
      pageW - 14,
      y,
      { align: "right" }
    );
    y += 8;

    const blBody = (f.bon_livraisons || []).map((bl) => [
      pdfSafe(String(bl.numero_bl)),
      pdfSafe(fmtDate(bl.date_reception)),
      String(bl.quantite_recue ?? ""),
    ]);

    autoTable(doc, {
      startY: y,
      head: [[pdfSafe("Bon de livraison"), pdfSafe("Date réception"), pdfSafe("Quantité")]],
      body: blBody.length ? blBody : [["—", "—", "—"]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [0, 100, 100] },
      margin: { left: 14, right: 14 },
    });

    const afterY = (doc.lastAutoTable?.finalY ?? y + 30) + 10;
    let ty = afterY;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(pdfSafe(`Montant HT : ${fmtMoney(Number(f.montant_ht))}`), 14, ty);
    ty += 6;
    const tva = Number(f.montant_ht) * 0.19;
    doc.text(pdfSafe(`TVA (19 %) : ${fmtMoney(tva)}`), 14, ty);
    ty += 6;
    if ((f.montant_penalites || 0) > 0) {
      doc.setTextColor(180, 40, 40);
      doc.text(
        pdfSafe(`Pénalités : -${fmtMoney(Number(f.montant_penalites || 0))}`),
        14,
        ty
      );
      doc.setTextColor(30, 30, 30);
      ty += 6;
    }
    doc.setFont("helvetica", "bold");
    doc.text(pdfSafe(`Montant TTC : ${fmtMoney(Number(f.montant_ttc))}`), 14, ty);
    doc.setFont("helvetica", "normal");
    if (f.valide_par) {
      ty += 8;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(pdfSafe(`Validé par (ID utilisateur) : ${f.valide_par}`), 14, ty);
    }
  }

  doc.save(`factures-${new Date().toISOString().slice(0, 10)}.pdf`);
}
