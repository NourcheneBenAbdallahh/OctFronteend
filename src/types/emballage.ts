
export type Emballages = {
 id: string;
  code: string;
  name: string;
  type: string;
  description?: string | null;
  capacity_value?: number | null;
  min_stock?: number | null;
  capacity_unit?: string | null;
  poids?: number | null;
  epaisseur_pp?: number | null;
  epaisseur_ppc?: number | null;
  largeur?: number | null;
  material?: string | null;
  status: "ACTIVE" | "INACTIVE";

  created_at?: string | null;
  updated_at?: string | null;
};

export type EmballageDetails = {
  description?: string;
  poids?: number;
  epaisseur_pp?: number;
  epaisseur_ppc?: number;
  largeur?: number;
};

export type TableEmballages = Omit<Emballages, "status"> & {
  id: string | number;
  status: "ACTIVE" | "INACTIVE";
};


export function normalizeEmballages(e: Emballages): Emballages {
  return {
    ...e,
    description: e.description ?? null,
    capacity_value: e.capacity_value ?? null,
min_stock: e.min_stock ?? 0,
    capacity_unit: e.capacity_unit ?? null,
    poids: e.poids ?? null,
    epaisseur_pp: e.epaisseur_pp ?? null,
    epaisseur_ppc: e.epaisseur_ppc ?? null,
    largeur: e.largeur ?? null,
    material: e.material ?? null,
    status: e.status ?? 'ACTIVE',
    created_at: e.created_at ?? null,
    updated_at: e.updated_at ?? null,
  };
}

export function sanitizeEmballageInput(input: Partial<Emballages>) {
  const sanitized: Record<string, unknown> = {};
  if (input.code !== undefined) sanitized.code = input.code;
  if (input.name !== undefined) sanitized.name = input.name;
  if (input.type !== undefined) sanitized.type = input.type;
  if (input.min_stock !== undefined) sanitized.min_stock = input.min_stock ?? 0;
  if (input.description !== undefined) sanitized.description = input.description || null;
  if (input.capacity_value !== undefined) sanitized.capacity_value = input.capacity_value ?? null;
  if (input.capacity_unit !== undefined) sanitized.capacity_unit = input.capacity_unit || null;
  if (input.poids !== undefined) sanitized.poids = input.poids ?? null;
  if (input.epaisseur_pp !== undefined) sanitized.epaisseur_pp = input.epaisseur_pp ?? null;
  if (input.epaisseur_ppc !== undefined) sanitized.epaisseur_ppc = input.epaisseur_ppc ?? null;
  if (input.largeur !== undefined) sanitized.largeur = input.largeur ?? null;
  if (input.material !== undefined) sanitized.material = input.material || null;
  if (input.status !== undefined) sanitized.status = input.status || 'ACTIVE';
  return sanitized;
}

export type EmballageRef = {
  id: string
  code: string
  name: string
}

export function sanitizeUpdateEmballageInput(input: Partial<Emballages>) {
  const sanitized: Record<string, unknown> = {};
  if (input.name !== undefined) sanitized.name = input.name;
  if (input.type !== undefined) sanitized.type = input.type;
  if (input.description !== undefined) sanitized.description = input.description || null;
  if (input.capacity_value !== undefined) sanitized.capacity_value = input.capacity_value ?? null;
  if (input.capacity_unit !== undefined) sanitized.capacity_unit = input.capacity_unit || null;
  if (input.poids !== undefined) sanitized.poids = input.poids ?? null;
  if (input.epaisseur_pp !== undefined) sanitized.epaisseur_pp = input.epaisseur_pp ?? null;
  if (input.epaisseur_ppc !== undefined) sanitized.epaisseur_ppc = input.epaisseur_ppc ?? null;
  if (input.min_stock !== undefined) sanitized.min_stock = input.min_stock ?? 0;
  if (input.largeur !== undefined) sanitized.largeur = input.largeur ?? null;
  if (input.material !== undefined) sanitized.material = input.material || null;
  if (input.status !== undefined) sanitized.status = input.status || 'ACTIVE';
  return sanitized;
}