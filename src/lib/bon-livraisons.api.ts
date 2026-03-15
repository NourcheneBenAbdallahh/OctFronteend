import { graphqlRequest } from "./graphqlClient";
import {
  BonLivraison,
  BonLivraisonsPaginatorInfo,
  CreateBonLivraisonInput,
  TableBonLivraison,
  UpdateBonLivraisonInput,
} from "@/types/bon-livraison";

export function normalizeBonLivraison(
  item: BonLivraison
): TableBonLivraison {
  return {
    ...item,
    id: item.id,
    statut: item.statut === "VALIDE" ? "VALIDE" : "EN_ATTENTE",
  };
}

export type ListBonLivraisonsResponse = {
  bonLivraisons: {
    data: BonLivraison[];
    paginatorInfo: BonLivraisonsPaginatorInfo;
  };
};

const BON_LIVRAISON_FIELDS = `
  id
  numero_bl
  date_reception
  statut
  emballage_id
  quantite_recue
  numero_commande
  commande_id
  entrepot_id
  receptionne_par
  document_bl
  date_validation
  validated_by
  created_at
  updated_at
`;

const LIST_BON_LIVRAISONS = `
  query ListBonLivraisons($page: Int!) {
    bonLivraisons(page: $page) {
      data {
        ${BON_LIVRAISON_FIELDS}
      }
      paginatorInfo {
        count
        currentPage
        lastPage
        perPage
        total
      }
    }
  }
`;

export async function listBonLivraisons(page = 1) {
  return graphqlRequest<ListBonLivraisonsResponse>(LIST_BON_LIVRAISONS, {
    page,
  });
}

const GET_BON_LIVRAISON = `
  query GetBonLivraison($id: ID!) {
    bonLivraison(id: $id) {
      ${BON_LIVRAISON_FIELDS}
    }
  }
`;

export async function getBonLivraison(id: string | number) {
  return graphqlRequest<{ bonLivraison: BonLivraison | null }>(
    GET_BON_LIVRAISON,
    { id }
  );
}

const CREATE_BON_LIVRAISON = `
  mutation CreateBonLivraison($input: CreateBonLivraisonInput!) {
    createBonLivraison(input: $input) {
      ${BON_LIVRAISON_FIELDS}
    }
  }
`;

export async function createBonLivraison(input: CreateBonLivraisonInput) {
  return graphqlRequest<{ createBonLivraison: BonLivraison }>(
    CREATE_BON_LIVRAISON,
    { input }
  );
}

const UPDATE_BON_LIVRAISON = `
  mutation UpdateBonLivraison($id: ID!, $input: UpdateBonLivraisonInput!) {
    updateBonLivraison(id: $id, input: $input) {
      ${BON_LIVRAISON_FIELDS}
    }
  }
`;

function sanitizeBonLivraisonInput(input: UpdateBonLivraisonInput) {
  const {
    date_reception,
    emballage_id,
    quantite_recue,
    numero_commande,
    entrepot_id,
    statut,
  } = input;
  const sanitized: UpdateBonLivraisonInput = {};
  if (date_reception !== undefined) sanitized.date_reception = date_reception;
  if (emballage_id !== undefined) sanitized.emballage_id = emballage_id;
  if (quantite_recue !== undefined) sanitized.quantite_recue = quantite_recue;
  if (numero_commande !== undefined) sanitized.numero_commande = numero_commande;
  if (entrepot_id !== undefined) sanitized.entrepot_id = entrepot_id;
  if (statut !== undefined) sanitized.statut = statut;

  return sanitized;
}

export async function updateBonLivraison(
  id: string | number,
  input: UpdateBonLivraisonInput
) {
  const sanitizedInput = sanitizeBonLivraisonInput(input);

  return graphqlRequest<{ updateBonLivraison: BonLivraison }>(
    UPDATE_BON_LIVRAISON,
    {
      id,
      input: sanitizedInput,
    }
  );
}

const DELETE_BON_LIVRAISON = `
  mutation DeleteBonLivraison($id: ID!) {
    deleteBonLivraison(id: $id) {
      ${BON_LIVRAISON_FIELDS}
    }
  }
`;

export async function validateBonLivraisonWithDocument(
  id: string | number,
  file: File
) {
  const operations = JSON.stringify({
    query: `
      mutation ValidateBonLivraison($id: ID!, $document_bl: Upload!) {
        validateBonLivraison(id: $id, document_bl: $document_bl) {
          id
          numero_bl
          date_reception
          statut
          emballage_id
          quantite_recue
          numero_commande
          commande_id
          entrepot_id
          receptionne_par
          document_bl
          date_validation
          validated_by
          created_at
          updated_at
        }
      }
    `,
    variables: {
      id,
      document_bl: null,
    },
  });
  const map = JSON.stringify({
    "0": ["variables.document_bl"],
  });
  const formData = new FormData();
  formData.append("operations", operations);
  formData.append("map", map);
  formData.append("0", file);

  const response = await fetch(
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || "http://localhost:8000/graphql",
    {
      method: "POST",
      body: formData,
    }
  );

  const result = await response.json();

  // --- BLOC DEBUG AJOUTÉ ---
  if (result.errors || !response.ok) {
    console.group("🛑 DEBUG: validateBonLivraisonWithDocument");
    console.log("Status HTTP:", response.status);
    
    if (result.errors) {
      result.errors.forEach((err: any, index: number) => {
        console.error(`Erreur GraphQL [${index}]:`, err.message);
        if (err.extensions) {
          console.log("Extensions (Lighthouse/Laravel):", err.extensions);
        }
      });
    } else {
      console.error("Réponse réseau non-OK sans erreurs GraphQL explicites.");
    }
    console.groupEnd();
  }
  // -------------------------

  if (!response.ok || result.errors) {
    const message =
      result?.errors?.[0]?.message ||
      "Erreur lors de la validation du bon de livraison.";
    throw new Error(message);
  }

  return result.data.validateBonLivraison;
}

export async function deleteBonLivraison(id: string | number) {
  return graphqlRequest<{ deleteBonLivraison: BonLivraison }>(
    DELETE_BON_LIVRAISON,
    { id }
  );
}