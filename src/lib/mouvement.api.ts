import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,MouvementsPageStats,
  MouvementStock, 
} from "@/types/mouvement";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://127.0.0.1:8000/graphql";

  
async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const storage = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;
  let token = null;

  if (storage) {
    try {
      const parsed = JSON.parse(storage);
      token = parsed.state?.user?.token || parsed.state?.token;
    } catch (e) {
      // console.error("Erreur de lecture du storage auth", e);
    }
  }

  // console.log("Token extrait :", token ? "✅ Trouvé" : "❌ Non trouvé");
  // console.log("GRAPHQL QUERY =", query);
  // console.log("GRAPHQL VARIABLES =", variables);

  try {
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });

    const json = await res.json();

    //console.log("GRAPHQL RAW RESPONSE =", json);

    if (!res.ok) {
     // console.error(`[HTTP ERROR ${res.status}]`, res.statusText);
      throw new Error(`Erreur HTTP ${res.status}`);
    }

    if (json.errors?.length) {
     // console.groupCollapsed("[GraphQL Error]");
      //console.table(json.errors);
      //console.groupEnd();
      throw new Error(json.errors.map((e: any) => e.message).join(" | "));
    }

    if (!json.data) {
      throw new Error("Aucune donnée retournée par le serveur.");
    }

    return json.data as T;
  } catch (error) {
    //console.error("[Fetch Exception]", error);
    throw error;
  }
}
export async function fetchMouvements(filters: {
  search?: string;
  type?: string;
  statut?: string;
  page?: number;
  first?: number;
} = {}) {
  const query = `
  query(
    $search: String,
    $type: MouvementType,
    $statut: MouvementStatut,
    $first: Int!,
    $page: Int!
  ) {
    mouvementStocks(
      search: $search,
      type_mouvement: $type,
      statut: $statut,
      first: $first,
      page: $page
    ) {
      data {
        id
        code_mouvement
        type_mouvement
        statut
        quantite
        date_mouvement   
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

  const data = await gql<{
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
export async function fetchEntrepots(): Promise<EntrepotRef[]> {
  const query = `
    query {
      entrepots {
        id
        adresse
      }
    }
  `;
  const data = await gql<{ entrepots: EntrepotRef[] }>(query);
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
  const data = await gql<{ emballages: { data: EmballageRef[] } }>(query);
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
  const data = await gql<{ lotsDisponiblesParEntrepotEtEmballage: LotDisponible[] }>(query, {
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
  return gql(mutation, { input });
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
  return gql(mutation, { input: { id } });
}

export async function deleteMouvementDraft(id: string) {
  const mutation = `
    mutation ($id: ID!) {
      deleteMouvementDraft(id: $id)
    }
  `;
  return gql(mutation, { id });
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
  const data = await gql<{ mouvementsStats: MouvementsPageStats }>(query);
  return data.mouvementsStats;
}