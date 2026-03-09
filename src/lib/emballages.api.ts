import { graphqlRequest } from "./graphqlClient";
import type { Emballages,TableEmballages } from "@/types/emballage";



const LIST_EMBALLAGES = `
 query ($first: Int!, $page: Int!) {
  emballages(first: $first, page: $page) {
    data {
      id
      code
      name
      type
      capacity_value
      capacity_unit
      material
      status
      created_at
      updated_at
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
  return graphqlRequest<{
    emballages: {
      data: Emballages[];
      paginatorInfo: { currentPage: number; lastPage: number; total: number };
    };
  }>(LIST_EMBALLAGES, { first, page });
}

const CREATE_EMBALLAGE = `
  mutation CreateEmballage($input: CreateEmballageInput!) {
    createEmballage(input: $input) {
      id code name type capacity_value capacity_unit material status created_at updated_at
    }
  }
`;

export async function createEmballages(input: Partial<Emballages> & Pick<Emballages, "code" | "name" | "type">) {
  return graphqlRequest<{ createEmballage: Emballages }>(CREATE_EMBALLAGE, { input });
}

const UPDATE_EMBALLAGE = `
  mutation UpdateEmballage($id: ID!, $input: UpdateEmballageInput!) {
    updateEmballage(id: $id, input: $input) {
      id
      code
      name
      type
      capacity_value
      capacity_unit
      material
      status
      created_at
      updated_at
    }
  }
`;

export async function updateEmballages(id: string | number, input: Partial<Emballages>) {
  return graphqlRequest<{ updateEmballage: Emballages }>(UPDATE_EMBALLAGE, { id, input });
}

const DELETE_EMBALLAGE = `
  mutation DeleteEmballage($id: ID!) {
    deleteEmballage(id: $id) {
      id
      code
      name
      type
      capacity_value
      capacity_unit
      material
      status
      created_at
      updated_at
    }
  }
`;

export async function deleteEmballages(id: string | number) {
  return graphqlRequest<{ deleteEmballage: Emballages }>(DELETE_EMBALLAGE, { id });
}

const FORCE_DELETE_EMBALLAGE = `
  mutation ForceDeleteEmballage($id: ID!) {
    forceDeleteEmballage(id: $id)
  }
`;

export async function forceDeleteEmballages(id: string | number) {
  return graphqlRequest<{ forceDeleteEmballage: boolean }>(FORCE_DELETE_EMBALLAGE, { id });
}

const RESTORE_EMBALLAGE = `
  mutation RestoreEmballage($id: ID!) {
    restoreEmballage(id: $id) {
      id
      code
      name
      type
      capacity_value
      capacity_unit
      material
      status
      created_at
      updated_at
    }
  }
`;

export async function restoreEmballages(id: string | number) {
  return graphqlRequest<{ restoreEmballage: Emballages }>(RESTORE_EMBALLAGE, { id });
}