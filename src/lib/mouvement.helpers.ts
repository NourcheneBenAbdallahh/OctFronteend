import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,
  MouvementFormState,
  MouvementsPageStats,
  MouvementStock,
  MouvementType,
} from "@/types/mouvement";
import { MOUVEMENT_TYPES, needsDestination, needsLot, needsSource } from "./mouvement.config";

export function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date.replace(" ", "T")).toLocaleString();
}

export function formatQuantity(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatEmballageLabel(emballage?: EmballageRef | null) {
  if (!emballage) return "-";
  return `${emballage.code} · ${emballage.name}`;
}

/** Statut API GraphQL : BROUILLON → boutons Valider / Supprimer affichés. */
export function isMouvementBrouillon(statut: string | undefined | null): boolean {
  return String(statut ?? "")
    .toUpperCase()
    .trim() === "BROUILLON";
}

export function formatFlow(m: MouvementStock) {
  const source = m.entrepotSource?.adresse;
  const dest = m.entrepotDestination?.adresse;

  if (source && dest) return `${source} → ${dest}`;
  if (source) return `${source} → Sortie`;
  if (dest) return `→ ${dest}`;
  return "-";
}

export function computeStats(items: MouvementStock[]): MouvementsPageStats {
  return {
    total: items.length,
    brouillons: items.filter((x) => x.statut === "BROUILLON").length,
    valides: items.filter((x) => x.statut === "VALIDE").length,
    transferts: items.filter((x) => x.type_mouvement === "CDD").length,
    sortiesProduction: items.filter((x) => x.type_mouvement === "PRD").length,
    pertes: items.filter((x) => x.type_mouvement === "PTE").length,
    surplus: items.filter((x) => x.type_mouvement === "SPL").length,
  };
}

export function filterMouvements(
  items: MouvementStock[],
  search: string,
  type: string,
  statut: string
) {
  const s = search.trim().toLowerCase();

  return items.filter((item) => {
    const matchesSearch =
      !s ||
      item.code_mouvement?.toLowerCase().includes(s) ||
      item.emballage?.name?.toLowerCase().includes(s) ||
      item.emballage?.code?.toLowerCase().includes(s) ||
      item.lot?.code_lot?.toLowerCase().includes(s) ||
      item.entrepotSource?.adresse?.toLowerCase().includes(s) ||
      item.entrepotDestination?.adresse?.toLowerCase().includes(s);

    const matchesType = type === "ALL" || item.type_mouvement === type;
    const matchesStatut = statut === "ALL" || item.statut === statut;

    return matchesSearch && matchesType && matchesStatut;
  });
}

export function emptyForm(): MouvementFormState {
  return {
    type: "PRD",
    emballageId: "",
    lotId: "",
    sourceId: "",
    destId: "",
    quantite: "",
    dateMouvement: currentDateTimeLocal(),
  };
}

export function currentDateTimeLocal() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function formatGraphQLDateTime(value: string) {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  return `${datePart} ${timePart}:00`;
}

export function getSelectedLotAvailable(lots: LotDisponible[], lotId: string) {
  return lots.find((l) => l.lot_id === lotId)?.stock_disponible ?? null;
}

/** Entrepôt servant au calcul des lots disponibles (transferts/production → source ; surplus → destination). */
export function getEntrepotIdForLots(type: MouvementType, form: MouvementFormState): string {
  if (needsSource(type)) {
    return form.sourceId;
  }
  if (needsDestination(type) && !needsSource(type)) {
    return form.destId;
  }
  return "";
}

export function validateForm(form: MouvementFormState) {
  if (!form.emballageId) return "L'emballage est requis.";

  if (form.quantite === "" || Number(form.quantite) <= 0) {
    return "La quantité doit être supérieure à 0.";
  }

  if (needsSource(form.type) && !form.sourceId) {
    return "L'entrepôt source est requis.";
  }

  if (needsDestination(form.type) && !form.destId) {
    return "L'entrepôt destination est requis.";
  }

  if (needsLot(form.type) && !form.lotId) {
    return "Le lot est requis pour ce type de mouvement.";
  }

  if (form.type === "CDD" && form.sourceId && form.destId && form.sourceId === form.destId) {
    return "La source et la destination doivent être différentes.";
  }

  return null;
}

export function validateQuantityAgainstLot(
  form: MouvementFormState,
  selectedLotAvailable: number | null
) {
  if (selectedLotAvailable == null) return null;

  const checkQty =
    ["PRD", "CDD", "PTE", "EMC"].includes(form.type) ||
    (form.type === "SPL" && Boolean(form.lotId));

  if (!checkQty) return null;

  if (form.quantite !== "" && Number(form.quantite) > selectedLotAvailable) {
    return `La quantité dépasse le stock disponible pour ce lot (${formatQuantity(
      selectedLotAvailable
    )} disponible).`;
  }

  return null;
}

export function buildSummary(
  form: MouvementFormState,
  emballages: EmballageRef[],
  entrepots: EntrepotRef[],
  lots: LotDisponible[]
) {
  const meta = MOUVEMENT_TYPES[form.type];
  const emballage = emballages.find((e) => e.id === form.emballageId);
  const source = entrepots.find((e) => e.id === form.sourceId);
  const dest = entrepots.find((e) => e.id === form.destId);
const lot = lots.find((l) => l.lot_id === form.lotId);
  return {
    typeLabel: meta.label,
    typeDescription: meta.description,
    emballageLabel: emballage ? `${emballage.code} · ${emballage.name}` : "-",
    sourceLabel: source?.adresse ?? "-",
    destLabel: dest?.adresse ?? "-",
lotLabel: lot?.code_lot ?? (form.type === "SPL" ? "Nouveau lot si vide" : "-"), 
   quantiteLabel: form.quantite === "" ? "-" : formatQuantity(Number(form.quantite)),
  };
}