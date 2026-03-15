export type FactureStatut = "BROUILLON" | "VALIDE" | "PAYE";

export type Facture = {
  id: string;
  numero_facture: string;
  date_facture: string;
  montant_ht: number;
  montant_ttc: number;
  statut: FactureStatut;
  emballage_id?: string | null;
  quantite_facturee?: number | null;
  fournisseur_id?: string | null;
  contrat_id?: string | null;
  commande_id?: string | null;
  bon_livraison_id?: string | null;
  valide_par?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TableFacture = Omit<Facture, "statut"> & {
  id: string | number;
  statut: FactureStatut;
};

export type CreateFactureInput = {
  numero_facture: string;
  date_facture: string;
  montant_ht: number;
  emballage_id: string | number;
  quantite_facturee: number;
  commande_id: string | number;
  statut?: FactureStatut;
};

export type UpdateFactureInput = {
  numero_facture?: string;
  date_facture?: string;
  montant_ht?: number;
  emballage_id?: string | number;
  quantite_facturee?: number;
  commande_id?: string | number;
  statut?: FactureStatut;
};

export type FacturesPaginatorInfo = {
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
};