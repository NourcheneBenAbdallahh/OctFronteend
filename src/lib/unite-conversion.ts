import type { UniteMesure } from "@/types/unite-mesure";

export function normalizeUnitCode(code: string | null | undefined): string {
  return String(code ?? "")
    .trim()
    .toUpperCase();
}

/**
 * Unité de référence pour la quantité commandée : celle définie sur l'emballage (`capacity_unit`).
 * Si absente ou inconnue du référentiel, défaut historique logistique : KG.
 */
export function resolvePrincipalUnitCode(
  capacityUnit: string | null | undefined,
  unites: UniteMesure[]
): string {
  const raw = normalizeUnitCode(capacityUnit);
  if (raw && unites.some((u) => normalizeUnitCode(u.code) === raw)) {
    return raw;
  }
  if (raw) {
    return raw;
  }
  return "KG";
}

/**
 * Unités affichées pour la saisie : même dimension que l'unité principale (ex. G, KG, T pour une commande en KG).
 * Pour `nombre` ou `surface`, pas de chaîne de conversion fiable → uniquement l'unité principale.
 */
export function unitesCompatibleQuantiteCommande(
  principalCode: string,
  unites: UniteMesure[]
): UniteMesure[] {
  const p = unites.find((u) => normalizeUnitCode(u.code) === normalizeUnitCode(principalCode));
  if (!p) {
    return [];
  }
  if (p.dimension === "nombre" || p.dimension === "surface") {
    return [p];
  }
  return unites
    .filter((u) => u.dimension === p.dimension)
    .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
}

/**
 * Convertit une quantité exprimée dans `fromCode` vers `toCode` (ex. 10000 G → 10 KG).
 */
export function convertQuantityBetweenUnites(
  quantity: number,
  fromCode: string,
  toCode: string,
  unites: UniteMesure[]
): number | null {
  if (!Number.isFinite(quantity)) {
    return null;
  }
  const from = unites.find((u) => normalizeUnitCode(u.code) === normalizeUnitCode(fromCode));
  const to = unites.find((u) => normalizeUnitCode(u.code) === normalizeUnitCode(toCode));
  if (!from || !to || from.dimension !== to.dimension) {
    return null;
  }
  if (normalizeUnitCode(from.code) === normalizeUnitCode(to.code)) {
    return quantity;
  }

  if (from.dimension === "masse") {
    const fk = from.facteur_vers_kg;
    const tk = to.facteur_vers_kg;
    if (fk == null || tk == null || tk === 0) {
      return null;
    }
    return (quantity * fk) / tk;
  }
  if (from.dimension === "volume") {
    const fl = from.facteur_vers_l;
    const tl = to.facteur_vers_l;
    if (fl == null || tl == null || tl === 0) {
      return null;
    }
    return (quantity * fl) / tl;
  }

  return null;
}

export function formatQuantitePrincipale(n: number): string {
  if (!Number.isFinite(n)) {
    return "—";
  }
  const abs = Math.abs(n);
  const digits = abs >= 1000 && abs % 1 === 0 ? 0 : abs >= 100 ? 2 : 4;
  return n.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}
