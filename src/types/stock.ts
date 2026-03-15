export interface StockEntrepot {
  id: string | number;
  nom?: string | null;
  name?: string | null;
  adresse?: string | null;
}

export interface StockEmballage {
  id: string | number;
  name?: string | null;
  code?: string | null;
}

export interface StockLot {
  id: string | number;
  code_lot: string;
}

export interface StockUser {
  id: string | number;
  name?: string | null;
  email?: string | null;
}

export type StockSens = "entree" | "sortie";

export interface Stock {
  id: string | number;
  entrepot_id: string | number;
  emballage_id: string | number;
  lot_id?: string | number | null;
  date_stock: string;
  //quantite_init: number;
  quantite: number;
  sens: StockSens;
  //quantite_finale: number;
  user_id?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;

  entrepot?: StockEntrepot | null;
  emballage?: StockEmballage | null;
  lot?: StockLot | null;
  user?: StockUser | null;
}

export interface StockFiltersState {
  search: string;
  entrepot: string;
  emballage: string;
  sens: "" | StockSens;
  user: string;
  sort: "recent" | "oldest" | "quantite_desc" | "quantite_asc";
  dateFrom?: string;
  dateTo?: string;
}

export interface StocksStats {
  totalMouvements: number;
  totalEntrees: number;
  totalSorties: number;
  mouvementsToday: number;
}