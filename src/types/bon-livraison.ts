export type BonLivraisonStatut = "EN_ATTENTE" | "VALIDE";

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
  document_bl?: string | null;
  date_validation?: string | null;
  validated_by?: string | number | null;
  created_at?: string | null;
  updated_at?: string | null;
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
};

export type CommandeOption = {
  id: string | number;
  numero_commande: string;
  quantite: number;
  emballage_id?: string | number;
  entrepot_id?: string | number; 
};

export type EntrepotOption = {
  id: string | number;
  label: string;
};