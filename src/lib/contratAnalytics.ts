export const CONTRAT_STATUT_DEFAULT_NOTES: Record<string, string> = {
  ACTIF: "Contrat en cours — livraisons et commandes autorisées.",
  SUSPENDU: "Contrat suspendu — aucune nouvelle commande ne doit être passée.",
  EXPIRE: "Contrat expiré ou désactivé — conservé pour référence uniquement.",
};

export function getContratStatutNote(
  statut?: string | null,
  customNote?: string | null
): string {
  const custom = customNote?.trim();
  if (custom) return custom;
  if (!statut) return "";
  return CONTRAT_STATUT_DEFAULT_NOTES[statut] ?? "";
}

export function getContratStatus(contrat: {
  quantite_realisee?: number | null;
  quantite_contractuelle?: number | null;
}) {
  const realisee = Number(contrat.quantite_realisee ?? 0);
  const contractuelle = Number(contrat.quantite_contractuelle ?? 1);
  const progress = (realisee / contractuelle) * 100;

  if (realisee > contractuelle) {
    return {
      label: "Dépassement",
      color: "text-red-600",
    };
  }

  if (progress > 80) {
    return {
      label: "Presque atteint",
      color: "text-orange-500",
    };
  }

  return {
    label: "Normal",
    color: "text-green-600",
  };
}

export const getProgressColor = (percent: number) => {
  if (percent >= 100) return "bg-red-500";
  if (percent >= 80) return "bg-orange-500";
  return "bg-indigo-600";
};

export function matchesMontantHtRange(
  montantHt: number | null | undefined,
  min?: string,
  max?: string
): boolean {
  const value = Number(montantHt ?? 0);
  const minVal = min?.trim() ? Number(min) : null;
  const maxVal = max?.trim() ? Number(max) : null;
  if (minVal != null && !Number.isNaN(minVal) && value < minVal) return false;
  if (maxVal != null && !Number.isNaN(maxVal) && value > maxVal) return false;
  return true;
}
