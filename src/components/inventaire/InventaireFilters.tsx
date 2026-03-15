"use client";

import { Filter, Search } from "lucide-react";
import type { InventaireFilters, TableInventaire } from "@/types/inventaire";

interface Props {
  data: TableInventaire[];
  filters: InventaireFilters;
  onChange: (filters: InventaireFilters) => void;
}

export default function InventaireFilters({ data, filters, onChange }: Props) {
  const entrepots = Array.from(
    new Map(data.map((i) => [i.entrepot_id, i.entrepot_name])).entries()
  );

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className="relative md:col-span-2">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher un emballage ou un entrepôt..."
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D]"
          />
        </div>

        <select
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as InventaireFilters["status"],
            })
          }
          className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
        >
          <option value="all">Tous les écarts</option>
          <option value="perfect">Conformes</option>
          <option value="negative">Écarts négatifs</option>
          <option value="positive">Écarts positifs</option>
        </select>

        <select
          value={filters.entrepot}
          onChange={(e) => onChange({ ...filters, entrepot: e.target.value })}
          className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
        >
          <option value="">Tous les entrepôts</option>
          {entrepots.map(([id, name]) => (
            <option key={id} value={String(id)}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={() =>
            onChange({
              search: "",
              status: "all",
              entrepot: "",
            })
          }
          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
        >
          <Filter size={14} />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}