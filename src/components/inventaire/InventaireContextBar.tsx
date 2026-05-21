"use client";

import { Calendar, CalendarRange, Layers, Warehouse } from "lucide-react";
import type { InventaireDateMode, InventaireFilters } from "@/types/inventaire";
import { describeInventaireScope, yearOptions } from "@/lib/inventaire.dates";

type EntrepotOption = { id: string; label: string };

interface Props {
  entrepots: EntrepotOption[];
  filters: InventaireFilters;
  onChange: (filters: InventaireFilters) => void;
  scopedCount: number;
  totalCount: number;
  onGenerer: () => void;
  loading?: boolean;
}

const MODES: { id: InventaireDateMode; label: string; icon: typeof Calendar }[] = [
  { id: "day", label: "Par jour", icon: Calendar },
  { id: "year", label: "Par année", icon: CalendarRange },
  { id: "all", label: "Tout", icon: Layers },
];

export default function InventaireContextBar({
  entrepots,
  filters,
  onChange,
  scopedCount,
  totalCount,
  onGenerer,
  loading = false,
}: Props) {
  const entrepotName = entrepots.find((e) => e.id === filters.entrepot)?.label;
  const scopeLabel = describeInventaireScope(
    filters.date_mode,
    filters.pivot_day,
    filters.pivot_year,
    entrepotName
  );

  const patch = (partial: Partial<InventaireFilters>) =>
    onChange({ ...filters, ...partial, code_session: "" });

  return (
    <div className="rounded-[32px] border border-[#00A09D]/15 bg-gradient-to-br from-[#F2F7F7] to-white p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A09D] mb-2">
            Inventaire par entrepôt
          </p>
          <h2 className="text-2xl font-[1000] text-[#1C2434] tracking-tight">{scopeLabel}</h2>
          <p className="text-sm text-gray-500 font-medium mt-2 max-w-xl">
            Choisissez l&apos;entrepôt et la date (jour ou année) pour filtrer et générer une campagne
            tracée (<span className="font-black text-[#1C2434]">code_session</span> + période).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100">
            {scopedCount} ligne{scopedCount !== 1 ? "s" : ""} / {totalCount}
          </span>
          <button
            type="button"
            onClick={onGenerer}
            disabled={loading || !filters.entrepot}
            className="h-12 px-6 inline-flex items-center gap-2 rounded-full bg-[#00A09D] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#008f8c] disabled:opacity-40 transition-all"
          >
            <Layers size={16} />
            Générer campagne
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Warehouse size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D] z-10" />
          <select
            value={filters.entrepot}
            onChange={(e) => patch({ entrepot: e.target.value })}
            className="appearance-none w-full h-12 pl-12 pr-10 rounded-2xl border border-white bg-white text-[10px] font-black uppercase tracking-widest text-[#1C2434] outline-none focus:border-[#00A09D] shadow-sm cursor-pointer"
          >
            <option value="">— Choisir un entrepôt —</option>
            {entrepots.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex rounded-2xl bg-white border border-gray-100 p-1 shadow-sm lg:col-span-2">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => patch({ date_mode: id })}
              className={`flex-1 h-10 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filters.date_mode === id
                  ? "bg-[#1C2434] text-white shadow-md"
                  : "text-gray-400 hover:text-[#1C2434]"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {filters.date_mode === "day" && (
          <input
            type="date"
            value={filters.pivot_day.slice(0, 10)}
            onChange={(e) => patch({ pivot_day: e.target.value })}
            className="h-12 px-4 rounded-2xl border border-white bg-white text-sm font-bold text-[#1C2434] outline-none focus:border-[#00A09D] shadow-sm"
          />
        )}
        {filters.date_mode === "year" && (
          <select
            value={filters.pivot_year}
            onChange={(e) => patch({ pivot_year: e.target.value })}
            className="h-12 px-4 rounded-2xl border border-white bg-white text-sm font-black text-[#1C2434] outline-none focus:border-[#00A09D] shadow-sm cursor-pointer"
          >
            {yearOptions(8).map((y) => (
              <option key={y} value={y}>
                Année {y}
              </option>
            ))}
          </select>
        )}
        {filters.date_mode === "all" && (
          <div className="h-12 flex items-center px-4 rounded-2xl bg-white/60 text-xs font-bold text-gray-400 border border-dashed border-gray-200">
            Toutes dates et entrepôts (filtres avancés ci-dessous)
          </div>
        )}
      </div>
    </div>
  );
}
