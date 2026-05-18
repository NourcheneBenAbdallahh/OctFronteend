export type UniteMesure = {
  id: string;
  code: string;
  label: string;
  dimension: string;
  facteur_vers_kg?: number | null;
  facteur_vers_l?: number | null;
  sort_order: number;
  created_at?: string | null;
  updated_at?: string | null;
};
