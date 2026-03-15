import { graphqlRequest } from "./graphqlClient";
import {
  Commande,
  CommandesPaginatorInfo,
  CreateCommandeInput,
  TableCommande,
  UpdateCommandeInput,
} from "@/types/commandes";

export function normalizeCommande(item: Commande): TableCommande {
  const allowed = [
    "BROUILLON",
    "VALIDEE",
    "LIVREP",
    "LIVREC",
    "ANNULEE",
  ] as const;

  return {
    ...item,
    id: item.id,
    statut: allowed.includes(item.statut as any)
      ? (item.statut as TableCommande["statut"])
      : "BROUILLON",
  };
}

const COMMANDE_FIELDS = `
  id
  numero_commande
  date_commande
  date_livraison_prevue
  statut
  emballage_id
  quantite
  fournisseur_id
  contrat_id
  entrepot_id
  created_by
  created_at
  updated_at
`;

export async function listCommandes(page = 1, first = 100) {
  const query = `
    query ListCommandes($page: Int!, $first: Int!) {
      commandes(page: $page, first: $first) {
        data {
          ${COMMANDE_FIELDS}
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

  return graphqlRequest<{
    commandes: {
      data: Commande[];
      paginatorInfo: CommandesPaginatorInfo;
    };
  }>(query, { page, first });
}

export async function createCommande(input: CreateCommandeInput) {
  const mutation = `
    mutation CreateCommande($input: CreateCommandeInput!) {
      createCommande(input: $input) {
        ${COMMANDE_FIELDS}
      }
    }
  `;

  return graphqlRequest<{ createCommande: Commande }>(mutation, { input });
}

function sanitizeCommandeInput(input: UpdateCommandeInput) {
  const {
    date_livraison_prevue,
    emballage_id,
    quantite,
    fournisseur_id,
    entrepot_id,
    statut,
  } = input;

  const sanitized: UpdateCommandeInput = {};

  if (date_livraison_prevue !== undefined) {
    sanitized.date_livraison_prevue = date_livraison_prevue;
  }
  if (emballage_id !== undefined) sanitized.emballage_id = emballage_id;
  if (quantite !== undefined) sanitized.quantite = quantite;
  if (fournisseur_id !== undefined) sanitized.fournisseur_id = fournisseur_id;
  if (entrepot_id !== undefined) sanitized.entrepot_id = entrepot_id;
  if (statut !== undefined) sanitized.statut = statut;

  return sanitized;
}

export async function updateCommande(
  id: string | number,
  input: UpdateCommandeInput
) {
  const mutation = `
    mutation UpdateCommande($id: ID!, $input: UpdateCommandeInput!) {
      updateCommande(id: $id, input: $input) {
        ${COMMANDE_FIELDS}
      }
    }
  `;

  return graphqlRequest<{ updateCommande: Commande }>(mutation, {
    id,
    input: sanitizeCommandeInput(input),
  });
}

export async function cancelCommande(id: string | number) {
  const mutation = `
    mutation CancelCommande($id: ID!) {
      cancelCommande(id: $id) {
        ${COMMANDE_FIELDS}
      }
    }
  `;

  return graphqlRequest<{ cancelCommande: Commande }>(mutation, { id });
}

export async function dropCommande(id: string | number) {
  const mutation = `
    mutation DropCommande($id: ID!) {
      dropCommande(id: $id)
    }
  `;

  return graphqlRequest<{ dropCommande: boolean }>(mutation, { id });
}