export type Entrepot = {
  id: string;
  adresse: string;
  capacite_totale?: number | null;
  capacite_disponible?: number | null;
  statut: string;
};