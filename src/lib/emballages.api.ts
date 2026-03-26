import { graphqlRequest } from "./graphqlClient";
import  { Emballages,sanitizeUpdateEmballageInput } from "@/types/emballage";

export const EMBALLAGE_FIELDS = `
  id
  code
  name
  type
  min_stock
  description
  capacity_value
  capacity_unit
  poids
  epaisseur_pp
  epaisseur_ppc
  largeur
  material
  status
  created_at
  updated_at
`;

const LIST_EMBALLAGES = `
  query ($first: Int!, $page: Int!) {
    emballages(first: $first, page: $page) {
      data {
        ${EMBALLAGE_FIELDS}
      }
      paginatorInfo {
        currentPage
        lastPage
        total
        hasMorePages
      }
    }
  }
`;

export async function listEmballages(page = 1, first = 10) {
  try {
    return await graphqlRequest<{
      emballages: {
        data: Emballages[];
        paginatorInfo: { currentPage: number; lastPage: number; total: number };
      };
    }>(LIST_EMBALLAGES, { first, page });
  } catch (error) {
    console.error("Erreur listEmballages:", error);
    throw error; // on relance pour que le composant qui appelle puisse aussi gérer
  }
}

const CREATE_EMBALLAGE = `
  mutation CreateEmballage($input: CreateEmballageInput!) {
    createEmballage(input: $input) {
      ${EMBALLAGE_FIELDS}
    }
  }
`;

export async function createEmballages(input: Partial<Emballages> & Pick<Emballages, "code" | "name" | "type">) {
  try {
    return await graphqlRequest<{ createEmballage: Emballages }>(CREATE_EMBALLAGE, { input });
  } catch (error) {
    console.error("Erreur createEmballages:", error);
    throw error;
  }
}

const UPDATE_EMBALLAGE = `
  mutation UpdateEmballage($id: ID!, $input: UpdateEmballageInput!) {
    updateEmballage(id: $id, input: $input) {
      ${EMBALLAGE_FIELDS}
    }
  }
`;

export async function updateEmballages(id: string | number, input: Partial<Emballages>) {
  try {
    const sanitizedInput = sanitizeUpdateEmballageInput(input);

    return await graphqlRequest<{ updateEmballage: Emballages }>(
      UPDATE_EMBALLAGE,
      { id, input: sanitizedInput } // <-- on envoie l'objet filtré
    );
  } catch (error) {
    console.error("Erreur updateEmballages:", error);
    throw error;
  }
}
const DELETE_EMBALLAGE = `
  mutation DeleteEmballage($id: ID!) {
    deleteEmballage(id: $id) {
      ${EMBALLAGE_FIELDS}
    }
  }
`;

export async function deleteEmballages(id: string | number) {
  try {
    return await graphqlRequest<{ deleteEmballage: Emballages }>(DELETE_EMBALLAGE, { id });
  } catch (error) {
    console.error("Erreur deleteEmballages:", error);
    throw error;
  }
}

const FORCE_DELETE_EMBALLAGE = `
  mutation ForceDeleteEmballage($id: ID!) {
    forceDeleteEmballage(id: $id)
  }
`;

export async function forceDeleteEmballages(id: string | number) {
  try {
    return await graphqlRequest<{ forceDeleteEmballage: boolean }>(FORCE_DELETE_EMBALLAGE, { id });
  } catch (error) {
    console.error("Erreur forceDeleteEmballages:", error);
    throw error;
  }
}

const RESTORE_EMBALLAGE = `
  mutation RestoreEmballage($id: ID!) {
    restoreEmballage(id: $id) {
      ${EMBALLAGE_FIELDS}
    }
  }
`;

export async function restoreEmballages(id: string | number) {
  try {
    return await graphqlRequest<{ restoreEmballage: Emballages }>(RESTORE_EMBALLAGE, { id });
  } catch (error) {
    console.error("Erreur restoreEmballages:", error);
    throw error;
  }
}