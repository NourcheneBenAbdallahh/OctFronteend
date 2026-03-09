import { graphqlRequest } from "./graphqlClient";
import { listEmballages } from "./emballages.api";
import type { MouvementStock, MouvementType, Entrepot, Lot, Emballage } from "@/types/mouvement";

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://127.0.0.1:8000/graphql";

// Fonction générique GraphQL
async function gql<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join(" | "));
  if (!json.data) throw new Error("No data returned from GraphQL");

  return json.data;
}

// ---------------- Queries ----------------
export async function fetchEntrepots(): Promise<Entrepot[]> {
  const query = `
    query {
      entrepots {
        id
        adresse
      }
    }
  `;
  const data = await gql<{ entrepots: Entrepot[] }>(query);
  return data.entrepots;
}

export async function fetchLots(page = 1, first = 100): Promise<Lot[]> {
  const query = `
    query ($first: Int!, $page: Int!) {
      lots(first: $first, page: $page) {
        data { id code_lot }
      }
    }
  `;
  const data = await gql<{ lots: { data: Lot[] } }>(query, { first, page });
  return data.lots.data;
}

export async function fetchEmballages(page = 1, first = 100): Promise<Emballage[]> {
  // Utilisation de ton API emballages centralisée
  const res = await listEmballages(page, first);
  return res.emballages.data.map((e) => ({ id: e.id, code: e.code, name: e.name }));
}

export async function fetchMouvements(page = 1, first = 10) {
  const query = `
    query ($first: Int!, $page: Int!) {
      mouvementStocks(first: $first, page: $page) {
        data {
          id
          code_mouvement
          type_mouvement
          statut
          emballage_id
          quantite
          date_mouvement
          user_id
          lot_id
          entrepot_source_id
          entrepot_destination_id
          emballage { id code name }
          lot { id code_lot }
          entrepotSource { id adresse }
          entrepotDestination { id adresse }
        }
        paginatorInfo { currentPage lastPage total }
      }
    }
  `;
  return gql<{ mouvementStocks: { data: MouvementStock[]; paginatorInfo: any } }>(query, { first, page });
}

// ---------------- Mutations ----------------
export async function createMouvementDraft(input: {
  type_mouvement: MouvementType;
  emballage_id: string;
  lot_id?: string | null;
  entrepot_source_id?: string | null;
  entrepot_destination_id?: string | null;
  quantite: number;
  date_mouvement?: string | null;
}) {
  const mutation = `
    mutation ($input: CreateMouvementDraftInput!) {
      createMouvementDraft(input: $input) {
        id code_mouvement type_mouvement statut emballage_id quantite lot_id entrepot_source_id entrepot_destination_id
        emballage { id code name }
        lot { id code_lot }
        entrepotSource { id adresse }
        entrepotDestination { id adresse }
      }
    }
  `;
  return gql<{ createMouvementDraft: MouvementStock }>(mutation, { input });
}

export async function validateMouvement(id: string) {
  const mutation = `
    mutation ($input: ValidateMouvementInput!) {
      validateMouvement(input: $input) { id statut }
    }
  `;
  return gql<{ validateMouvement: MouvementStock }>(mutation, { input: { id } });
}

export async function deleteMouvementDraft(id: string) {
  const mutation = `
    mutation ($id: ID!) { deleteMouvementDraft(id: $id) }
  `;
  return gql<{ deleteMouvementDraft: boolean }>(mutation, { id });
}