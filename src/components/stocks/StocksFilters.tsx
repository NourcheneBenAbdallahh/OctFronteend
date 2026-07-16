"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Warehouse,
  Package,
  User,
  ArrowDownUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
} from "lucide-react";
import type { Stock, StockFiltersState } from "@/types/stock";
import { FilterBarSelect } from "@/components/ui/FilterBarSelect";

interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  filterOptions: {
    entrepots: FilterOption[];
    emballages: FilterOption[];
    users: FilterOption[];
  };
  filters: StockFiltersState;
  onChange: (filters: StockFiltersState) => void;
}

const EMPTY_FILTERS: StockFiltersState = {
  search: "",
  entrepot: "",
  emballage: "",
  sens: "",
  user: "",
  sort: "recent",
  dateFrom: "",
  dateTo: "",
};

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "quantite_desc", label: "Qté décroissante" },
  { value: "quantite_asc", label: "Qté croissante" },
] as const;

function countActiveFilters(filters: StockFiltersState) {
  let count = 0;
  if (filters.entrepot) count += 1;
  if (filters.emballage) count += 1;
  if (filters.sens) count += 1;
  if (filters.user) count += 1;
  if (filters.sort !== "recent") count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

export default function StocksFilters({ filterOptions, filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveFilters(filters);

  const entrepots = filterOptions.entrepots;
  const emballages = filterOptions.emballages;
  const users = filterOptions.users;

  useEffect(() => {
    if (!showFilters) return;
    const onDocClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [showFilters]);

  return (
    <div ref={barRef} className="flex w-full min-w-0 flex-col gap-3">
      <div className="relative flex min-h-[52px] flex-1 items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm ring-indigo-500/10 transition-all focus-within:ring-2">
        <Search size={18} className="mr-3 shrink-0 text-gray-300" />
        <input
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Rechercher par lot, entrepôt, emballage ou utilisateur…"
          className="min-w-0 flex-1 outline-none text-sm font-medium placeholder:text-gray-300"
        />
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label={showFilters ? "Masquer les filtres" : "Afficher les filtres"}
          className={`relative ml-3 flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-all ${
            showFilters || activeCount > 0
              ? "bg-[#1C2434] text-white"
              : "text-gray-400 hover:bg-gray-50 hover:text-indigo-600"
          }`}
        >
          <Filter size={18} />
          {activeCount > 0 ? (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#00A09D] px-1 text-[9px] font-black text-white">
              {activeCount}
            </span>
          ) : showFilters ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {showFilters && (
        <div className="w-full min-w-0 rounded-[1.75rem] border border-gray-100 bg-gradient-to-br from-[#F0F4F4]/80 to-white p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex w-full min-w-0 flex-col gap-2.5">
            <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
              <span className="shrink-0 rounded-full bg-[#1C2434] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
                Filtrer les stocks
              </span>

              {(
                [
                  { id: "" as const, label: "Tous", icon: null },
                  { id: "entree" as const, label: "Entrées", icon: ArrowDownToLine },
                  { id: "sortie" as const, label: "Sorties", icon: ArrowUpFromLine },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id || "all"}
                  type="button"
                  onClick={() => onChange({ ...filters, sens: id })}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                    filters.sens === id
                      ? id === "sortie"
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                        : id === "entree"
                          ? "bg-[#00A09D] text-white shadow-md shadow-[#00A09D]/25"
                          : "bg-[#1C2434] text-white shadow-md"
                      : "border border-gray-100 bg-white text-gray-500 hover:border-[#00A09D]/40 hover:text-[#00A09D]"
                  }`}
                >
                  {Icon ? <Icon size={14} className="shrink-0" /> : null}
                  {label}
                </button>
              ))}
            </div>

            <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5">
              <FilterBarSelect
                value={filters.sort}
                onChange={(sort) =>
                  onChange({ ...filters, sort: sort as StockFiltersState["sort"] })
                }
                placeholder="Tri par défaut"
                ariaLabel="Trier les mouvements de stock"
                icon={<ArrowDownUp size={14} />}
                options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                triggerClassName="min-w-[148px] max-w-full"
              />

              <FilterBarSelect
                value={filters.entrepot}
                onChange={(entrepot) => onChange({ ...filters, entrepot })}
                placeholder="Tous les entrepôts"
                ariaLabel="Filtrer par entrepôt"
                icon={<Warehouse size={14} />}
                options={entrepots}
                triggerClassName="min-w-[148px] max-w-full"
              />

              <FilterBarSelect
                value={filters.emballage}
                onChange={(emballage) => onChange({ ...filters, emballage })}
                placeholder="Tous les emballages"
                ariaLabel="Filtrer par emballage"
                icon={<Package size={14} />}
                options={emballages}
                triggerClassName="min-w-[148px] max-w-full"
              />

              <FilterBarSelect
                value={filters.user}
                onChange={(user) => onChange({ ...filters, user })}
                placeholder="Tous les utilisateurs"
                ariaLabel="Filtrer par utilisateur"
                icon={<User size={14} />}
                options={users}
                triggerClassName="min-w-[148px] max-w-full"
              />

              <div className="flex h-11 min-w-0 max-w-full shrink-0 items-center gap-2 rounded-full border border-gray-100 bg-white px-4 shadow-sm">
                <CalendarDays size={14} className="shrink-0 text-[#00A09D]" aria-hidden />
                <input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
                  aria-label="Date de début"
                  className="min-w-0 w-[6.5rem] bg-transparent text-[10px] font-bold text-gray-500 outline-none"
                />
                <span className="text-gray-200" aria-hidden>
                  —
                </span>
                <input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
                  aria-label="Date de fin"
                  className="min-w-0 w-[6.5rem] bg-transparent text-[10px] font-bold text-gray-500 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => onChange(EMPTY_FILTERS)}
                disabled={!filters.search && activeCount === 0}
                className="flex h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-gray-100 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw size={15} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
