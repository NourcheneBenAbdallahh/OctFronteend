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
  quantite_realisee?: number | null;
  taux_depassement_autorise?: number | null;
  montant_ht?: number | null;
  montant_tva?: number | null;
  taux_cautionnement?: number | null;
  taux_penalite_retard?: number | null;
  plafond_penalite?: number | null;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU";

  fournisseur_id: string;
  emballage_id: string;

  fournisseur?: TableFournisseur;
  emballage?: TableEmballages;

  created_at?: string | null;
  updated_at?: string | null;
};

export type TableContrat = Omit<Contrat, "statut"> & {
  id: string | number;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU";
};

export function normalizeContrat(c: Contrat): Contrat {
  return {
    ...c,
    objet: c.objet ?? null,
    date_signature: c.date_signature ?? null,
    quantite_realisee: c.quantite_realisee ?? 0,
    taux_depassement_autorise: c.taux_depassement_autorise ?? 0.2,
    montant_ht: c.montant_ht ?? null,
    montant_tva: c.montant_tva ?? 0,
    taux_cautionnement: c.taux_cautionnement ?? 3,
    taux_penalite_retard: c.taux_penalite_retard ?? 0.002,
    plafond_penalite: c.plafond_penalite ?? 5,
    statut: c.statut ?? "ACTIF",
    fournisseur: c.fournisseur ? { ...c.fournisseur } : undefined,
    emballage: c.emballage ? { ...c.emballage } : undefined,
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
  if (input.quantite_realisee !== undefined) sanitized.quantite_realisee = input.quantite_realisee ?? 0;
  if (input.taux_depassement_autorise !== undefined) sanitized.taux_depassement_autorise = input.taux_depassement_autorise ?? 0.2;
  if (input.montant_ht !== undefined) sanitized.montant_ht = input.montant_ht ?? null;
  if (input.montant_tva !== undefined) sanitized.montant_tva = input.montant_tva ?? 0;
  if (input.taux_cautionnement !== undefined) sanitized.taux_cautionnement = input.taux_cautionnement ?? 3;
  if (input.taux_penalite_retard !== undefined) sanitized.taux_penalite_retard = input.taux_penalite_retard ?? 0.002;
  if (input.plafond_penalite !== undefined) sanitized.plafond_penalite = input.plafond_penalite ?? 5;
  if (input.statut !== undefined) sanitized.statut = input.statut ?? "ACTIF";
  if (input.fournisseur_id !== undefined) sanitized.fournisseur_id = input.fournisseur_id;
  if (input.emballage_id !== undefined) sanitized.emballage_id = input.emballage_id;
  return sanitized;
}
