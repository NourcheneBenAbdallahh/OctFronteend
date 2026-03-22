import { graphqlRequest } from "./graphqlClient";

export type Fournisseur = {
  id: string;
  raison_sociale: string;
  logo?: string | null;
  matricule_fiscale: string;
  telephone?: string | null;
  adresse?: string | null;
  statut?: "ACTIF" | "INACTIF" | null;
  latitude?: number | null;
  longitude?: number | null;
  adresse_geocodee?: string | null;
  geocoded_at?: string | null;
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
    logo: f.logo ?? null,
    latitude: f.latitude ?? null,
    longitude: f.longitude ?? null,
    adresse_geocodee: f.adresse_geocodee ?? null,
    geocoded_at: f.geocoded_at ?? null,
  };
}

const FOURNISSEUR_FIELDS = `
  id
  raison_sociale
  logo
  matricule_fiscale
  telephone
  adresse
  statut
  latitude
  longitude
  adresse_geocodee
  geocoded_at
  created_at
  updated_at
`;

const LIST_FOURNISSEURS = `
  query {
    fournisseurs {
      ${FOURNISSEUR_FIELDS}
    }
  }
`;

export async function listFournisseurs() {
  return graphqlRequest<{ fournisseurs: Fournisseur[] }>(LIST_FOURNISSEURS);
}

const CREATE_FOURNISSEUR = `
  mutation CreateFournisseur($input: FournisseurCreateInput!) {
    createFournisseur(input: $input) {
      ${FOURNISSEUR_FIELDS}
    }
  }
`;

export async function createFournisseur(
  input: Omit<Fournisseur, "id" | "created_at" | "updated_at" | "geocoded_at">
) {
  return graphqlRequest<{ createFournisseur: Fournisseur }>(
    CREATE_FOURNISSEUR,
    { input }
  );
}

const UPDATE_FOURNISSEUR = `
  mutation UpdateFournisseur($id: ID!, $input: FournisseurUpdateInput!) {
    updateFournisseur(id: $id, input: $input) {
      ${FOURNISSEUR_FIELDS}
    }
  }
`;

function sanitizeFournisseurInput(input: Partial<Fournisseur>) {
  const {
    raison_sociale,
    logo,
    matricule_fiscale,
    telephone,
    adresse,
    statut,
    latitude,
    longitude,
    adresse_geocodee,
  } = input;

  const sanitized: Record<string, unknown> = {};

  if (raison_sociale !== undefined) sanitized.raison_sociale = raison_sociale;
  if (logo !== undefined) sanitized.logo = logo || null;
  if (matricule_fiscale !== undefined) sanitized.matricule_fiscale = matricule_fiscale;
  if (telephone !== undefined) sanitized.telephone = telephone || null;
  if (adresse !== undefined) sanitized.adresse = adresse || null;
  if (statut !== undefined) sanitized.statut = statut;

if (latitude !== undefined) {
  sanitized.latitude = latitude === null ? null : Number(latitude);
}

if (longitude !== undefined) {
  sanitized.longitude = longitude === null ? null : Number(longitude);
}

  if (adresse_geocodee !== undefined) {
    sanitized.adresse_geocodee = adresse_geocodee || null;
  }

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