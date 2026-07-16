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
  mouvement_stock_id
  lot_id
  regularise_par
  regularise_at
  entrepot { id nom }
  emballage { id name }
  user { id name }
  regularisePar { id name }
  mouvementStock {
    id
    code_mouvement
    type_mouvement
    quantite
    statut
    date_mouvement
    user { id name }
  }
  lot { id code_lot quantite }
`;

export function normalizeInventaire(inv: StockInventaire): TableInventaire {
  return {
    ...inv,
    id: String(inv.id),
    entrepot_id: String(inv.entrepot_id),
    emballage_id: String(inv.emballage_id),
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

const STOCK_THEORIQUE_INVENTAIRE = `
  query(
    $entrepot_id: ID!
    $emballage_id: ID!
    $date_inventaire: DateTime!
    $periode_debut: DateTime
    $periode_fin: DateTime
  ) {
    stockTheoriqueInventaire(
      entrepot_id: $entrepot_id
      emballage_id: $emballage_id
      date_inventaire: $date_inventaire
      periode_debut: $periode_debut
      periode_fin: $periode_fin
    )
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
    throw error;
  }
}

export async function fetchStockTheoriqueInventaire(
  params: {
    entrepot_id: string;
    emballage_id: string;
    date_inventaire: string;
    periode_debut?: string;
    periode_fin?: string;
  },
  opts?: GraphqlRequestOptions
): Promise<number> {
  const data = await graphqlRequest<{ stockTheoriqueInventaire: number }>(
    STOCK_THEORIQUE_INVENTAIRE,
    {
      entrepot_id: params.entrepot_id,
      emballage_id: params.emballage_id,
      date_inventaire: params.date_inventaire,
      periode_debut: params.periode_debut || null,
      periode_fin: params.periode_fin || null,
    },
    opts
  );
  return data.stockTheoriqueInventaire;
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

export async function deleteInventaire(id: string): Promise<void> {
  const data = await graphqlRequest<{ deleteStockInventaire: { id: string } }>(
    DELETE_INVENTAIRE,
    { id }
  );
  if (!data.deleteStockInventaire?.id) {
    throw new Error("La suppression n'a pas abouti.");
  }
}

export async function regulariserInventaire(id: string): Promise<StockInventaire | null> {
  const data = await graphqlRequest<{ regulariserStockInventaire: StockInventaire }>(
    REGULARISER_INVENTAIRE,
    { id }
  );
  return data.regulariserStockInventaire;
}

export type GenererInventaireEntrepotParams = {
  entrepotId: string;
  dateInventaire: string;
  scope: "DAY" | "YEAR";
  codeSession?: string;
  periodeDebut?: string;
  periodeFin?: string;
};

export async function genererInventaireEntrepot(
  params: GenererInventaireEntrepotParams,
  opts?: GraphqlRequestOptions
): Promise<StockInventaire[]> {
  const data = await graphqlRequest<{ genererInventaireEntrepot: StockInventaire[] }>(
    GENERER_ENTREPOT,
    {
      input: {
        entrepot_id: params.entrepotId,
        date_inventaire: params.dateInventaire,
        scope: params.scope,
        code_session: params.codeSession,
        periode_debut: params.periodeDebut,
        periode_fin: params.periodeFin,
      },
    },
    opts
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
