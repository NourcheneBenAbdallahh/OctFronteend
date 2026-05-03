import { graphqlRequest } from "./graphqlClient";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Commande,
  CommandesPaginatorInfo,
  CreateCommandeInput,
  TableCommande,
  UpdateCommandeInput,
} from "@/types/commandes";

export function normalizeCommande(item: Commande): TableCommande {
  const allowed = [
    "EN_ATTENTE",
  "VALIDEE",
  "PARTIELLEMENT_RECEPTIONNEE",
  "RECEPTIONNEE",
  "ANNULEE",
  ] as const;

  return {
    ...item,
    id: item.id,
    statut: allowed.includes(item.statut as any)
      ? (item.statut as TableCommande["statut"])
      : "EN_ATTENTE",
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
  quantite_recue_total
  reste
  fournisseur_id
  contrat_id
  entrepot_id
  created_by
  created_at
  updated_at
`;

function getAuthToken(): string | undefined {
  const token = useAuthStore.getState().token;
  return token || undefined;
}

export async function listCommandes(
  page = 1,
  first = 100,
  opts?: { token?: string }
) {
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
  }>(query, { page, first }, { token: opts?.token });
}

export async function createCommande(input: CreateCommandeInput) {
  const mutation = `
    mutation CreateCommande($input: CreateCommandeInput!) {
      createCommande(input: $input) {
        ${COMMANDE_FIELDS}
      }
    }
  `;

  return graphqlRequest<{ createCommande: Commande }>(
    mutation,
    { input },
    { token: getAuthToken() }
  );
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

  return graphqlRequest<{ updateCommande: Commande }>(
    mutation,
    {
      id,
      input: sanitizeCommandeInput(input),
    },
    { token: getAuthToken() }
  );
}

export async function cancelCommande(id: string | number) {
  const mutation = `
    mutation CancelCommande($id: ID!) {
      cancelCommande(id: $id) {
        ${COMMANDE_FIELDS}
      }
    }
  `;

  return graphqlRequest<{ cancelCommande: Commande }>(
    mutation,
    { id },
    { token: getAuthToken() }
  );
}

export async function dropCommande(id: string | number) {
  const mutation = `
    mutation DropCommande($id: ID!) {
      dropCommande(id: $id)
    }
  `;

  return graphqlRequest<{ dropCommande: boolean }>(
    mutation,
    { id },
    { token: getAuthToken() }
  );
}