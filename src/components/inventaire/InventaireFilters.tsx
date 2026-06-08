"use client";

import { useState } from "react";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Warehouse,
  AlertCircle,
  Calendar,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import type { InventaireFilters, TableInventaire } from "@/types/inventaire";
import { EMPTY_INVENTAIRE_FILTERS } from "@/lib/inventaire.filters";
import { tourPageAttrs } from "@/lib/tourPageAttrs";
import { FilterBarSelect } from "@/components/ui/FilterBarSelect";

const tour = tourPageAttrs("/stock-inventaire");

type EntrepotOption = { id: string; label: string };

interface Props {
  data: TableInventaire[];
  entrepots?: EntrepotOption[];
  filteredCount: number;
  filters: InventaireFilters;
  onChange: (filters: InventaireFilters) => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  exporting?: boolean;
}

export default function InventaireFiltersBar({
  data,
  entrepots: entrepotsProp,
  filteredCount,
  filters,
  onChange,
  onExportPdf,
  onExportCsv,
  exporting = false,
}: Props) {
  const [showFilters, setShowFilters] = useState(false);

  const entrepotsFromData = Array.from(
    new Map(data.map((i) => [i.entrepot_id, i.entrepot_name])).entries()
  ).map(([id, name]) => ({ id: String(id), label: name }));

  const entrepots =
    entrepotsProp && entrepotsProp.length > 0 ? entrepotsProp : entrepotsFromData;

  return (
    <div className="flex flex-col gap-4 mb-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] group">
          <Search
            size={20}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors"
          />
          <input
            {...tour.search}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher emballage, entrepôt, session…"
            className="w-full h-[56px] bg-white border border-gray-100 rounded-full pl-16 pr-6 text-[15px] font-medium outline-none focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/5 shadow-sm transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[56px] px-8 flex items-center gap-3 rounded-full border transition-all font-[1000] text-[11px] uppercase tracking-[0.15em] shadow-sm ${
            showFilters
              ? "bg-[#1C2434] border-[#1C2434] text-white"
              : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Filter size={18} />
          Filtres
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          type="button"
          onClick={onExportPdf}
          disabled={exporting || filteredCount === 0}
          className="h-[56px] px-5 flex items-center gap-2 rounded-full bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1C2434] hover:bg-gray-50 disabled:opacity-40 shadow-sm"
        >
          <FileText size={18} className="text-red-500" />
          PDF
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          disabled={exporting || filteredCount === 0}
          className="h-[56px] px-5 flex items-center gap-2 rounded-full bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest text-[#1C2434] hover:bg-gray-50 disabled:opacity-40 shadow-sm"
        >
          <FileSpreadsheet size={18} className="text-emerald-600" />
          CSV
        </button>

        <button
          type="button"
          onClick={() => onChange({ ...EMPTY_INVENTAIRE_FILTERS })}
          className="h-[56px] w-[56px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-red-500 shadow-sm"
          title="Réinitialiser"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-col gap-5 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative min-w-[200px]">
              <AlertCircle size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
              <select
                value={filters.status}
                onChange={(e) =>
                  onChange({ ...filters, status: e.target.value as InventaireFilters["status"] })
                }
                className="appearance-none w-full h-12 pl-12 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm cursor-pointer"
              >
                <option value="all">Tous les écarts</option>
                <option value="perfect">Conformes (0)</option>
                <option value="negative">Écarts négatifs</option>
                <option value="positive">Écarts positifs</option>
                <option value="non_regularise">Non régularisés</option>
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
            </div>

            <FilterBarSelect
              value={filters.entrepot}
              onChange={(entrepot) => onChange({ ...filters, entrepot })}
              placeholder="Tous les entrepôts"
              ariaLabel="Filtrer par entrepôt"
              icon={<Warehouse size={14} />}
              options={entrepots.map((e) => ({ value: e.id, label: e.label }))}
              triggerClassName="h-12 min-w-[200px] max-w-full rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-[24px] bg-white border border-gray-100 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={14} className="text-[#00A09D]" />
                Date d&apos;inventaire
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  value={filters.date_inventaire_from}
                  onChange={(e) =>
                    onChange({ ...filters, date_inventaire_from: e.target.value })
                  }
                  className="flex-1 min-w-[140px] h-11 px-3 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:border-[#00A09D] border-2 border-transparent focus:border-[#00A09D]"
                  placeholder="Du"
                />
                <input
                  type="datetime-local"
                  value={filters.date_inventaire_to}
                  onChange={(e) =>
                    onChange({ ...filters, date_inventaire_to: e.target.value })
                  }
                  className="flex-1 min-w-[140px] h-11 px-3 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:border-[#00A09D] border-2 border-transparent focus:border-[#00A09D]"
                  placeholder="Au"
                />
              </div>
            </div>

            <div className="p-4 rounded-[24px] bg-white border border-gray-100 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Calendar size={14} className="text-[#00A09D]" />
                Période d&apos;audit (chevauchement)
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="datetime-local"
                  value={filters.periode_debut_from}
                  onChange={(e) =>
                    onChange({ ...filters, periode_debut_from: e.target.value })
                  }
                  className="flex-1 min-w-[140px] h-11 px-3 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:border-[#00A09D] border-2 border-transparent focus:border-[#00A09D]"
                />
                <input
                  type="datetime-local"
                  value={filters.periode_fin_to}
                  onChange={(e) =>
                    onChange({ ...filters, periode_fin_to: e.target.value })
                  }
                  className="flex-1 min-w-[140px] h-11 px-3 rounded-xl bg-gray-50 text-xs font-bold outline-none focus:border-[#00A09D] border-2 border-transparent focus:border-[#00A09D]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <span className="text-[10px] font-black uppercase text-[#00A09D] tracking-widest bg-[#00A09D]/5 px-4 py-2 rounded-full">
              {filteredCount} / {data.length} lignes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
