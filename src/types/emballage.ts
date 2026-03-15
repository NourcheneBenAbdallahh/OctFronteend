
export type Emballages = {
  id: string;
  code: string;
  name: string;
  type: string;
  capacity_value?: number | null;
  capacity_unit?: string | null;
  material?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};


export type TableEmballages = Omit<Emballages, "status"> & {
  id: string | number;
  status: "ACTIVE" | "INACTIVE";
};
export function normalizeEmballages(p: Emballages): TableEmballages {
  return {
    ...p,
    id: p.id,
    status: p.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  };
}
export type EmballageRef = {
  id: string
  code: string
  name: string
}