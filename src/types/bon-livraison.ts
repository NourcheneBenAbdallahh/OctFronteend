export type BonLivraisonStatut = "VALIDE" | "ANNULE";

export type BonLivraisonCommandeRef = {
  id: string | number;
  numero_commande: string;
  quantite?: number;
  quantite_recue_total?: number;
  reste?: number;
  statut?: string;
  fournisseur_id?: string | number;
  contrat_id?: string | number;
  emballage_id?: string | number;
  fournisseur?: { id: string | number; raison_sociale: string };
  contrat?: { id: string | number; numero_contrat: string };
  emballage?: {
    id: string | number;
    code?: string;
    name?: string;
    capacity_unit?: string | null;
  };
};

export type BonLivraison = {
  id: string;
  numero_bl: string;
  date_reception: string;
  statut: BonLivraisonStatut;
  emballage_id: string | number;
  quantite_recue: number;
  numero_commande: string;
  commande_id: string | number;
  entrepot_id: string | number;
  receptionne_par?: string | number | null;
  created_by?: string | number | null;
  modified_by?: string | number | null;
  document_bl?: string | null;
  date_validation?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  commande?: BonLivraisonCommandeRef | null;
};

export type TableBonLivraison = Omit<BonLivraison, "statut"> & {
  id: string | number;
  statut: BonLivraisonStatut;
};

export type CreateBonLivraisonInput = {
  date_reception: string;
  emballage_id: string | number;
  quantite_recue: number;
  numero_commande: string;
  entrepot_id: string | number;
};

export type UpdateBonLivraisonInput = {
  date_reception?: string;
  emballage_id?: string | number;
  quantite_recue?: number;
  numero_commande?: string;
  entrepot_id?: string | number;
  statut?: BonLivraisonStatut;
};

export type BonLivraisonsPaginatorInfo = {
  count: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

export type EmballageOption = {
  id: string | number;
  label: string;
  capacity_unit: string | null;
};

export interface BonLivraisonOption {
  id: string | number;
  numero_bl: string;
  quantite_recue: number;
  prix_unitaire?: number; 
  commande?: {
    prix_unitaire: number;
  };
}
export type CommandeOption = {
  id: string | number;
  numero_commande: string;
  quantite: number;
  quantite_recue_total?: number;
  reste?: number;
  statut?: string;
  emballage_id?: string | number;
  entrepot_id?: string | number; 
};

export type EntrepotOption = {
  id: string | number;
  label: string;
};