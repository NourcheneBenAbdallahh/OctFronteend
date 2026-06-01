"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  Package,
  Ruler,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { tourPageAttrs } from "@/lib/tourPageAttrs";
import type { TableEmballages } from "@/types/emballage";
import { FilterBarSelect } from "@/components/ui/FilterBarSelect";
import {
  countActiveEmballageFilters,
  EMPTY_EMBALLAGES_FILTERS,
  uniqueEmballageFilterOptions,
  type EmballagesFiltersState,
} from "./emballagesFilters";

const tour = tourPageAttrs("/emballages");

interface Props {
  rows: TableEmballages[];
  filters: EmballagesFiltersState;
  onChange: (filters: EmballagesFiltersState) => void;
}

export default function EmballagesFiltersBar({ rows, filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const activeCount = countActiveEmballageFilters(filters);
  const { types, materials, units } = uniqueEmballageFilterOptions(rows);

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
    <div ref={barRef} className="flex flex-col gap-3">
      <div className="relative flex min-h-[52px] flex-1 items-center rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm ring-indigo-500/10 transition-all focus-within:ring-2">
        <Search size={18} className="mr-3 shrink-0 text-gray-300" />
        <input
          {...tour.search}
          className="min-w-0 flex-1 outline-none text-sm font-medium placeholder:text-gray-300"
          placeholder="Rechercher par code, nom, type ou matériau…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
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
        <div className="rounded-[1.75rem] border border-gray-100 bg-gradient-to-br from-[#F0F4F4]/80 to-white p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative min-w-0">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#F0F4F4] to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white to-transparent"
              aria-hidden
            />

            <div className="flex items-center gap-2.5 overflow-x-auto overscroll-x-contain px-1 pb-2 filter-bar-scroll">
              <span className="shrink-0 rounded-full bg-[#1C2434] px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-sm">
                Filtrer le catalogue
              </span>

              <div className="h-8 w-px shrink-0 bg-gray-200/80" aria-hidden />

              {(
                [
                  { id: "" as const, label: "Tous", icon: null },
                  { id: "ACTIVE" as const, label: "Actifs", icon: CheckCircle2 },
                  { id: "INACTIVE" as const, label: "Inactifs", icon: XCircle },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id || "all"}
                  type="button"
                  onClick={() => onChange({ ...filters, status: id })}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                    filters.status === id
                      ? id === "INACTIVE"
                        ? "bg-red-500 text-white shadow-md shadow-red-500/20"
                        : id === "ACTIVE"
                          ? "bg-[#00A09D] text-white shadow-md shadow-[#00A09D]/25"
                          : "bg-[#1C2434] text-white shadow-md"
                      : "border border-gray-100 bg-white text-gray-500 hover:border-[#00A09D]/40 hover:text-[#00A09D]"
                  }`}
                >
                  {Icon ? <Icon size={14} className="shrink-0" /> : null}
                  {label}
                </button>
              ))}

              <div className="h-8 w-px shrink-0 bg-gray-200/80" aria-hidden />

              <FilterBarSelect
                value={filters.type}
                onChange={(type) => onChange({ ...filters, type })}
                placeholder="Tous les types"
                ariaLabel="Filtrer par type"
                icon={<Layers size={14} />}
                options={types.map((t) => ({ value: t, label: t }))}
              />

              <FilterBarSelect
                value={filters.material}
                onChange={(material) => onChange({ ...filters, material })}
                placeholder="Tous les matériaux"
                ariaLabel="Filtrer par matériau"
                icon={<Package size={14} />}
                options={materials.map((m) => ({ value: m, label: m }))}
              />

              <FilterBarSelect
                value={filters.capacityUnit}
                onChange={(capacityUnit) => onChange({ ...filters, capacityUnit })}
                placeholder="Toutes les unités"
                ariaLabel="Filtrer par unité"
                icon={<Ruler size={14} />}
                options={units.map((u) => ({ value: u, label: u }))}
              />

              <div className="h-8 w-px shrink-0 bg-gray-200/80" aria-hidden />

              <button
                type="button"
                onClick={() => onChange(EMPTY_EMBALLAGES_FILTERS)}
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
