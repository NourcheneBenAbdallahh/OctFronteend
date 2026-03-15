import { graphqlRequest } from "./graphqlClient";
import { StockInventaire, TableInventaire, CreateInventaireInput } from "@/types/inventaire";

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
      id
      entrepot_id
      emballage_id
      stock_physique
      stock_theorique
      ecart
      user_id
      date_inventaire
      created_at
      periode_debut
      periode_fin
      entrepot { id nom }
      emballage { id name }
    }
  }
`;

export async function listInventaires(): Promise<StockInventaire[]> {
  const data = await graphqlRequest<{ stockInventaires: StockInventaire[] }>(
    LIST_INVENTAIRES
  );
  return data.stockInventaires;
}

const CREATE_INVENTAIRE = `
  mutation($input: CreateStockInventaireInput!) {
    createStockInventaire(input: $input) {
      id
      entrepot_id
      emballage_id
      stock_physique
      stock_theorique
      ecart
      user_id
      date_inventaire
      created_at
      periode_debut
      periode_fin
      entrepot { id nom }
      emballage { id name }
    }
  }
`;

export async function createInventaire(
  input: CreateInventaireInput
): Promise<StockInventaire> {
  const data = await graphqlRequest<{ createStockInventaire: StockInventaire }>(
    CREATE_INVENTAIRE,
    { input }
  );
  return data.createStockInventaire;
}

const UPDATE_INVENTAIRE = `
  mutation($id: ID!, $input: UpdateStockInventaireInput!) {
    updateStockInventaire(id: $id, input: $input) {
      id
      entrepot_id
      emballage_id
      stock_physique
      stock_theorique
      ecart
      user_id
      date_inventaire
      created_at
      periode_debut
      periode_fin
      entrepot { id nom }
      emballage { id name }
    }
  }
`;

export async function updateInventaire(
  id: string,
  input: Partial<StockInventaire>
): Promise<StockInventaire> {
  const data = await graphqlRequest<{ updateStockInventaire: StockInventaire }>(
    UPDATE_INVENTAIRE,
    { id, input }
  );
  return data.updateStockInventaire;
}

const DELETE_INVENTAIRE = `
  mutation($id: ID!) {
    deleteStockInventaire(id: $id) {
      id
    }
  }
`;

export async function deleteInventaire(id: string): Promise<boolean> {
  const data = await graphqlRequest<{ deleteStockInventaire: { id: string } }>(
    DELETE_INVENTAIRE,
    { id }
  );
  return !!data.deleteStockInventaire;
}