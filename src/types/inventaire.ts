export type InventaireStatut = "BROUILLON" | "COMPTEE" | "REGULARISEE";

export type StockInventaire = {
  id: string;
  code_session?: string | null;
  entrepot_id: string;
  emballage_id: string;

  stock_physique: number;
  stock_theorique: number;
  stock_theorique_fige?: number | null;
  ecart: number;
  statut: InventaireStatut;
  motif_ecart?: string | null;

  user_id?: string | null;
  date_inventaire: string;
  created_at?: string;

  periode_debut?: string | null;
  periode_fin?: string | null;

  regularisation_stock_id?: string | null;
  mouvement_stock_id?: string | null;
  lot_id?: string | null;
  regularise_par?: string | null;
  regularise_at?: string | null;

  mouvementStock?: {
    id: string;
    code_mouvement?: string | null;
    type_mouvement: "PTE" | "SPL" | "PRD" | "CDD" | "EMC";
    quantite: number;
    statut: string;
    date_mouvement?: string | null;
    user?: { id: string; name: string } | null;
  } | null;

  lot?: {
    id: string;
    code_lot?: string | null;
    quantite?: number;
  } | null;

  entrepot?: {
    id: string;
    nom: string;
  };

  emballage?: {
    id: string;
    name: string;
  };

  user?: { id: string; name: string } | null;
  regularisePar?: { id: string; name: string } | null;
};

export type CreateInventaireInput = {
  entrepot_id: string;
  emballage_id: string;
  stock_physique: number;
  user_id?: string;
  date_inventaire: string;
  periode_debut?: string;
  periode_fin?: string;
  code_session?: string;
  motif_ecart?: string;
};

export type TableInventaire = Omit<StockInventaire, "entrepot" | "emballage"> & {
  entrepot_name: string;
  emballage_name: string;
};

export type InventaireDateMode = "day" | "year";

export type InventaireFilters = {
  search: string;
  status: "all" | "perfect" | "negative" | "positive" | "non_regularise";
  entrepot: string;
  code_session: string;
  /** Vue principale : par jour ou par année */
  date_mode: InventaireDateMode;
  pivot_day: string;
  pivot_year: string;
  date_inventaire_from: string;
  date_inventaire_to: string;
  periode_debut_from: string;
  periode_fin_to: string;
};

export type InventaireViewMode = "audit" | "critical";
