"use client";

import { useState } from "react";
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp, Warehouse, AlertCircle } from "lucide-react";
import type { InventaireFilters, TableInventaire } from "@/types/inventaire";

interface Props {
  data: TableInventaire[];
  filters: InventaireFilters;
  onChange: (filters: InventaireFilters) => void;
}

export default function InventaireFilters({ data, filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);

  // Extraction unique des entrepôts
  const entrepots = Array.from(
    new Map(data.map((i) => [i.entrepot_id, i.entrepot_name])).entries()
  );

  return (
    <div className="flex flex-col gap-4 mb-10">
      
      {/* LIGNE 1 : RECHERCHE + BOUTONS ACTION */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search 
            size={20} 
            className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" 
          />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher un emballage, un entrepôt ou un code..."
            className="w-full h-[56px] bg-white border border-gray-100 rounded-full pl-16 pr-6 text-[15px] font-medium outline-none focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/5 shadow-sm transition-all"
          />
        </div>

        {/* Bouton Toggle Filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[56px] px-8 flex items-center gap-3 rounded-full border transition-all font-[1000] text-[11px] uppercase tracking-[0.15em] shadow-sm ${
            showFilters 
            ? "bg-[#1C2434] border-[#1C2434] text-white" 
            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Filter size={18} />
          {showFilters ? "Masquer" : "Filtres"}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Bouton Reset */}
        <button
          onClick={() => onChange({ search: "", status: "all", entrepot: "", code_session: "" })}
          className="h-[56px] w-[56px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:shadow-md transition-all shadow-sm group"
          title="Réinitialiser"
        >
          <RotateCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* ZONE DES FILTRES AVANCÉS (CONDITIONNELLE) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Filtre Statut / Écart */}
          <div className="relative min-w-[220px]">
            <AlertCircle size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.status}
              onChange={(e) => onChange({ ...filters, status: e.target.value as any })}
              className="appearance-none w-full h-12 pl-12 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm cursor-pointer"
            >
              <option value="all">Tous les écarts</option>
              <option value="perfect">Conformes (0)</option>
              <option value="negative">Écarts négatifs (-)</option>
              <option value="positive">Écarts positifs (+)</option>
              <option value="non_regularise">Non régularisés</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Filtre Entrepôt */}
          <div className="relative min-w-[220px]">
            <Warehouse size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.entrepot}
              onChange={(e) => onChange({ ...filters, entrepot: e.target.value })}
              className="appearance-none w-full h-12 pl-12 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm cursor-pointer"
            >
              <option value="">Tous les entrepôts</option>
              {entrepots.map(([id, name]) => (
                <option key={id} value={String(id)}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Indicateur de résultats actifs */}
          <div className="ml-auto pr-4">
             <span className="text-[10px] font-black uppercase text-[#00A09D] tracking-widest bg-[#00A09D]/5 px-4 py-2 rounded-full">
                {data.length} Résultats affichés
             </span>
          </div>

        </div>
      )}
    </div>
  );
}