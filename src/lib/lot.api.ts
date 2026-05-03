import { Lot } from "@/types/lot";
import { graphqlRequest, type GraphqlRequestOptions } from "@/lib/graphqlClient";

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
export type PaginatedLots = {
  data: Lot[];
  currentPage: number;
  lastPage: number;
  total: number;
  hasMorePages: boolean;
};

export async function getLots(
  page = 1,
  first = 12,
  opts?: GraphqlRequestOptions
): Promise<PaginatedLots> {
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

  const data = await graphqlRequest<LotsQueryResponse>(
    query,
    { page, first },
    opts
  );

  return {
    data: data.lots.data,
    currentPage: data.lots.paginatorInfo?.currentPage ?? 1,
    lastPage: data.lots.paginatorInfo?.lastPage ?? 1,
    total: data.lots.paginatorInfo?.total ?? 0,
    hasMorePages: data.lots.paginatorInfo?.hasMorePages ?? false,
  };
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

  const data = await graphqlRequest<{ updateLot: Lot }>(query, { id, input });
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

  const data = await graphqlRequest<DeleteLotResponse>(query, { id });
  return data.deleteLot;
}