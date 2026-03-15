import { Lot } from "@/types/lot";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type LotsQueryResponse = {
  lots: {
    data: Lot[];
    paginatorInfo?: {
      currentPage: number;
      lastPage: number;
      total: number;
      hasMorePages: boolean;
    };
  };
};

type DeleteLotResponse = {
  deleteLot: Lot;
};

async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
    ...init,
  });

  if (!res.ok) {
    throw new Error(`GraphQL HTTP error: ${res.status}`);
  }

  const json: GraphQLResponse<T> = await res.json();

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(" | "));
  }

  if (!json.data) {
    throw new Error("No GraphQL data returned.");
  }

  return json.data;
}

export async function getLots(page = 1, first = 50): Promise<Lot[]> {
  const query = `
    query GetLots($page: Int!, $first: Int!) {
      lots(page: $page, first: $first) {
        data {
          id
          code_lot
          quantite
          date_mvt
          commentaire
          emballage_id
          user_id
          created_at
          updated_at
          emballage {
            id
            name
            
            code
          }
          user {
            id
            name
            email
          }
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

  const data = await graphqlFetch<LotsQueryResponse>(query, { page, first });
  return data.lots?.data ?? [];
}

export async function updateLot(
  id: string | number,
  input: {
    code_lot?: string;
    emballage_id?: string | number;
    quantite?: number;
    date_mvt?: string;
    commentaire?: string | null;
    user_id?: string | number | null;
    entrepot_id?: string | number;
    sens?: string;
  }
): Promise<Lot> {
  const query = `
    mutation UpdateLot($id: ID!, $input: LotUpdateInput!) {
      updateLot(id: $id, input: $input) {
        id
        code_lot
        quantite
        date_mvt
        commentaire
        emballage_id
        user_id
        created_at
        updated_at
        emballage {
          id
          name
          code
        }
        user {
          id
          name
          email
        }
      }
    }
  `;

  const data = await graphqlFetch<{ updateLot: Lot }>(query, { id, input });
  return data.updateLot;
}

export async function deleteLot(id: string | number): Promise<Lot> {
  const query = `
    mutation DeleteLot($id: ID!) {
      deleteLot(id: $id) {
        id
        code_lot
      }
    }
  `;

  const data = await graphqlFetch<DeleteLotResponse>(query, { id });
  return data.deleteLot;
}