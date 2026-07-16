import type { Stock } from "@/types/stock";
import { graphqlRequest, type GraphqlRequestOptions } from "@/lib/graphqlClient";
import { dateToGraphqlDateTime, dateToGraphqlDateTimeOrNull } from "@/lib/graphqlDateTime";

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

export type StocksQueryFilters = {
  from?: string | null;
  to?: string | null;
  entrepot_id?: string | null;
  emballage_id?: string | null;
  sens?: "entree" | "sortie" | null;
  user_id?: string | null;
  search?: string | null;
  sort?: string | null;
};

export type StocksPageResult = {
  data: Stock[];
  paginatorInfo: {
    currentPage: number;
    lastPage: number;
    total: number;
    hasMorePages: boolean;
  };
};

export type StockDashboardStatsResult = {
  total_mouvements: number;
  total_entrees: number;
  total_sorties: number;
  mouvements_today: number;
};

const STOCK_FIELDS_LIST = `
  id
  entrepot_id
  emballage_id
  lot_id
  date_stock
  quantite
  sens
  user_id
  mouvement_stock_id
  entrepot {
    id
    nom
  }
  emballage {
    id
    name
    code
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
  mouvementStock {
    id
    code_mouvement
  }
`;

const STOCK_FIELDS_FULL = `
  id
  entrepot_id
  emballage_id
  lot_id
  date_stock
  quantite
  sens
  user_id
  mouvement_stock_id
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
  mouvementStock {
    id
    code_mouvement
  }
`;

/** Champs nécessaires au tableau de bord (évite timeout sur 10k+ lignes). */
const STOCK_FIELDS_BI = `
  id
  entrepot_id
  emballage_id
  lot_id
  date_stock
  quantite
  sens
  user_id
  entrepot {
    id
    nom
  }
  emballage {
    id
    name
    code
    min_stock
  }
`;

export async function fetchStocksPage(
  page = 1,
  first = 50,
  filters?: StocksQueryFilters,
  opts?: GraphqlRequestOptions
): Promise<StocksPageResult> {
  const query = `
    query GetStocksPage(
      $page: Int!
      $first: Int!
      $from: DateTime
      $to: DateTime
      $entrepot_id: ID
      $emballage_id: ID
      $sens: StockSens
      $user_id: ID
      $search: String
      $sort: String
    ) {
      stocks(
        page: $page
        first: $first
        from: $from
        to: $to
        entrepot_id: $entrepot_id
        emballage_id: $emballage_id
        sens: $sens
        user_id: $user_id
        search: $search
        sort: $sort
      ) {
        data {
          ${STOCK_FIELDS_LIST}
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
    {
      page,
      first,
      from: dateToGraphqlDateTimeOrNull(
        filters?.from ? new Date(filters.from) : null
      ),
      to: dateToGraphqlDateTimeOrNull(
        filters?.to ? new Date(filters.to) : null
      ),
      entrepot_id: filters?.entrepot_id ?? null,
      emballage_id: filters?.emballage_id ?? null,
      sens: filters?.sens ?? null,
      user_id: filters?.user_id ?? null,
      search: filters?.search ?? null,
      sort: filters?.sort ?? null,
    },
    opts
  );

  const stocks = data.stocks;
  return {
    data: stocks?.data ?? [],
    paginatorInfo: {
      currentPage: stocks?.paginatorInfo?.currentPage ?? page,
      lastPage: stocks?.paginatorInfo?.lastPage ?? 1,
      total: stocks?.paginatorInfo?.total ?? 0,
      hasMorePages: stocks?.paginatorInfo?.hasMorePages ?? false,
    },
  };
}

export async function fetchStockDashboardStats(
  filters?: StocksQueryFilters,
  opts?: GraphqlRequestOptions
): Promise<StockDashboardStatsResult> {
  const query = `
    query StockDashboardStats(
      $from: DateTime
      $to: DateTime
      $entrepot_id: ID
      $emballage_id: ID
      $sens: StockSens
      $user_id: ID
      $search: String
    ) {
      stockDashboardStats(
        from: $from
        to: $to
        entrepot_id: $entrepot_id
        emballage_id: $emballage_id
        sens: $sens
        user_id: $user_id
        search: $search
      ) {
        total_mouvements
        total_entrees
        total_sorties
        mouvements_today
      }
    }
  `;

  const data = await graphqlRequest<{
    stockDashboardStats: StockDashboardStatsResult;
  }>(
    query,
    {
      from: dateToGraphqlDateTimeOrNull(
        filters?.from ? new Date(filters.from) : null
      ),
      to: dateToGraphqlDateTimeOrNull(
        filters?.to ? new Date(filters.to) : null
      ),
      entrepot_id: filters?.entrepot_id ?? null,
      emballage_id: filters?.emballage_id ?? null,
      sens: filters?.sens ?? null,
      user_id: filters?.user_id ?? null,
      search: filters?.search ?? null,
    },
    opts
  );

  return data.stockDashboardStats;
}

export async function getStocks(
  page = 1,
  first = 50,
  opts?: GraphqlRequestOptions
): Promise<Stock[]> {
  const query = `
    query GetStocks($page: Int!, $first: Int!) {
      stocks(page: $page, first: $first) {
        data {
          ${STOCK_FIELDS_FULL}
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

async function fetchStockPages(
  firstPerPage: number,
  maxPages: number,
  opts?: GraphqlRequestOptions,
  filters?: StocksQueryFilters,
  light = false
): Promise<Stock[]> {
  const fields = light ? STOCK_FIELDS_BI : STOCK_FIELDS_FULL;
  const query = `
    query GetStocksPage($page: Int!, $first: Int!, $from: DateTime, $to: DateTime) {
      stocks(page: $page, first: $first, from: $from, to: $to) {
        data {
          ${fields}
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

  const acc: Stock[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await graphqlRequest<StocksQueryResponse>(
      query,
      {
        page,
        first: firstPerPage,
        from: dateToGraphqlDateTimeOrNull(
          filters?.from ? new Date(filters.from) : null
        ),
        to: dateToGraphqlDateTimeOrNull(
          filters?.to ? new Date(filters.to) : null
        ),
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

/** Charge toutes les pages de mouvements stock (limite de sécurité sur le nombre de pages). */
export async function getAllStocks(
  firstPerPage = 250,
  maxPages = 80,
  opts?: GraphqlRequestOptions
): Promise<Stock[]> {
  return fetchStockPages(firstPerPage, maxPages, opts);
}

/**
 * Mouvements stock depuis `from` (filtre serveur via GraphQL from/to).
 * `light=true` : payload allégé pour le tableau de bord.
 */
export async function getStocksSince(
  from: Date,
  to?: Date,
  opts?: GraphqlRequestOptions,
  firstPerPage = 300,
  maxPages = 40,
  light = false
): Promise<Stock[]> {
  return fetchStockPages(
    firstPerPage,
    maxPages,
    opts,
    {
      from: dateToGraphqlDateTime(from),
      to: dateToGraphqlDateTimeOrNull(to),
    },
    light
  );
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
        ${STOCK_FIELDS_FULL}
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
