export type StockInventaire = {
  id: string;
  entrepot_id: string;
  emballage_id: string;

  stock_physique: number;
  stock_theorique: number;
  ecart: number;

  user_id?: string | null;
  date_inventaire: string;
  created_at?: string;

  periode_debut?: string | null;
  periode_fin?: string | null;

  entrepot?: {
    id: string;
    nom: string;
  };

  emballage?: {
    id: string;
    name: string;
  };
};

export type CreateInventaireInput = {
  entrepot_id: string;
  emballage_id: string;
  stock_physique: number;
  user_id?: string;
  date_inventaire: string;
  periode_debut?: string;
  periode_fin?: string;
};

export type TableInventaire = Omit<StockInventaire, "entrepot" | "emballage"> & {
  entrepot_name: string;
  emballage_name: string;
};

export type InventaireFilters = {
  search: string;
  status: "all" | "perfect" | "negative" | "positive";
  entrepot: string;
};

export type InventaireViewMode = "audit" | "critical";