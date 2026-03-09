export type StockInventaire = {
  id: string;
  entrepot_id: string;
  emballage_id: string;
  lot_id?: string | null;

  stock_physique: number;
  stock_theorique: number;
  ecart: number;

  user_id?: string | null;
  date_inventaire: string;
  created_at?: string;

  entrepot?: {
    id: string
    nom: string
  }

  emballage?: {
    id: string
    name: string
  }
}

export type CreateInventaireInput = {
  entrepot_id: string;
  emballage_id: string;
  lot_id?: string | null;
  stock_physique: number;
  user_id?: string;
  date_inventaire: string;
};
export type TableInventaire = Omit<StockInventaire, "entrepot" | "emballage"> & {
  entrepot_name: string;
  emballage_name: string;
};