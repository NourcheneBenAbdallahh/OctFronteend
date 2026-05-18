import { graphqlRequest, type GraphqlRequestOptions } from "./graphqlClient";
import type { UniteMesure } from "@/types/unite-mesure";

export const UNITE_MESURE_FIELDS = `
  id
  code
  label
  dimension
  facteur_vers_kg
  facteur_vers_l
  sort_order
  created_at
  updated_at
`;

const LIST_UNITES = `
  query UnitesMesure {
    unitesMesure {
      ${UNITE_MESURE_FIELDS}
    }
  }
`;

export async function listUnitesMesure(opts?: GraphqlRequestOptions) {
  return graphqlRequest<{ unitesMesure: UniteMesure[] }>(LIST_UNITES, {}, opts);
}

export type CreateUniteMesureInput = {
  code: string;
  label: string;
  dimension: string;
  facteur_vers_kg?: number | null;
  facteur_vers_l?: number | null;
  sort_order?: number | null;
};

export type UpdateUniteMesureInput = {
  label?: string;
  dimension?: string;
  facteur_vers_kg?: number | null;
  facteur_vers_l?: number | null;
  sort_order?: number | null;
};

const CREATE_UNITE = `
  mutation CreateUniteMesure($input: CreateUniteMesureInput!) {
    createUniteMesure(input: $input) {
      ${UNITE_MESURE_FIELDS}
    }
  }
`;

const UPDATE_UNITE = `
  mutation UpdateUniteMesure($id: ID!, $input: UpdateUniteMesureInput!) {
    updateUniteMesure(id: $id, input: $input) {
      ${UNITE_MESURE_FIELDS}
    }
  }
`;

const DELETE_UNITE = `
  mutation DeleteUniteMesure($id: ID!) {
    deleteUniteMesure(id: $id)
  }
`;

export async function createUniteMesure(input: CreateUniteMesureInput, opts?: GraphqlRequestOptions) {
  return graphqlRequest<{ createUniteMesure: UniteMesure }>(CREATE_UNITE, { input }, opts);
}

export async function updateUniteMesure(
  id: string | number,
  input: UpdateUniteMesureInput,
  opts?: GraphqlRequestOptions
) {
  return graphqlRequest<{ updateUniteMesure: UniteMesure }>(UPDATE_UNITE, { id: String(id), input }, opts);
}

export async function deleteUniteMesure(id: string | number, opts?: GraphqlRequestOptions) {
  return graphqlRequest<{ deleteUniteMesure: boolean }>(DELETE_UNITE, { id: String(id) }, opts);
}
