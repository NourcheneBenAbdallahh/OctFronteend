import { graphqlRequest } from "./graphqlClient";
import { StockInventaire, TableInventaire, CreateInventaireInput } from "@/types/inventaire";

// 1. Définition des champs réutilisables
export const INVENTAIRE_FIELDS = `
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
`;

export function normalizeInventaire(inv: StockInventaire): TableInventaire {
  return {
    ...inv,
    entrepot_name: inv.entrepot?.nom || `Entrepôt #${inv.entrepot_id}`,
    emballage_name: inv.emballage?.name || `Emballage #${inv.emballage_id}`,
  };
}

// 2. Requêtes et Mutations
const LIST_INVENTAIRES = `
  query {
    stockInventaires {
      ${INVENTAIRE_FIELDS}
    }
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

// 3. Fonctions API avec gestion d'erreurs console
export async function listInventaires(): Promise<StockInventaire[]> {
  try {
    const data = await graphqlRequest<{ stockInventaires: StockInventaire[] }>(LIST_INVENTAIRES);
    return data.stockInventaires;
  } catch (error) {
    console.error("[API Inventaire] Erreur lors de la récupération de la liste :", error);
    return []; // Retourne un tableau vide pour éviter de faire crash le composant
  }
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
    return null;
  }
}

export async function updateInventaire(id: string, input: any): Promise<StockInventaire | null> {
  try {
    const data = await graphqlRequest<{ updateStockInventaire: StockInventaire }>(
      UPDATE_INVENTAIRE,
      { id, input }
    );
    return data.updateStockInventaire;
  } catch (error) {
    console.error(`[API Inventaire] Erreur lors de la mise à jour (ID: ${id}) :`, { input, error });
    return null;
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