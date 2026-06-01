import React from "react";
import { Box, ChevronRight, LayoutGrid, List } from "lucide-react";
import { tourPageAttrs } from "@/lib/tourPageAttrs";
import type { TableEmballages } from "@/types/emballage";
import EmballagesFiltersBar from "./EmballagesFiltersBar";
import type { EmballagesFiltersState } from "./emballagesFilters";

const tour = tourPageAttrs("/emballages");

interface Props {
  filters: EmballagesFiltersState;
  onFiltersChange: (filters: EmballagesFiltersState) => void;
  rows: TableEmballages[];
  onOpenNew: () => void;
  total: number;
  filteredCount?: number;
  /** Faux pour le rôle stock : consultation du catalogue uniquement. */
  canManage?: boolean;
  viewMode?: "grid" | "list";
  onViewModeChange?: (mode: "grid" | "list") => void;
}

export const EmballagesHeader = ({
  filters,
  onFiltersChange,
  rows,
  onOpenNew,
  total,
  filteredCount,
  canManage = true,
  viewMode,
  onViewModeChange,
}: Props) => (
  <div className="space-y-8 mb-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
       
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
          Emballage
                    <span className="text-[#00A09D]">.</span>

          </h1>

         <nav className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 gap-2 mb-2">
          <span>Logistique</span> <ChevronRight size={10} /> <span>Catalogue Emballages</span>
        </nav>
      </div>
      <div className="bg-white border border-gray-50 p-4 rounded-[2rem] flex items-center gap-4 min-w-[160px] shadow-sm">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600"><Box size={18}/></div>
        <div>
          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</span>
          <span className="text-xl font-black text-gray-900 leading-none">
            {filteredCount != null && filteredCount !== total
              ? `${filteredCount} / ${total}`
              : total}{" "}
            modèles
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-4">
      <div className="flex-1 min-w-0">
        <EmballagesFiltersBar rows={rows} filters={filters} onChange={onFiltersChange} />
      </div>

      <div className="flex flex-wrap items-center gap-3 lg:shrink-0">
        {viewMode != null && onViewModeChange ? (
          <div className="flex gap-1 rounded-[20px] border-2 border-gray-100 bg-white p-1.5 shadow-[8px_8px_0px_rgba(0,160,157,0.15)]">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                viewMode === "grid"
                  ? "bg-[#1C2434] text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              <LayoutGrid size={16} aria-hidden />
              Grille
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={`flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${
                viewMode === "list"
                  ? "bg-[#1C2434] text-white shadow-lg"
                  : "text-gray-400 hover:bg-gray-50"
              }`}
            >
              <List size={16} aria-hidden />
              Liste
            </button>
          </div>
        ) : null}
        {canManage ? (
          <button
            type="button"
            {...tour.actions}
            onClick={onOpenNew}
            className="rounded-2xl border-2 border-gray-900 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[8px_8px_0px_rgba(0,160,157,0.2)] transition-all hover:bg-gray-900 hover:text-white"
          >
            Ajouter
          </button>
        ) : null}
      </div>
    </div>
  </div>
);