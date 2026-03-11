// src/types/mouvement.ts
import { TableEmballages } from "./emballage";

export type MouvementType = "ENT" | "PRD" | "CDD" | "PTE" | "SPL";
export type MouvementStatut = "BROUILLON" | "VALIDE";

import type { Entrepot } from "@/types/entrepot";

export type Lot = {
  id: string;
  code_lot: string;
};

export type Emballage = Pick<TableEmballages, "id" | "code" | "name">;

export type MouvementStock = {
  id: string;
  code_mouvement?: string | null;
  type_mouvement: MouvementType;
  emballage_id: string;
  lot_id?: string | null;
  entrepot_source_id?: string | null;
  entrepot_destination_id?: string | null;
  quantite: number;
  date_mouvement?: string | null;
  user_id?: string | null;
  statut: MouvementStatut;

  emballage?: Emballage | null;
  lot?: Lot | null;
  entrepotSource?: Entrepot | null;
  entrepotDestination?: Entrepot | null;
};