export const FOURNISSEUR_STATUT_DEFAULT_NOTES: Record<string, string> = {
  ACTIF: "Fournisseur actif — commandes et contrats autorisés.",
  INACTIF: "Fournisseur inactif — précisez le motif (ex. : retards répétés, qualité insuffisante, fin de collaboration).",
};

export function getFournisseurStatutNote(
  statut?: string | null,
  customNote?: string | null
): string {
  const custom = customNote?.trim();
  if (custom) return custom;
  if (!statut) return "";
  return FOURNISSEUR_STATUT_DEFAULT_NOTES[statut] ?? "";
}
