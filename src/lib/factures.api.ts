import { graphqlRequest } from "./graphqlClient";
import {
  CreateFactureInput,
  Facture,
  FacturesPaginatorInfo,
  TableFacture,
  UpdateFactureInput,
} from "@/types/facture";

export function normalizeFacture(f: Facture): TableFacture {
  return {
    ...f,
    id: f.id,
    statut:
      f.statut === "VALIDE" || f.statut === "PAYE"
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

const FACTURE_FIELDS = `
  id
  numero_facture
  date_facture
  montant_ht
  montant_ttc
  statut
  emballage_id
  quantite_facturee
  fournisseur_id
  contrat_id
  commande_id
  bon_livraison_id
  valide_par
  created_at
  updated_at
`;

const LIST_FACTURES = `
  query ListFactures($page: Int!) {
    factures(page: $page) {
      data {
        ${FACTURE_FIELDS}
      }
      paginatorInfo {
        count
        currentPage
        lastPage
        perPage
        total
      }
    }
  }
`;

export async function listFactures(page = 1) {
  return graphqlRequest<ListFacturesResponse>(LIST_FACTURES, { page });
}

const GET_FACTURE = `
  query GetFacture($id: ID!) {
    facture(id: $id) {
      ${FACTURE_FIELDS}
    }
  }
`;

export async function getFacture(id: string | number) {
  return graphqlRequest<{ facture: Facture | null }>(GET_FACTURE, { id });
}

const CREATE_FACTURE = `
  mutation CreateFacture($input: CreateFactureInput!) {
    createFacture(input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

export async function createFacture(input: CreateFactureInput) {
  return graphqlRequest<{ createFacture: Facture }>(CREATE_FACTURE, { input });
}

const UPDATE_FACTURE = `
  mutation UpdateFacture($id: ID!, $input: UpdateFactureInput!) {
    updateFacture(id: $id, input: $input) {
      ${FACTURE_FIELDS}
    }
  }
`;

function sanitizeFactureInput(input: UpdateFactureInput) {
  const {
    numero_facture,
    date_facture,
    montant_ht,
    emballage_id,
    quantite_facturee,
    commande_id,
    statut,
  } = input;

  const sanitized: UpdateFactureInput = {};

  if (numero_facture !== undefined) sanitized.numero_facture = numero_facture;
  if (date_facture !== undefined) sanitized.date_facture = date_facture;
  if (montant_ht !== undefined) sanitized.montant_ht = montant_ht;
  if (emballage_id !== undefined) sanitized.emballage_id = emballage_id;
  if (quantite_facturee !== undefined) {
    sanitized.quantite_facturee = quantite_facturee;
  }
  if (commande_id !== undefined) sanitized.commande_id = commande_id;
  if (statut !== undefined) sanitized.statut = statut;

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