export interface LotUser {
  id: string | number;
  name?: string | null;
  email?: string | null;
}

export interface LotEmballage {
  id: string | number;
  name?: string | null;
  libelle?: string | null;
  code?: string | null;
}

export interface LotEntrepot {
  id: string | number;
  nom?: string | null;
  name?: string | null;
  adresse?: string | null;
}

export interface Lot {
  id: string | number;
  code_lot: string;
  quantite: number;
  date_mvt: string;
  commentaire?: string | null;
  emballage_id: string | number;
  user_id?: string | number | null;
  emballage?: LotEmballage | null;
  user?: LotUser | null;
  entrepot?: LotEntrepot | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface LotFiltersState {
  search: string;
  emballage: string;
  user: string;
  commentOnly: boolean;
  sort: "recent" | "oldest" | "qty_desc" | "qty_asc";

  dateFrom?: string;
  dateTo?: string;
}

export interface LotsStats {
  totalLots: number;
  totalQuantite: number;
  lotsToday: number;
  commentedLots: number;
}

export interface LotsGroupedByDate {
  label: string;
  dateKey: string;
  items: Lot[];
}// Lot.ts

/*export type Lot = {
  id: string;            // Identifiant unique du lot
  code_lot: string;      // Code du lot (ex: "LOT2026-01")
  date_creation?: string; // Date de création (optionnelle)
  date_expiration?: string; // Date d'expiration (optionnelle)
  quantite?: number;     // Quantité dans le lot (optionnelle)
};

// Entrepot.ts
export type Entrepot = {
  id: string;            // Identifiant unique de l'entrepôt
  name?: string;         // Nom de l'entrepôt
  adresse: string;       // Adresse complète
  capacite_max?: number; // Capacité maximale (optionnelle)
};*/