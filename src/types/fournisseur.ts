export type FournisseurMapPoint = {
  id: string;
  raison_sociale: string;
  matricule_fiscale: string;
  adresse?: string | null;
  statut: "ACTIF" | "INACTIF";
  latitude: number | null;
  longitude: number | null;
  adresse_geocodee?: string | null;
};

