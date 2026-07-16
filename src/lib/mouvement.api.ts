import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,MouvementsPageStats,
  MouvementStock, 
} from "@/types/mouvement";
import { graphqlRequest } from "@/lib/graphqlClient";
export async function fetchMouvements(filters: {
  search?: string;
  type?: string;
  statut?: string;
  sort?: "recent" | "oldest";
  page?: number;
  first?: number;
} = {}) {
  const query = `
  query(
    $search: String,
    $type: MouvementType,
    $statut: MouvementStatut,
    $orderBy: [QueryMouvementStocksOrderByOrderByClause!],
    $first: Int!,
    $page: Int!
  ) {
    mouvementStocks(
      search: $search,
      type_mouvement: $type,
      statut: $statut,
      orderBy: $orderBy,
      first: $first,
      page: $page
    ) {
      data {
        id
        code_mouvement
        type_mouvement
        statut
        quantite
        motif
        date_mouvement
        emballage_id
        lot_id
        entrepot_source_id
        entrepot_destination_id
        emballage {     
          id
          code
          name
        }
        lot {         
          id
          code_lot
          emballage_id
        }
        user {         
          id
          name
        }
        entrepotSource {
          id
          nom
        }
        entrepotDestination {
          id
          nom
        }
      }
      paginatorInfo {
        currentPage
        lastPage
        total
        perPage
        hasMorePages
      }
    }
  }
`;

  const variables: Record<string, any> = {
    first: filters.first ?? 10,
    page: filters.page ?? 1,
    orderBy: [
      {
        column: "DATE_MOUVEMENT",
        order: filters.sort === "oldest" ? "ASC" : "DESC",
      },
    ],
  };

  if (filters.search?.trim()) {
    variables.search = filters.search.trim();
  }

  if (filters.type && filters.type !== "ALL") {
    variables.type = filters.type;
  }

  if (filters.statut && filters.statut !== "ALL") {
    variables.statut = filters.statut;
  }

  const data = await graphqlRequest<{
    mouvementStocks: {
      data: MouvementStock[];
      paginatorInfo: {
        currentPage: number;
        lastPage: number;
        total: number;
        perPage: number;
        hasMorePages: boolean;
      };
    };
  }>(query, variables);

 // console.log("MOUVEMENTS RETOURNÉS =", data.mouvementStocks);

  return data.mouvementStocks;
}

export async function fetchMouvementById(id: string | number): Promise<MouvementStock | null> {
  const query = `
    query GetMouvement($id: ID!) {
      mouvementStock(id: $id) {
        id
        code_mouvement
        type_mouvement
        statut
        quantite
        motif
        date_mouvement
        emballage_id
        lot_id
        entrepot_source_id
        entrepot_destination_id
        emballage {
          id
          code
          name
        }
        lot {
          id
          code_lot
          emballage_id
        }
        user {
          id
          name
        }
        entrepotSource {
          id
          nom
        }
        entrepotDestination {
          id
          nom
        }
      }
    }
  `;

  const data = await graphqlRequest<{ mouvementStock: MouvementStock | null }>(query, { id });
  return data.mouvementStock ?? null;
}

export async function fetchEntrepots(): Promise<EntrepotRef[]> {
  const query = `
    query {
      entrepots {
        id
        nom
        adresse
      }
    }
  `;
  const data = await graphqlRequest<{ entrepots: EntrepotRef[] }>(query);
  return data.entrepots;
}

export async function fetchEmballages(): Promise<EmballageRef[]> {
  const query = `
    query {
      emballages(first: 100) {
        data {
          id
          code
          name
        }
      }
    }
  `;
  const data = await graphqlRequest<{ emballages: { data: EmballageRef[] } }>(query);
  return data.emballages.data;
}

export async function fetchLotsDisponibles(
  entrepot_id: string,
  emballage_id: string
): Promise<LotDisponible[]> {
  const query = `
    query ($entrepot_id: ID!, $emballage_id: ID!) {
      lotsDisponiblesParEntrepotEtEmballage(
        entrepot_id: $entrepot_id
        emballage_id: $emballage_id
      ) {
        lot_id
        entrepot_id
        emballage_id
        stock_disponible
        code_lot
      }
    }
  `;
  const data = await graphqlRequest<{ lotsDisponiblesParEntrepotEtEmballage: LotDisponible[] }>(query, {
    entrepot_id,
    emballage_id,
  });
  return data.lotsDisponiblesParEntrepotEtEmballage;
}

export async function createMouvementDraft(input: {
  type_mouvement: string;
  emballage_id: string;
  lot_id?: string | null;
  entrepot_source_id?: string | null;
  entrepot_destination_id?: string | null;
  quantite: number;
  date_mouvement?: string | null;
  motif?: string | null;
}) {
  const mutation = `
    mutation ($input: CreateMouvementDraftInput!) {
      createMouvementDraft(input: $input) {
        id
        code_mouvement
        statut
      }
    }
  `;
  return graphqlRequest(mutation, { input });
}

export async function validateMouvement(id: string) {
  const mutation = `
    mutation ($input: ValidateMouvementInput!) {
      validateMouvement(input: $input) {
        id
        code_mouvement
        type_mouvement
        statut
      }
    }
  `;
  return graphqlRequest(mutation, { input: { id } });
}

export async function deleteMouvementDraft(id: string) {
  const mutation = `
    mutation ($id: ID!) {
      deleteMouvementDraft(id: $id)
    }
  `;
  return graphqlRequest(mutation, { id });
}
export async function fetchGlobalStats(): Promise<MouvementsPageStats> {
  const query = `
    query {
      mouvementsStats {
        total
        brouillons
        valides
        transferts
        sortiesProduction
        pertes
        surplus
      }
    }
  `;
  const data = await graphqlRequest<{ mouvementsStats: MouvementsPageStats }>(query);
  return data.mouvementsStats;
}