import { GraphqlRequestError } from "@/lib/graphqlClient";
import type { TableInventaire } from "@/types/inventaire";

export function getInventaireErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof GraphqlRequestError) {
    return err.message;
  }
  if (err instanceof Error && err.message.trim()) {
    return err.message;
  }
  return fallback;
}

export type RegulariserLineCopy = {
  canRegularise: boolean;
  blockReason?: string;
  title: string;
  description: string;
  movementBadge?: string;
};

export function getRegulariserLineCopy(item: TableInventaire): RegulariserLineCopy {
  if (item.statut === "REGULARISEE") {
    return {
      canRegularise: false,
      blockReason: "Cette ligne est déjà régularisée (mouvement stock appliqué).",
      title: "Stock déjà régularisé",
      description: "Aucune action supplémentaire n'est possible sur cette ligne.",
    };
  }
  if (Math.abs(item.ecart) < 0.0001) {
    return {
      canRegularise: false,
      blockReason: "L'écart est nul : aucun mouvement stock à créer.",
      title: "Aucun écart à régulariser",
      description: "Modifiez le stock physique si un écart existe réellement.",
    };
  }
  if (item.ecart > 0) {
    return {
      canRegularise: true,
      title: "Régulariser le stock (surplus)",
      description:
        "Un mouvement Surplus (SPL) sera créé : nouveau lot et entrée en stock pour combler l'écart positif.",
      movementBadge: "SPL — Entrée stock",
    };
  }
  return {
    canRegularise: true,
    title: "Régulariser le stock (perte)",
    description:
      "Un mouvement Perte (PTE) sera créé : sortie stock sur le lot concerné (ou lot inventaire si nécessaire).",
    movementBadge: "PTE — Sortie stock",
  };
}
