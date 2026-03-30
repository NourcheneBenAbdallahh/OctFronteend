import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,
  MouvementStock,
} from "@/types/mouvement";

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://127.0.0.1:8000/graphql";

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  // 1. Récupération du token depuis l'objet complexe "auth-storage"
  const storage = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null;
  let token = null;

  if (storage) {
    try {
      const parsed = JSON.parse(storage);
      // Selon ta capture, le token est dans state.user.token
      token = parsed.state?.user?.token || parsed.state?.token;
    } catch (e) {
      console.error("Erreur de lecture du storage auth", e);
    }
  }

  // Debug pour ton PFE
  console.log("Token extrait :", token ? "✅ Trouvé" : "❌ Non trouvé");

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

    const json = (await res.json()) as {
      data?: T;
      errors?: { message: string; extensions?: any }[];
    };

    // Gestion des erreurs HTTP
    if (!res.ok) {
      console.error(`[HTTP ERROR ${res.status}]`, res.statusText);
      throw new Error(`Erreur HTTP ${res.status}`);
    }

    // Gestion des erreurs GraphQL
    if (json.errors?.length) {
      console.groupCollapsed(" [GraphQL Error] ", json.errors[0].message);
      console.table(json.errors);
      console.groupEnd();
      throw new Error(json.errors.map((e) => e.message).join(" | "));
    }

    if (!json.data) {
      throw new Error("Aucune donnée retournée par le serveur.");
    }

    return json.data;

  } catch (error) {
    console.error(" [Fetch Exception] ", error);
    throw error;
  }
}

// --- FONCTIONS API ---

export async function fetchMouvements(): Promise<MouvementStock[]> {
  const query = `
    query {
      mouvementStocks(first: 100) {
        data {
          id
          code_mouvement
          type_mouvement
          statut
          emballage_id
          lot_id
          entrepot_source_id
          entrepot_destination_id
          quantite
          date_mouvement
          user { id name }
          emballage { id code name }
          lot { id code_lot emballage_id }
          entrepotSource { id adresse }
          entrepotDestination { id adresse }
        }
      }
    }
  `;
  const data = await gql<{ mouvementStocks: { data: MouvementStock[] } }>(query);
  return data.mouvementStocks.data;
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