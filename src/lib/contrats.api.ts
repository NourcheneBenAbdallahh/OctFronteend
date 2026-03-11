import { graphqlRequest } from "./graphqlClient";
import { Contrat } from "../types/contrat";

const LIST_CONTRATS = `
  query {
    contrats {
      id
      numero_contrat
      date_debut
      date_fin
      quantite_contractuelle
      taux_depassement_autorise
      quantite_realisee
      statut
      fournisseur_id
       fournisseur {
      id
      raison_sociale
    }

    emballage_id
    emballage {
      id
      name
    }
      created_at
      updated_at
    }
  }
`;

export async function listContrats() {
  return graphqlRequest<{ contrats: Contrat[] }>(LIST_CONTRATS);
}

const CREATE_CONTRAT = `
  mutation CreateContrat($input: CreateContratInput!) {
    createContrat(input: $input) {
      id
      numero_contrat
      date_debut
      date_fin
      quantite_contractuelle
      taux_depassement_autorise
      quantite_realisee
      statut
      fournisseur_id
      emballage_id
      created_at
      updated_at
    }
  }
`;

export async function createContrat(
  input: Omit<Contrat, "id" | "created_at" | "updated_at">
) {
  return graphqlRequest<{ createContrat: Contrat }>(CREATE_CONTRAT, { input });
}

const UPDATE_CONTRAT = `
  mutation UpdateContrat($id: ID!, $input: UpdateContratInput!) {
    updateContrat(id: $id, input: $input) {
      id
      numero_contrat
      date_debut
      date_fin
      quantite_contractuelle
      taux_depassement_autorise
      quantite_realisee
      statut
      fournisseur_id
      emballage_id
      created_at
      updated_at
    }
  }
`;

export async function updateContrat(
  id: string | number,
  input: Partial<Contrat>
) {
  return graphqlRequest<{ updateContrat: Contrat }>(UPDATE_CONTRAT, { id, input });
}

const DELETE_CONTRAT = `
  mutation DeleteContrat($id: ID!) {
    deleteContrat(id: $id)
  }
`;

export async function deleteContrat(id: string | number) {
  return graphqlRequest<{ deleteContrat: boolean }>(DELETE_CONTRAT, { id });
}export async function restoreContrat(id: string | number) {
  const RESTORE_CONTRAT = `
    mutation RestoreContrat($id: ID!) {
      restoreContrat(id: $id) {
        id
        statut
      }
    }
  `;
  return graphqlRequest<{ restoreContrat: Contrat }>(RESTORE_CONTRAT, { id });
}