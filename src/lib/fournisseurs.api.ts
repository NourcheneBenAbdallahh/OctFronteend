import { graphqlRequest } from "./graphqlClient";
import { Fournisseur} from "@/types/fournisseur";


const FOURNISSEUR_FIELDS = `
id
  raison_sociale
  logo
  matricule_fiscale
  registre_entreprise
  telephone
  email
  adresse
  representant_nom
  representant_role
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


export function sanitizeFournisseurInput(input: Partial<Fournisseur>) {
  const {
    raison_sociale,
    logo,
    matricule_fiscale,
    registre_entreprise,
    telephone,
    adresse,
    representant_nom,
    representant_role,
    statut,
    latitude,
    longitude,
    adresse_geocodee,
    geocoded_at,
  } = input;

  const sanitized: Record<string, unknown> = {};

  if (raison_sociale !== undefined) sanitized.raison_sociale = raison_sociale;
  if (logo !== undefined) sanitized.logo = logo || null;
  if (matricule_fiscale !== undefined) sanitized.matricule_fiscale = matricule_fiscale;
  if (registre_entreprise !== undefined) sanitized.registre_entreprise = registre_entreprise || null;
  if (telephone !== undefined) sanitized.telephone = telephone || null;
  if (adresse !== undefined) sanitized.adresse = adresse || null;
  if (representant_nom !== undefined) sanitized.representant_nom = representant_nom || null;
  if (representant_role !== undefined) sanitized.representant_role = representant_role || null;
  if (statut !== undefined) sanitized.statut = statut === "INACTIF" ? "INACTIF" : "ACTIF";

  if (latitude !== undefined) sanitized.latitude = latitude === null ? null : Number(latitude);
  if (longitude !== undefined) sanitized.longitude = longitude === null ? null : Number(longitude);
  if (adresse_geocodee !== undefined) sanitized.adresse_geocodee = adresse_geocodee || null;
  if (geocoded_at !== undefined) sanitized.geocoded_at = geocoded_at || null;

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