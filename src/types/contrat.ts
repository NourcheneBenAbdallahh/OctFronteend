import { TableFournisseur } from "@/lib/fournisseurs.api";
import { TableEmballages } from "./emballage";

export type Contrat = {
  id: string;
  numero_contrat: string;
  date_debut: string;
  date_fin: string;
  quantite_contractuelle: number;
  taux_depassement_autorise?: number | null;
  quantite_realisee?: number | null;
  statut?: "ACTIF" | "EXPIRE" | "SUSPENDU" | null;

  fournisseur_id: string;
  emballage_id: string;

  created_at?: string | null;
  updated_at?: string | null;

  // On utilise les types de tes autres APIs pour la cohérence
  fournisseur?: TableFournisseur; 
  emballage?: TableEmballages;
};

export type TableContrat = Omit<Contrat, "statut"> & {
  id: string | number;
  statut: "ACTIF" | "EXPIRE" | "SUSPENDU";
};

export function normalizeContrat(c: Contrat): TableContrat {
  return {
    ...c,
    id: c.id,
    statut:
      c.statut === "EXPIRE"
        ? "EXPIRE"
        : c.statut === "SUSPENDU"
        ? "SUSPENDU"
        : "ACTIF",
    // On s'assure que les sous-objets sont préservés lors de la normalisation
    fournisseur: c.fournisseur,
    emballage: c.emballage,
  };
}