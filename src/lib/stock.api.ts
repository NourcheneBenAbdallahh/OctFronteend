import type { Stock } from "@/types/stock";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql";

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};
async function graphqlFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const rawText = await res.text();

  let json: GraphQLResponse<T>;
  try {
    json = JSON.parse(rawText) as GraphQLResponse<T>;
  } catch {
    console.error("Invalid JSON response:", rawText);
    throw new Error("Réponse serveur invalide.");
  }

  if (!res.ok) {
    console.error("GraphQL HTTP error:", {
      status: res.status,
      statusText: res.statusText,
      body: json,
    });
    throw new Error(`GraphQL HTTP error: ${res.status}`);
  }

  if (json.errors?.length) {
    console.error("GraphQL errors detailed:", JSON.stringify(json.errors, null, 2));
    throw new Error(json.errors.map((e) => e.message).join(" | "));
  }

  if (!json.data) {
    throw new Error("No GraphQL data returned.");
  }

  return json.data;
}


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

export async function getStocks(page = 1, first = 50): Promise<Stock[]> {
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

  const data = await graphqlFetch<StocksQueryResponse>(query, { page, first });
  return data.stocks?.data ?? [];
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

  const data = await graphqlFetch<UpdateStockResponse>(query, { id, input });
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

  const data = await graphqlFetch<DeleteStockResponse>(query, { id });
  return data.deleteStock;
}