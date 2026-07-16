import { MouvementType } from "@/types/mouvement";

export const MOUVEMENT_TYPES: Record<
  MouvementType,
  {
    label: string;
    description: string;
    badgeClass: string;
    cardClass: string;
    needsSource: boolean;
    needsDestination: boolean;
    needsLot: boolean;
    allowOptionalLot: boolean;
  }
> = {
  PRD: {
    label: "Production",
    description: "Sortie d’un lot vers la production",
    badgeClass: "bg-cyan-100 text-cyan-700 border border-cyan-200",
    cardClass: "border-cyan-200 bg-cyan-50/70",
    needsSource: true,
    needsDestination: false,
    needsLot: true,
    allowOptionalLot: false,
  },
  CDD: {
    label: "Transfert",
    description: "Transfert d’un lot d’un entrepôt vers un autre",
    badgeClass: "bg-blue-100 text-blue-700 border border-blue-200",
    cardClass: "border-blue-200 bg-blue-50/70",
    needsSource: true,
    needsDestination: true,
    needsLot: true,
    allowOptionalLot: false,
  },
  PTE: {
    label: "Perte",
    description: "Perte, casse ou péremption d’un lot",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    cardClass: "border-orange-200 bg-orange-50/70",
    needsSource: true,
    needsDestination: false,
    needsLot: true,
    allowOptionalLot: false,
  },
  SPL: {
    label: "Surplus",
    description: "Entrée de régularisation positive avec ou sans lot",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    cardClass: "border-emerald-200 bg-emerald-50/70",
    needsSource: false,
    needsDestination: true,
    needsLot: false,
    allowOptionalLot: true,
  },

  
  EMC: {
    label: "EMC",
    description: "Réception fournisseur lors de la validation d'un bon de livraison",
    badgeClass: "bg-teal-100 text-teal-700 border border-teal-200",
    cardClass: "border-teal-200 bg-teal-50/70",
    needsSource: false,
    needsDestination: true,
    needsLot: false,
    allowOptionalLot: false,
  },
};

/** Types créables manuellement — EMC est réservé aux réceptions BL. */
export const MANUAL_MOUVEMENT_TYPES = (Object.keys(MOUVEMENT_TYPES) as MouvementType[]).filter(
  (type) => type !== "EMC"
);

export function needsSource(type: MouvementType) {
  return MOUVEMENT_TYPES[type].needsSource;
}

export function needsDestination(type: MouvementType) {
  return MOUVEMENT_TYPES[type].needsDestination;
}

export function needsLot(type: MouvementType) {
  return MOUVEMENT_TYPES[type].needsLot;
}