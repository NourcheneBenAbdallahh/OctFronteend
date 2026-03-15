export type CommandeStatut =
  | "BROUILLON"
  | "VALIDEE"
  | "LIVREP"
  | "LIVREC"
  | "ANNULEE";

export type Commande = {
  id: string;
  numero_commande: string;
  date_commande: string;
  date_livraison_prevue: string;
  statut: CommandeStatut | string;
  emballage_id: string | number;
  quantite: number;
  fournisseur_id: string | number;
  contrat_id: string | number;
  entrepot_id: string | number;
  created_by: string | number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TableCommande = Omit<Commande, "statut"> & {
  id: string | number;
  statut: CommandeStatut;
};

export type CreateCommandeInput = {
  date_livraison_prevue: string;
  emballage_id: string | number;
  quantite: number;
  fournisseur_id: string | number;
  entrepot_id: string | number;
};

export type UpdateCommandeInput = {
  date_livraison_prevue?: string;
  emballage_id?: string | number;
  quantite?: number;
  fournisseur_id?: string | number;
  entrepot_id?: string | number;
  statut?: string;
};

export type CommandesPaginatorInfo = {
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

export type EntrepotOption = {
  id: string | number;
  label: string;
};

export type FournisseurOption = {
  id: string | number;
  label: string;
};

export type ContratForCommande = {
  id: string | number;
  numero_contrat: string;
  fournisseur_id: string | number;
  emballage_id: string | number;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU" | string;
  quantite_contractuelle: number;
  quantite_realisee: number;
};