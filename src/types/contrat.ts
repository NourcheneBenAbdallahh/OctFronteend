import { TableFournisseur } from "@/types/fournisseur";
import { TableEmballages } from "./emballage";

export type Contrat = {
id: string;
  numero_contrat: string;
  objet?: string | null;
  date_signature?: string | null;
  date_debut: string;
  date_fin: string;
  quantite_contractuelle: number;
  unite_quantite?: string | null;
  quantite_realisee?: number | null;
  taux_depassement_autorise?: number | null;
  montant_ht?: number | null;
  montant_tva?: number | null;
  montant_cautionnement?: number | null;
  taux_cautionnement?: number | null;
  taux_penalite_retard?: number | null;
  plafond_penalite?: number | null;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU";
  document_contrat?: string | null;
  note_statut?: string | null;

  fournisseur_id: string;
  emballage_id: string;

  fournisseur?: TableFournisseur;
  emballage?: TableEmballages;
  created_by?: string | number | null;
  modified_by?: string | number | null;

  created_at?: string | null;
  updated_at?: string | null;
};

export type TableContrat = Omit<Contrat, "statut"> & {
  id: string | number;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU";
};

export type ContratExtractionResult = {
  numero_contrat?: string | null;
  objet?: string | null;
  date_signature?: string | null;
  date_debut?: string | null;
  date_fin?: string | null;
  quantite_contractuelle?: number | null;
  unite_quantite?: string | null;
  montant_ht?: number | null;
  montant_tva?: number | null;
  montant_cautionnement?: number | null;
  taux_cautionnement?: number | null;
  taux_penalite_retard?: number | null;
  plafond_penalite?: number | null;
  taux_depassement_autorise?: number | null;
  statut?: "ACTIF" | "EXPIRE" | "SUSPENDU" | null;
  fournisseur_id?: string | null;
  emballage_id?: string | null;
};

export function normalizeContrat(c: Contrat): Contrat {
  return {
    ...c,
    objet: c.objet ?? null,
    date_signature: c.date_signature ?? null,
    quantite_realisee: c.quantite_realisee ?? 0,
    unite_quantite: c.unite_quantite ?? null,
    taux_depassement_autorise: c.taux_depassement_autorise ?? 0.2,
    montant_ht: c.montant_ht ?? null,
    montant_tva: c.montant_tva ?? 0,
    montant_cautionnement: c.montant_cautionnement ?? null,
    taux_cautionnement: c.taux_cautionnement ?? 3,
    taux_penalite_retard: c.taux_penalite_retard ?? 0.002,
    plafond_penalite: c.plafond_penalite ?? 5,
    statut: c.statut ?? "ACTIF",
    document_contrat: c.document_contrat ?? null,
    note_statut: c.note_statut ?? null,
    fournisseur: c.fournisseur ? { ...c.fournisseur } : undefined,
    emballage: c.emballage ? { ...c.emballage } : undefined,
    created_by: c.created_by ?? null,
    modified_by: c.modified_by ?? null,
    created_at: c.created_at ?? null,
    updated_at: c.updated_at ?? null,
  };
}

export function sanitizeContratInput(input: Partial<Contrat>) {
  const sanitized: Record<string, unknown> = {};
  if (input.numero_contrat !== undefined) sanitized.numero_contrat = input.numero_contrat;
  if (input.objet !== undefined) sanitized.objet = input.objet || null;
  if (input.date_signature !== undefined) sanitized.date_signature = input.date_signature || null;
  if (input.date_debut !== undefined) sanitized.date_debut = input.date_debut;
  if (input.date_fin !== undefined) sanitized.date_fin = input.date_fin;
  if (input.quantite_contractuelle !== undefined) sanitized.quantite_contractuelle = input.quantite_contractuelle;
  if (input.unite_quantite !== undefined) sanitized.unite_quantite = input.unite_quantite || null;
  if (input.quantite_realisee !== undefined) sanitized.quantite_realisee = input.quantite_realisee ?? 0;
  if (input.taux_depassement_autorise !== undefined) sanitized.taux_depassement_autorise = input.taux_depassement_autorise ?? 0.2;
  if (input.montant_ht !== undefined) sanitized.montant_ht = input.montant_ht ?? null;
  if (input.montant_tva !== undefined) sanitized.montant_tva = input.montant_tva ?? 0;
  if (input.montant_cautionnement !== undefined) sanitized.montant_cautionnement = input.montant_cautionnement ?? null;
  if (input.taux_cautionnement !== undefined) sanitized.taux_cautionnement = input.taux_cautionnement ?? 3;
  if (input.taux_penalite_retard !== undefined) sanitized.taux_penalite_retard = input.taux_penalite_retard ?? 0.002;
  if (input.plafond_penalite !== undefined) sanitized.plafond_penalite = input.plafond_penalite ?? 5;
  if (input.statut !== undefined) sanitized.statut = input.statut ?? "ACTIF";
  if (input.note_statut !== undefined) sanitized.note_statut = input.note_statut?.trim() || null;
  if (input.fournisseur_id !== undefined) sanitized.fournisseur_id = input.fournisseur_id;
  if (input.emballage_id !== undefined) sanitized.emballage_id = input.emballage_id;
  return sanitized;
}
