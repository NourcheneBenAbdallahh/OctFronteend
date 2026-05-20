import { graphqlRequest, type GraphqlRequestOptions } from "./graphqlClient";
import { StockInventaire, TableInventaire, CreateInventaireInput } from "@/types/inventaire";

export const INVENTAIRE_FIELDS = `
  id
  code_session
  entrepot_id
  emballage_id
  stock_physique
  stock_theorique
  stock_theorique_fige
  ecart
  statut
  motif_ecart
  user_id
  date_inventaire
  created_at
  periode_debut
  periode_fin
  regularisation_stock_id
  regularise_par
  regularise_at
  entrepot { id nom }
  emballage { id name }
  user { id name }
  regularisePar { id name }
`;

export function normalizeInventaire(inv: StockInventaire): TableInventaire {
  return {
    ...inv,
    entrepot_name: inv.entrepot?.nom || `Entrepôt #${inv.entrepot_id}`,
    emballage_name: inv.emballage?.name || `Emballage #${inv.emballage_id}`,
  };
}

const LIST_INVENTAIRES = `
  query {
    stockInventaires {
      ${INVENTAIRE_FIELDS}
    }
  }
`;

const STOCK_THEORIQUE_AT = `
  query($entrepot_id: ID!, $emballage_id: ID!, $at: DateTime!) {
    stockTheoriqueAt(entrepot_id: $entrepot_id, emballage_id: $emballage_id, at: $at)
  }
`;

const CREATE_INVENTAIRE = `
  mutation($input: CreateStockInventaireInput!) {
    createStockInventaire(input: $input) {
      ${INVENTAIRE_FIELDS}
    }
  }
`;

const UPDATE_INVENTAIRE = `
  mutation($id: ID!, $input: UpdateStockInventaireInput!) {
    updateStockInventaire(id: $id, input: $input) {
      ${INVENTAIRE_FIELDS}
    }
  }
`;

const DELETE_INVENTAIRE = `
  mutation($id: ID!) {
    deleteStockInventaire(id: $id) {
      id
    }
  }
`;

const REGULARISER_INVENTAIRE = `
  mutation($id: ID!) {
    regulariserStockInventaire(id: $id) {
      ${INVENTAIRE_FIELDS}
    }
  }
`;

const GENERER_ENTREPOT = `
  mutation($input: GenererInventaireEntrepotInput!) {
    genererInventaireEntrepot(input: $input) {
      ${INVENTAIRE_FIELDS}
    }
  }
`;

const REGULARISER_SESSION = `
  mutation($code_session: String!) {
    regulariserInventaireSession(code_session: $code_session)
  }
`;

export async function listInventaires(
  opts?: GraphqlRequestOptions
): Promise<StockInventaire[]> {
  try {
    const data = await graphqlRequest<{ stockInventaires: StockInventaire[] }>(
      LIST_INVENTAIRES,
      {},
      opts
    );
    return data.stockInventaires;
  } catch (error) {
    console.error("[API Inventaire] Erreur lors de la récupération de la liste :", error);
    return [];
  }
}

export async function fetchStockTheoriqueAt(
  entrepotId: string,
  emballageId: string,
  at: string,
  opts?: GraphqlRequestOptions
): Promise<number> {
  const data = await graphqlRequest<{ stockTheoriqueAt: number }>(
    STOCK_THEORIQUE_AT,
    { entrepot_id: entrepotId, emballage_id: emballageId, at },
    opts
  );
  return data.stockTheoriqueAt;
}

export async function createInventaire(input: CreateInventaireInput): Promise<StockInventaire | null> {
  try {
    const data = await graphqlRequest<{ createStockInventaire: StockInventaire }>(
      CREATE_INVENTAIRE,
      { input }
    );
    return data.createStockInventaire;
  } catch (error) {
    console.error("[API Inventaire] Erreur lors de la création :", { input, error });
    throw error;
  }
}

export async function updateInventaire(id: string, input: Record<string, unknown>): Promise<StockInventaire | null> {
  try {
    const data = await graphqlRequest<{ updateStockInventaire: StockInventaire }>(
      UPDATE_INVENTAIRE,
      { id, input }
    );
    return data.updateStockInventaire;
  } catch (error) {
    console.error(`[API Inventaire] Erreur lors de la mise à jour (ID: ${id}) :`, { input, error });
    throw error;
  }
}

export async function deleteInventaire(id: string): Promise<boolean> {
  try {
    const data = await graphqlRequest<{ deleteStockInventaire: { id: string } }>(
      DELETE_INVENTAIRE,
      { id }
    );
    return !!data.deleteStockInventaire;
  } catch (error) {
    console.error(`[API Inventaire] Erreur lors de la suppression (ID: ${id}) :`, error);
    return false;
  }
}

export async function regulariserInventaire(id: string): Promise<StockInventaire | null> {
  const data = await graphqlRequest<{ regulariserStockInventaire: StockInventaire }>(
    REGULARISER_INVENTAIRE,
    { id }
  );
  return data.regulariserStockInventaire;
}

export async function genererInventaireEntrepot(
  entrepotId: string,
  dateInventaire: string,
  codeSession?: string
): Promise<StockInventaire[]> {
  const data = await graphqlRequest<{ genererInventaireEntrepot: StockInventaire[] }>(
    GENERER_ENTREPOT,
    { input: { entrepot_id: entrepotId, date_inventaire: dateInventaire, code_session: codeSession } }
  );
  return data.genererInventaireEntrepot;
}

export async function regulariserInventaireSession(codeSession: string): Promise<number> {
  const data = await graphqlRequest<{ regulariserInventaireSession: number }>(
    REGULARISER_SESSION,
    { code_session: codeSession }
  );
  return data.regulariserInventaireSession;
}
