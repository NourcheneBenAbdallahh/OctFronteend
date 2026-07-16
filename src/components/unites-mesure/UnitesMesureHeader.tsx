import React from "react";
import { Plus, Ruler } from "lucide-react";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { BREADCRUMBS } from "@/lib/breadcrumbs";
import UnitesMesureFiltersBar from "./UnitesMesureFiltersBar";
import type { UnitesMesureFiltersState } from "./unitesMesureFilters";

interface Props {
  filters: UnitesMesureFiltersState;
  onFiltersChange: (filters: UnitesMesureFiltersState) => void;
  onOpenNew: () => void;
  total: number;
  filteredCount?: number;
  canManage?: boolean;
}

export const UnitesMesureHeader = ({
  filters,
  onFiltersChange,
  onOpenNew,
  total,
  filteredCount,
  canManage = true,
}: Props) => (
  <div className="space-y-8 mb-8">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <BreadcrumbNav items={BREADCRUMBS.unitesMesure} className="mb-2" />
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
          Unités
          <span className="text-[#00A09D]">.</span>
        </h1>
      </div>
      <div className="bg-white border border-gray-50 p-4 rounded-[2rem] flex items-center gap-4 min-w-[160px] shadow-sm">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600">
          <Ruler size={18} />
        </div>
        <div>
          <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
            Référentiel
          </span>
          <span className="text-xl font-black text-gray-900 leading-none">
            {filteredCount != null && filteredCount !== total ? `${filteredCount} / ${total}` : total} unités
          </span>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1">
        <UnitesMesureFiltersBar filters={filters} onChange={onFiltersChange} />
      </div>
      {canManage ? (
        <button
          type="button"
          onClick={onOpenNew}
          className="shrink-0 bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)] lg:self-center"
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={16} />
            Ajouter
          </span>
        </button>
      ) : null}
    </div>
  </div>
);
