import { graphqlRequest } from "./graphqlClient";

export type Entrepot = {
  id: string;
  adresse: string;
  capacite_totale?: number | null;
  capacite_disponible?: number | null;
  statut: string;
};

export async function fetchEntrepots() {
  const query = /* GraphQL */ `
    query {
      entrepots {
        id
        adresse
        capacite_totale
        capacite_disponible
        statut
      }
    }
  `;

  const res = await graphqlRequest<{ entrepots: Entrepot[] }>(query);
  return res.entrepots;
}

export async function createEntrepot(input: {
  adresse: string;
  capacite_totale?: number;
  capacite_disponible?: number;
  statut?: string;
}) {
  const mutation = /* GraphQL */ `
    mutation ($input: CreateEntrepotInput!) {
      createEntrepot(input: $input) {
        id
        adresse
        statut
      }
    }
  `;
  return graphqlRequest<{ createEntrepot: Entrepot }>(mutation, { input });
}

export async function updateEntrepot(input: {
  id: string;
  adresse?: string;
  capacite_totale?: number;
  capacite_disponible?: number;
  statut?: string;
}) {
  const mutation = /* GraphQL */ `
    mutation ($input: UpdateEntrepotInput!) {
      updateEntrepot(input: $input) {
        id
        adresse
        statut
      }
    }
  `;
  return graphqlRequest<{ updateEntrepot: Entrepot }>(mutation, { input });
}

export async function deleteEntrepot(id: string) {
  const mutation = /* GraphQL */ `
    mutation ($id: ID!) {
      deleteEntrepot(id: $id)
    }
  `;
  return graphqlRequest<{ deleteEntrepot: boolean }>(mutation, { id });
}