export type MouvementType = "PRD" | "CDD" | "PTE" | "SPL" | "EMC";
export type MouvementStatut = "BROUILLON" | "VALIDE";

export type EmballageRef = {
  id: string;
  code: string;
  name: string;
};

export type EntrepotRef = {
  id: string;
  nom: string; 
  adresse: string;
};


export type LotRef = {
  id: string;
  code_lot: string;
  emballage_id: string;
  quantite?: number | null;
};

export type LotDisponible = {
  lot_id: string | null;
  entrepot_id: string;
  emballage_id: string;
  stock_disponible: number;
  code_lot?: string | null;
};

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
  statut: MouvementStatut;

  emballage?: EmballageRef | null;
  lot?: LotRef | null;
  entrepotSource?: EntrepotRef | null;
  entrepotDestination?: EntrepotRef | null;
  user?: { id: string; name: string } | null;
};

export type MouvementFormState = {
  type: MouvementType;
  emballageId: string;
  lotId: string;
  sourceId: string;
  destId: string;
  quantite: number | "";
  dateMouvement: string;
};

export type MouvementsPageStats = {
  total: number;
  brouillons: number;
  valides: number;
  transferts: number;
  sortiesProduction: number;
  pertes: number;
  surplus: number;
};  

export type PaginationInfo = {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  hasMorePages: boolean;
};