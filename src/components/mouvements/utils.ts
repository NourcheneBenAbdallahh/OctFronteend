import type { MouvementType } from "@/types/mouvement";
import type { Emballage } from "@/types/mouvement";// Types de mouvements pour UI
export const TYPES: { value: MouvementType; label: string; hint: string; color: string }[] = [
  { value: "ENT", label: "ENT (Entrée)", hint: "Ajoute stock (destination)", color: "text-blue-600 bg-blue-50" },
  { value: "PRD", label: "PRD (Sortie prod)", hint: "Diminue stock (source)", color: "text-orange-600 bg-orange-50" },
  { value: "CDD", label: "CDD (Transfert)", hint: "Source → Destination", color: "text-purple-600 bg-purple-50" },
  { value: "PTE", label: "PTE (Perte)", hint: "Diminue stock (source)", color: "text-red-600 bg-red-50" },
  { value: "SPL", label: "SPL (Surplus)", hint: "Ajoute stock", color: "text-emerald-600 bg-emerald-50" },
];

export const needsSource = (t: MouvementType) => ["PRD", "CDD", "PTE", "SPL"].includes(t);
export const needsDestination = (t: MouvementType) => ["ENT", "CDD", "SPL"].includes(t);
export const needsLot = (t: MouvementType) => t !== "ENT";

export function formatEmballageLabel(
  emballage?: Emballage | null,
  fallbackId?: string | null
) {
  if (!emballage) return fallbackId ? `#${fallbackId}` : "-";

  return emballage.code && emballage.name
    ? `${emballage.code} — ${emballage.name}`
    : emballage.name || emballage.code || `#${emballage.id}`;
}