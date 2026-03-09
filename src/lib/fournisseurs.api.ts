import { graphqlRequest } from "./graphqlClient";

export type Fournisseur = {
  id: string;
  raison_sociale: string;
  matricule_fiscale: string;
  telephone?: string | null;
  adresse?: string | null;
  statut?: "ACTIF" | "INACTIF" | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TableFournisseur = Omit<Fournisseur, "statut"> & {
  id: string | number;
  statut: "ACTIF" | "INACTIF";
};

export function normalizeFournisseur(f: Fournisseur): TableFournisseur {
  return {
    ...f,
    id: f.id,
    statut: f.statut === "INACTIF" ? "INACTIF" : "ACTIF",
  };
}

const LIST_FOURNISSEURS = `
  query {
    fournisseurs {
      id
      raison_sociale
      matricule_fiscale
      telephone
      adresse
      statut
      created_at
      updated_at
    }
  }
`;

export async function listFournisseurs() {
  return graphqlRequest<{ fournisseurs: Fournisseur[] }>(
    LIST_FOURNISSEURS
  );
}

const CREATE_FOURNISSEUR = `
  mutation CreateFournisseur($input: FournisseurCreateInput!) {
    createFournisseur(input: $input) {
      id
      raison_sociale
      matricule_fiscale
      telephone
      adresse
      statut
      created_at
      updated_at
    }
  }
`;

export async function createFournisseur(
  input: Omit<Fournisseur, "id" | "created_at" | "updated_at">
) {
  return graphqlRequest<{ createFournisseur: Fournisseur }>(
    CREATE_FOURNISSEUR,
    { input }
  );
}

const UPDATE_FOURNISSEUR = `
  mutation UpdateFournisseur($id: ID!, $input: FournisseurUpdateInput!) {
    updateFournisseur(id: $id, input: $input) {
      id
      raison_sociale
      matricule_fiscale
      telephone
      adresse
      statut
      created_at
      updated_at
    }
  }
`;
function sanitizeFournisseurInput(input: Partial<Fournisseur>) {
  const { raison_sociale, matricule_fiscale, telephone, adresse, statut } = input;
  const sanitized: Partial<Fournisseur> = {};

  if (raison_sociale !== undefined) sanitized.raison_sociale = raison_sociale;
  if (matricule_fiscale !== undefined) sanitized.matricule_fiscale = matricule_fiscale;
  if (telephone !== undefined) sanitized.telephone = telephone;
  if (adresse !== undefined) sanitized.adresse = adresse;
  if (statut !== undefined) sanitized.statut = statut;

  return sanitized;
}
export async function updateFournisseur(
  id: string | number,
  input: Partial<Fournisseur>
) {
  const sanitizedInput = sanitizeFournisseurInput(input);

  return graphqlRequest<{ updateFournisseur: Fournisseur }>(
    UPDATE_FOURNISSEUR,
    { id, input: sanitizedInput }
  );
}
const DELETE_FOURNISSEUR = `
  mutation DeleteFournisseur($id: ID!) {
    deleteFournisseur(id: $id)
  }
`;

export async function deleteFournisseur(id: string | number) {
  return graphqlRequest<{ deleteFournisseur: boolean }>(
    DELETE_FOURNISSEUR,
    { id }
  );
}