import { graphqlRequest } from "./graphqlClient";
import {
  CreateFactureInput,
  Facture,
  FacturesPaginatorInfo,
  TableFacture,
  UpdateFactureInput,
} from "@/types/facture";

export function normalizeFacture(f: any): TableFacture {
  return {
    ...f,
    id: f.id,
    // Garantir que c'est un tableau de BL
    bon_livraisons: f.bon_livraisons || (f.bon_livraison ? [f.bon_livraison] : []),
    
    // Correction des types numériques (Valeur brute ou 0)
    montant_ht: Number(f.montant_ht || 0),
    montant_ttc: Number(f.montant_ttc || 0),
    montant_penalites: Number(f.montant_penalites || 0),
    
    // Sécurité sur le statut
    statut:
      f.statut === "VALIDE" || f.statut === "PAYE" || f.statut === "ANNULE"
        ? f.statut
        : "BROUILLON",
  };
}

export type ListFacturesResponse = {
  factures: {
    data: Facture[];
    paginatorInfo: FacturesPaginatorInfo;
  };
};

// --- CHAMPS GRAPHQL MIS À JOUR POUR LE MULTI-BL ---
const FACTURE_FIELDS = `
  id
  numero_facture
  date_facture
  montant_ht
  montant_ttc
  montant_penalites
  jours_retard_total
  statut
  
  bon_livraisons { 
    id 
    numero_bl 
    date_reception 
    quantite_recue
  }
`;

const LIST_FACTURES = `
  query ListFactures($page: Int!) {
    factures(page: $page) {
      data {
        ${FACTURE_FIELDS}
      }
      paginatorInfo {
        currentPage
        lastPage
        total
      }
    }
  }
`;

export async function listFactures(page = 1) {
  return graphqlRequest<ListFacturesResponse>(LIST_FACTURES, { page });
}

// --- MUTATIONS MISES À JOUR POUR ACCEPTER UN TABLEAU D'IDS ---
const CREATE_FACTURE = `
  mutation CreateFacture($input: CreateFactureInput!) {
    createFacture(input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

/**
 * Note pour ton PFE : Dans ton schéma GraphQL (schema.graphql), 
 * l'input CreateFactureInput doit maintenant avoir un champ :
 * bon_livraison_ids: [ID!]!
 */
export async function createFacture(input: any) {
  return graphqlRequest<{ createFacture: Facture }>(CREATE_FACTURE, { input });
}

const UPDATE_FACTURE = `
  mutation UpdateFacture($id: ID!, $input: UpdateFactureInput!) {
    updateFacture(id: $id, input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

// --- NETTOYAGE DES DONNÉES AVANT ENVOI ---
function sanitizeFactureInput(input: any) {
  const allowedFields = [
    'numero_facture', 
    'date_facture', 
    'montant_ht', 
    'bon_livraison_ids', // On envoie le tableau d'IDs au pluriel
    'statut'
  ];

  const sanitized: any = {};
  allowedFields.forEach(field => {
    if (input[field] !== undefined) {
      sanitized[field] = input[field];
    }
  });

  return sanitized;
}

export async function updateFacture(
  id: string | number,
  input: UpdateFactureInput
) {
  const sanitizedInput = sanitizeFactureInput(input);
  return graphqlRequest<{ updateFacture: Facture }>(UPDATE_FACTURE, {
    id,
    input: sanitizedInput,
  });
}

const DELETE_FACTURE = `
  mutation DeleteFacture($id: ID!) {
    deleteFacture(id: $id)
  }
`;

export async function deleteFacture(id: string | number) {
  return graphqlRequest<{ deleteFacture: boolean }>(DELETE_FACTURE, { id });
}