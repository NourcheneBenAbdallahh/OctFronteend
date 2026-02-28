import { graphqlRequest } from "./graphqlClient";

export type Packaging = {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity_value?: number | null;
  capacity_unit?: string | null;
  material?: string | null;
  status?: string | null;
};

const LIST_PACKAGINGS = `
 query ($first: Int!, $page: Int!) {
  packagings(first: $first, page: $page) {
    data {
      id
      code
      name
      type
      status
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

export async function listPackagings(page = 1, first = 10) {
  return graphqlRequest<{
    packagings: {
      data: Packaging[];
      paginatorInfo: { currentPage: number; lastPage: number; total: number };
    };
  }>(LIST_PACKAGINGS, { first, page });
}

const CREATE_PACKAGING = `
  mutation CreatePackaging($input: CreatePackagingInput!) {
    createPackaging(input: $input) {
      id code name type status
    }
  }
`;

export async function createPackaging(input: Partial<Packaging> & Pick<Packaging, "code" | "name" | "type">) {
  return graphqlRequest<{ createPackaging: Packaging }>(CREATE_PACKAGING, { input });
}