// Lot.ts
export type Lot = {
  id: string;            // Identifiant unique du lot
  code_lot: string;      // Code du lot (ex: "LOT2026-01")
  date_creation?: string; // Date de création (optionnelle)
  date_expiration?: string; // Date d'expiration (optionnelle)
  quantite?: number;     // Quantité dans le lot (optionnelle)
};

// Entrepot.ts
export type Entrepot = {
  id: string;            // Identifiant unique de l'entrepôt
  name?: string;         // Nom de l'entrepôt
  adresse: string;       // Adresse complète
  capacite_max?: number; // Capacité maximale (optionnelle)
};