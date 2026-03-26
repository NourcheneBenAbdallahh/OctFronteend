import { graphqlRequest } from "./graphqlClient";
import { Contrat } from "../types/contrat";

export const CONTRAT_FIELDS = `
  id
  numero_contrat
  objet
  date_signature
  date_debut
  date_fin
  quantite_contractuelle
  quantite_realisee
  taux_depassement_autorise
  montant_ht
  montant_tva
  taux_cautionnement
  taux_penalite_retard
  plafond_penalite
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
`;


const LIST_CONTRATS = `
  query {
    contrats {
      ${CONTRAT_FIELDS}
    }
  }
`;

export async function listContrats() {
  return graphqlRequest<{ contrats: Contrat[] }>(LIST_CONTRATS);
}

const CREATE_CONTRAT = `
  mutation CreateContrat($input: CreateContratInput!) {
    createContrat(input: $input) {
      ${CONTRAT_FIELDS}
    }
  }
`;

export async function createContrat(input: Partial<Contrat> & { numero_contrat: string; date_debut: string; date_fin: string; quantite_contractuelle: number; fournisseur_id: string | number; emballage_id: string | number; }) {
  return graphqlRequest<{ createContrat: Contrat }>(CREATE_CONTRAT, { input });
}

const UPDATE_CONTRAT = `
  mutation UpdateContrat($id: ID!, $input: UpdateContratInput!) {
    updateContrat(id: $id, input: $input) {
      ${CONTRAT_FIELDS}
    }
  }
`;

export async function updateContrat(id: string | number, input: Partial<Contrat>) {
  return graphqlRequest<{ updateContrat: Contrat }>(UPDATE_CONTRAT, { id, input });
}

const DELETE_CONTRAT = `
  mutation DeleteContrat($id: ID!) {
    deleteContrat(id: $id)
  }
`;

export async function deleteContrat(id: string | number) {
  return graphqlRequest<{ deleteContrat: boolean }>(DELETE_CONTRAT, { id });
}

const RESTORE_CONTRAT = `
  mutation RestoreContrat($id: ID!) {
    restoreContrat(id: $id) {
      id
      statut
    }
  }
`;

export async function restoreContrat(id: string | number) {
  return graphqlRequest<{ restoreContrat: Contrat }>(RESTORE_CONTRAT, { id });
}