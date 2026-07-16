export type FactureStatut = "BROUILLON" | "VALIDE" | "PAYE" | "ANNULE";
export type BonLivraison = {
  id: string | number;
  numero_bl: string;
  date_reception: string;
  quantite_recue: number;

  commande?: {
    id: string | number;
    numero_commande: string;
    prix_unitaire?: number;
  };

  emballage?: {
    label: string;
    code: string;
  };

  is_factured?: boolean;
};
export type Facture = {
  id: string;
  numero_facture: string;
  date_facture: string;
  
  montant_ht: number;            
  montant_penalites?: number;    
  montant_ht_net?: number;       
  jours_retard_total?: number;   

  montant_ttc: number;
  statut: FactureStatut;
  
  bon_livraisons: BonLivraison[];
 

  fournisseur_id?: string | null;
  contrat_id?: string | null;
  fournisseur?: {
    id: string | number;
    raison_sociale: string;
  } | null;
  contrat?: {
    id: string | number;
    numero_contrat: string;
  } | null;
  
  valide_par?: {
    id: string | number;
    name: string;
  } | null;
  created_by?: {
    id: string | number;
    name: string;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// --- INPUTS MIS À JOUR (LIAISON AU BL) ---
export type CreateFactureInput = {
  numero_facture: string;
  date_facture: string;
  bon_livraison_ids: (string | number)[];
  montant_ht?: number;
  fournisseur_id?: string | number;
  contrat_id?: string | number;
  statut?: FactureStatut;
};

export type UpdateFactureInput = {
  numero_facture?: string;
  date_facture?: string;
  montant_ht?: number;
  bon_livraison_ids: (string | number)[];
  fournisseur_id?: string | number;
  contrat_id?: string | number;
  statut?: FactureStatut;
};

export type BonLivraisonOption = {
  id: string | number;
  numero_bl: string;
  quantite_recue: number;
  date_reception: string;

  commande?: {
    id: string | number;
    numero_commande: string;
    prix_unitaire?: number;
    fournisseur_id?: string | number;
    contrat_id?: string | number;
    fournisseur?: {
      id: string | number;
      raison_sociale: string;
    };
    contrat?: {
      id: string | number;
      numero_contrat: string;
      montant_ht?: number;
      quantite_contractuelle?: number;
    };
  };

  commande_id?: string | number;
  fournisseur_id?: string | number;
  contrat_id?: string | number;
  fournisseur_name?: string;
  contrat_name?: string;
  is_factured?: boolean;
  
};
export type TableFacture = Omit<Facture, "statut"> & {
  id: string | number;
  statut: FactureStatut;
  numero_facture: string;
  date_facture: string;
  montant_ht: number;
  montant_ttc: number;
  montant_penalites: number;
  bon_livraisons: BonLivraisonOption[];
};

export type FacturesPaginatorInfo = {
  count: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

// Anciens types (à garder si tu as d'autres composants les utilisant)
export type EmballageOption = {
  id: string | number;
  label: string;
};

export type CommandeOption = {
  id: string | number;
  numero_commande: string;
};