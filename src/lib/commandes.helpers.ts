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

/** Filtres rapides des cartes (pas des statuts métier). */
export const COMMANDE_QUICK_FILTER_KEYS = [
  "ACTIVES",
  "EN_RETARD",
  "PROCHAINES_7J",
] as const;

export type CommandeQuickFilterKey = (typeof COMMANDE_QUICK_FILTER_KEYS)[number];

export function isCommandeActive(statut: string): boolean {
  return statut !== "RECEPTIONNEE" && statut !== "ANNULEE";
}

export function isCommandeLivraisonProchaine7J(
  dateLivraisonPrevue: string,
  statut: string,
  referenceDate: Date = new Date()
): boolean {
  if (!isCommandeActive(statut)) {
    return false;
  }
  const jours = computeJoursRestants(dateLivraisonPrevue, referenceDate);
  return jours >= 0 && jours <= 7;
}

/** Indicateurs tableau de bord commandes (quantités + volumes actionnables). */
export function computeCommandeDashboardStats(
  rows: Array<{
    statut: string;
    quantite?: number | string | null;
    quantite_recue_total?: number | string | null;
    reste?: number | string | null;
    date_livraison_prevue: string;
  }>,
  referenceDate: Date = new Date()
) {
  const totalCommande = rows.reduce((acc, c) => acc + Number(c.quantite || 0), 0);
  const totalRecu = rows.reduce(
    (acc, c) => acc + Number(c.quantite_recue_total ?? 0),
    0
  );
  const reliquat = computeReliquatTotal(rows);
  const commandesOuvertes = rows.filter(
    (c) => Number(c.reste ?? 0) > 0 && c.statut !== "ANNULEE"
  ).length;
  const actives = rows.filter((c) => isCommandeActive(c.statut)).length;
  const enRetard = countCommandesEnRetard(rows, referenceDate);
  const partielles = rows.filter((c) => c.statut === "PARTIELLEMENT_RECEPTIONNEE").length;
  const livraisons7j = rows.filter((c) =>
    isCommandeLivraisonProchaine7J(c.date_livraison_prevue, c.statut, referenceDate)
  ).length;
  const couverture =
    totalCommande > 0 ? Math.round((totalRecu / totalCommande) * 100) : 0;

  return {
    totalCommande,
    totalRecu,
    reliquat,
    commandesOuvertes,
    actives,
    enRetard,
    partielles,
    livraisons7j,
    couverture,
  };
}

/** Filtre par statut (clic badge), carte rapide ou recherche texte. */
export function filterCommandesByQuery<T extends {
  statut: string;
  numero_commande?: string;
  fournisseur_id: string | number;
  date_livraison_prevue?: string;
}>(
  rows: T[],
  query: string,
  fournisseursMap: Map<string, string>,
  referenceDate: Date = new Date()
): T[] {
  const q = query.trim().toUpperCase();
  if (!q) return rows;

  if (q === "ACTIVES") {
    return rows.filter((r) => isCommandeActive(r.statut));
  }

  if (q === "EN_RETARD") {
    return rows.filter((r) =>
      r.date_livraison_prevue
        ? isCommandeEnRetardWidget(r.date_livraison_prevue, r.statut, referenceDate)
        : false
    );
  }

  if (q === "PROCHAINES_7J") {
    return rows.filter((r) =>
      r.date_livraison_prevue
        ? isCommandeLivraisonProchaine7J(r.date_livraison_prevue, r.statut, referenceDate)
        : false
    );
  }

  if (COMMANDE_FILTER_STATUTS.includes(q as CommandeStatut)) {
    return rows.filter((r) => r.statut === q);
  }

  return rows.filter(
    (r) =>
      r.numero_commande?.toLowerCase().includes(query.toLowerCase()) ||
      fournisseursMap.get(String(r.fournisseur_id))?.toLowerCase().includes(query.toLowerCase())
  );
}
