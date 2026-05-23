/** Reste à livrer sur une commande (BL VALIDE uniquement côté backend). */
export function computeResteALivrer(
  quantiteCommande: number,
  quantiteRecueTotal: number
): number {
  const commande = Number(quantiteCommande);
  const recu = Number(quantiteRecueTotal);
  if (!Number.isFinite(commande) || !Number.isFinite(recu)) {
    return 0;
  }
  return Math.max(0, commande - recu);
}

export function isQuantiteRecueBLValide(
  quantiteRecue: number,
  quantiteCommande: number,
  quantiteRecueTotal: number
): boolean {
  const q = Number(quantiteRecue);
  if (!Number.isFinite(q) || q <= 0) {
    return false;
  }
  const reste = computeResteALivrer(quantiteCommande, quantiteRecueTotal);
  return q <= reste;
}

export const MESSAGE_QUANTITE_BL_TROP_ELEVEE =
  "La quantité reçue dépasse le reste à livrer pour cette commande.";
