export type FactureStatut = "BROUILLON" | "VALIDE" | "PAYE" | "ANNULE";

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
  
  // Relations directes
  bon_livraison_id: string | null;
  // Objet relationnel pour l'affichage (GraphQL)
  bon_livraison?: {
    id: string;
    numero_bl: string;
    date_reception: string;
    quantite_recue: number;
    commande?: { numero_commande: string };
    emballage?: { label: string; code: string };
  };

  fournisseur_id?: string | null;
  contrat_id?: string | null;
  
  valide_par?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// --- INPUTS MIS À JOUR (LIAISON AU BL) ---
export type CreateFactureInput = {
  numero_facture: string;
  date_facture: string;
  bon_livraison_id: string | number; // On passe par le BL qui contient déjà commande_id et emballage_id
  montant_ht: number; 
  statut?: FactureStatut;
};

export type UpdateFactureInput = {
  numero_facture?: string;
  date_facture?: string;
  montant_ht?: number;
  bon_livraison_id?: string | number;
  statut?: FactureStatut;
};

// --- TYPES POUR LES SELECTS / DROPDOWNS ---
export type BonLivraisonOption = {
  id: string | number;
  numero_bl: string;
  quantite_recue: number;
  date_reception: string;
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