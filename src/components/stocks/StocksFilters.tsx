"use client";

import {
  Search,
  Package,
  Warehouse,
  User,
  ArrowDownUp,
  CalendarDays,
} from "lucide-react";
import type { Stock, StockFiltersState } from "@/types/stock";

interface Props {
  rows: Stock[];
  filters: StockFiltersState;
  onChange: (filters: StockFiltersState) => void;
}

export default function StocksFilters({ rows, filters, onChange }: Props) {
  const entrepots = Array.from(
    new Map(
      rows
        .filter((r) => r.entrepot)
        .map((r) => [
          String(r.entrepot?.id),
          {
            id: String(r.entrepot?.id),
            label:
              r.entrepot?.nom ||
              r.entrepot?.name ||
              `Entrepôt #${r.entrepot_id}`,
          },
        ])
    ).values()
  );

  const emballages = Array.from(
    new Map(
      rows
        .filter((r) => r.emballage)
        .map((r) => [
          String(r.emballage?.id),
          {
            id: String(r.emballage?.id),
            label:
              r.emballage?.name ||
              r.emballage?.code ||
              `Emballage #${r.emballage_id}`,
          },
        ])
    ).values()
  );

  const users = Array.from(
    new Map(
      rows
        .filter((r) => r.user)
        .map((r) => [
          String(r.user?.id),
          {
            id: String(r.user?.id),
            label: r.user?.name || r.user?.email || `User #${r.user_id}`,
          },
        ])
    ).values()
  );

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        <div className="relative xl:col-span-2">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher par lot, entrepôt, emballage, utilisateur..."
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          />
        </div>

        <div className="relative">
          <ArrowDownUp
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={filters.sort}
            onChange={(e) =>
              onChange({
                ...filters,
                sort: e.target.value as StockFiltersState["sort"],
              })
            }
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          >
            <option value="recent">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="quantite_desc">Qté décroissante</option>
            <option value="quantite_asc">Qté croissante</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={filters.sens}
            onChange={(e) =>
              onChange({
                ...filters,
                sens: e.target.value as StockFiltersState["sens"],
              })
            }
            className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          >
            <option value="">Tous les sens</option>
            <option value="entree">Entrée</option>
            <option value="sortie">Sortie</option>
          </select>
        </div>

        <div className="relative">
          <Warehouse
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={filters.entrepot}
            onChange={(e) => onChange({ ...filters, entrepot: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          >
            <option value="">Tous les entrepôts</option>
            {entrepots.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Package
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={filters.emballage}
            onChange={(e) => onChange({ ...filters, emballage: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          >
            <option value="">Tous les emballages</option>
            {emballages.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <User
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <select
            value={filters.user}
            onChange={(e) => onChange({ ...filters, user: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          >
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <CalendarDays
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="date"
            value={filters.dateFrom || ""}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          />
        </div>

        <div className="relative">
          <CalendarDays
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="date"
            value={filters.dateTo || ""}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D] bg-white"
          />
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={() =>
            onChange({
              search: "",
              entrepot: "",
              emballage: "",
              sens: "",
              user: "",
              sort: "recent",
              dateFrom: "",
              dateTo: "",
            })
          }
          className="inline-flex items-center gap-2 px-3 py-2 rounded-sm text-sm border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition"
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
}