import type { ForecastInsight } from "@/lib/prediction";

export const COVERAGE_DAY_PRESETS = [7, 14, 21, 30] as const;

/** Quantité à commander pour couvrir N jours (consommation + marge − stock − commandes en cours). */
export function computeCoverageQuantity(
  insight: ForecastInsight,
  safetyStock: number,
  coverageDays: number
): number {
  const days = Math.max(1, Math.min(365, Math.round(coverageDays)));
  const consoJour = Math.max(0, insight.conso_moyenne_jour);
  const stockDisponible = insight.stock_actuel + insight.commandes_en_cours;
  const besoin = consoJour * days;

  return Math.max(0, Math.round(besoin + safetyStock - stockDisponible));
}

export function defaultDeliveryDate(leadTimeDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(1, leadTimeDays));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildCommandeCreateUrl(input: {
  emballageId: string;
  quantite: number;
  entrepotId?: string | null;
  leadTimeDays?: number;
  coverageDays?: number;
}): string {
  const params = new URLSearchParams();
  params.set("nouveau", "1");
  params.set("emballage_id", input.emballageId);
  params.set("quantite", String(Math.max(0, Math.round(input.quantite))));

  if (input.entrepotId) {
    params.set("entrepot_id", input.entrepotId);
  }

  params.set("date_livraison", defaultDeliveryDate(input.leadTimeDays ?? 3));

  if (input.coverageDays) {
    params.set("couverture_jours", String(input.coverageDays));
  }

  return `/commandes?${params.toString()}`;
}

export function buildLogisticsSuggestionText(input: {
  productName: string;
  unitLabel: string;
  quantite: number;
  coverageDays: number;
  entrepotName?: string | null;
}): string {
  const lines = [
    "Suggestion de commande (OCT)",
    `Produit : ${input.productName}`,
    `Quantité : ${input.quantite.toLocaleString("fr-FR")} ${input.unitLabel}`,
    `Objectif : couvrir ${input.coverageDays} jour(s) de consommation`,
  ];
  if (input.entrepotName) {
    lines.push(`Entrepôt : ${input.entrepotName}`);
  }
  return lines.join("\n");
}
