import type { Stock } from "@/types/stock";
import { graphqlRequest, type GraphqlRequestOptions } from "@/lib/graphqlClient";


type StocksQueryResponse = {
  stocks: {
    data: Stock[];
    paginatorInfo?: {
      currentPage: number;
      lastPage: number;
      total: number;
      hasMorePages: boolean;
    };
  };
};

type UpdateStockResponse = {
  updateStock: Stock;
};

type DeleteStockResponse = {
  deleteStock: Stock;
};

export async function getStocks(
  page = 1,
  first = 50,
  opts?: GraphqlRequestOptions
): Promise<Stock[]> {
  const query = `
    query GetStocks($page: Int!, $first: Int!) {
      stocks(page: $page, first: $first) {
        data {
          id
          entrepot_id
          emballage_id
          lot_id
          date_stock
 quantite
          sens
          user_id
          created_at
          updated_at
          entrepot {
            id
            nom
            
            adresse
          }
          emballage {
            id
            name
            code
            min_stock
            capacity_unit
          }
          lot {
            id
            code_lot
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

  const data = await graphqlRequest<StocksQueryResponse>(
    query,
    { page, first },
    opts
  );
  return data.stocks?.data ?? [];
}

const STOCKS_PAGE_QUERY = `
  query GetStocksPage($page: Int!, $first: Int!) {
    stocks(page: $page, first: $first) {
      data {
        id
        entrepot_id
        emballage_id
        lot_id
        date_stock
        quantite
        sens
        user_id
        created_at
        updated_at
        entrepot {
          id
          nom
          adresse
        }
        emballage {
          id
          name
          code
          min_stock
          capacity_unit
        }
        lot {
          id
          code_lot
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

/** Charge toutes les pages de mouvements stock (limite de sécurité sur le nombre de pages). */
export async function getAllStocks(
  firstPerPage = 250,
  maxPages = 80,
  opts?: GraphqlRequestOptions
): Promise<Stock[]> {
  const acc: Stock[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await graphqlRequest<StocksQueryResponse>(
      STOCKS_PAGE_QUERY,
      {
        page,
        first: firstPerPage,
      },
      opts
    );
    const chunk = data.stocks?.data ?? [];
    acc.push(...chunk);
    const p = data.stocks?.paginatorInfo;
    if (!p?.hasMorePages || page >= (p.lastPage ?? page)) break;
  }
  return acc;
}

export async function updateStock(
  id: string | number,
  input: {
    entrepot_id?: string | number;
    emballage_id?: string | number;
    lot_id?: string | number | null;
    date_stock?: string;
    quantite?: number;
    sens?: "entree" | "sortie";
    user_id?: string | number | null;
  }
): Promise<Stock> {
  const query = `
    mutation UpdateStock($id: ID!, $input: StockUpdateInput!) {
      updateStock(id: $id, input: $input) {
        id
        entrepot_id
        emballage_id
        lot_id
        date_stock
        quantite
        sens
        user_id
        created_at
        updated_at
        entrepot {
          id
          nom
          
          adresse
        }
        emballage {
          id
          name
          code
          min_stock
          capacity_unit
        }
        lot {
          id
          code_lot
        }
        user {
          id
          name
          email
        }
      }
    }
  `;

  const data = await graphqlRequest<UpdateStockResponse>(query, { id, input });
  return data.updateStock;
}

export async function deleteStock(id: string | number): Promise<Stock> {
  const query = `
    mutation DeleteStock($id: ID!) {
      deleteStock(id: $id) {
        id
        quantite
        sens
      }
    }
  `;

  const data = await graphqlRequest<DeleteStockResponse>(query, { id });
  return data.deleteStock;
}