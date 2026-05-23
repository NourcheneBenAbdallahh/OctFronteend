import type { CommandeStatut } from "@/types/commandes";

export const COMMANDE_FILTER_STATUTS: CommandeStatut[] = [
  "EN_ATTENTE",
  "VALIDEE",
  "PARTIELLEMENT_RECEPTIONNEE",
  "RECEPTIONNEE",
  "ANNULEE",
];

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Jours jusqu'à l'échéance (négatif = retard). */
export function computeJoursRestants(
  dateLivraisonPrevue: string,
  referenceDate: Date = new Date()
): number {
  const datePrevue = new Date(dateLivraisonPrevue);
  const ref = new Date(referenceDate);
  return Math.ceil((datePrevue.getTime() - ref.getTime()) / MS_PER_DAY);
}

/** Retard affiché dans la timeline (jours restants &lt; 0, hors réception complète). */
export function isCommandeEnRetardTimeline(
  joursRestants: number,
  statut: string
): boolean {
  return joursRestants < 0 && statut !== "RECEPTIONNEE";
}

/** Retard compté dans le widget « En Retard ». */
export function isCommandeEnRetardWidget(
  dateLivraisonPrevue: string,
  statut: string,
  referenceDate: Date = new Date()
): boolean {
  return new Date(dateLivraisonPrevue) < referenceDate && statut !== "RECEPTIONNEE";
}

/** Libellé échéance : « X Jours restants », « X J. de retard » ou « Échéance atteinte ». */
export function formatDelaiEcheanceLabel(joursRestants: number, statut: string): string {
  const estEnRetard = isCommandeEnRetardTimeline(joursRestants, statut);
  if (joursRestants > 0) return `${joursRestants} Jours restants`;
  if (estEnRetard) return `${Math.abs(joursRestants)} J. de retard`;
  return "Échéance atteinte";
}

/** Compteurs par statut pour les badges de filtre. */
export function computeCommandeStatusCounts(
  rows: Array<{ statut: string }>
): Record<string, number> {
  const counts: Record<string, number> = {
    EN_ATTENTE: 0,
    VALIDEE: 0,
    PARTIELLEMENT_RECEPTIONNEE: 0,
    RECEPTIONNEE: 0,
    ANNULEE: 0,
  };

  for (const item of rows) {
    if (counts[item.statut] !== undefined) {
      counts[item.statut]++;
    }
  }

  return counts;
}

/** Nombre de commandes en retard (widget tableau de bord). */
export function countCommandesEnRetard(
  rows: Array<{ date_livraison_prevue: string; statut: string }>,
  referenceDate: Date = new Date()
): number {
  return rows.filter((r) =>
    isCommandeEnRetardWidget(r.date_livraison_prevue, r.statut, referenceDate)
  ).length;
}

export function computeFluxTotalQuantite(
  rows: Array<{ quantite?: number | string | null }>
): number {
  return rows.reduce((acc, curr) => acc + Number(curr.quantite || 0), 0);
}

export function computeReliquatTotal(
  rows: Array<{ reste?: number | string | null }>
): number {
  return rows.reduce((acc, curr) => acc + Math.max(0, Number(curr.reste || 0)), 0);
}

export function computeTauxReceptionPct(
  rows: Array<{ statut: string }>
): number {
  if (rows.length === 0) return 0;
  const received = rows.filter((r) => r.statut === "RECEPTIONNEE").length;
  return Math.round((received / rows.length) * 100);
}

/** Filtre par statut (clic badge) ou recherche texte (n° commande / fournisseur). */
export function filterCommandesByQuery<T extends {
  statut: string;
  numero_commande?: string;
  fournisseur_id: string | number;
}>(
  rows: T[],
  query: string,
  fournisseursMap: Map<string, string>
): T[] {
  const q = query.trim().toUpperCase();
  if (!q) return rows;

  if (COMMANDE_FILTER_STATUTS.includes(q as CommandeStatut)) {
    return rows.filter((r) => r.statut === q);
  }

  return rows.filter(
    (r) =>
      r.numero_commande?.toLowerCase().includes(query.toLowerCase()) ||
      fournisseursMap.get(String(r.fournisseur_id))?.toLowerCase().includes(query.toLowerCase())
  );
}
