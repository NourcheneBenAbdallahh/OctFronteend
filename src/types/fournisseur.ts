export type Fournisseur = {
 id: string;
  raison_sociale: string;
  matricule_fiscale: string;
  registre_entreprise?: string | null;
  logo?: string | null;
  telephone?: string | null;
  email?: string | null;
  adresse?: string | null;
  representant_nom?: string | null;
  representant_role?: string | null;
  statut: "ACTIF" | "INACTIF";
  note_statut?: string | null;
  notes_evaluation?: string | null;

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
    telephone: f.telephone ?? null,
    adresse: f.adresse ?? null,
    registre_entreprise: f.registre_entreprise ?? null,
    representant_nom: f.representant_nom ?? null,
    representant_role: f.representant_role ?? null,
    latitude: f.latitude ?? null,
    longitude: f.longitude ?? null,
    adresse_geocodee: f.adresse_geocodee ?? null,
    geocoded_at: f.geocoded_at ?? null,
    email: f.email ?? null,
    note_statut: f.note_statut ?? null,
    notes_evaluation: f.notes_evaluation ?? null,
  };
}