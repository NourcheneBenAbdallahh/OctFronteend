"use client";

import { useState } from "react";
import { 
  Search, 
  Package, 
  User, 
  ArrowDownUp, 
  CalendarDays, 
  RotateCcw, 
  ChevronDown, 
  Filter, 
  ChevronUp,
  MessageSquare
} from "lucide-react";
import type { Lot, LotFiltersState } from "@/types/lot";

interface Props {
  rows: Lot[];
  filters: LotFiltersState;
  onChange: (filters: LotFiltersState) => void;
}

export default function LotsFilters({ rows, filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);

  // --- Extraction des données pour les selects ---
  const emballages = Array.from(new Map(rows.filter((r) => r.emballage).map((r) => [String(r.emballage?.id), { id: String(r.emballage?.id), label: r.emballage?.name || `Emballage #${r.emballage_id}` }])).values());
  const users = Array.from(new Map(rows.filter((r) => r.user).map((r) => [String(r.user?.id), { id: String(r.user?.id), label: r.user?.name || `User #${r.user_id}` }])).values());

  return (
    <div className="flex flex-col gap-4 mb-10 px-8">
      
      {/* LIGNE PRINCIPALE : RECHERCHE + ACTIONS RAPIDES */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher un code lot, un commentaire..."
            className="w-full h-[64px] bg-white border border-gray-100 rounded-full pl-16 pr-6 text-[14px] font-bold text-gray-800 outline-none focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/5 shadow-sm transition-all"
          />
        </div>

        {/* BOUTON TOGGLE FILTRES */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[64px] px-8 flex items-center gap-3 rounded-full border transition-all font-black text-[10px] uppercase tracking-[0.2em] shadow-sm ${
            showFilters 
            ? "bg-gray-900 border-gray-900 text-white" 
            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Filter size={18} />
          {showFilters ? "Fermer" : "Filtres"}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* RESET RAPIDE */}
        <button
          onClick={() => onChange({ search: "", emballage: "", user: "", commentOnly: false, sort: "recent", dateFrom: "", dateTo: "" })}
          className="h-[64px] w-[64px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:shadow-md transition-all shadow-sm group"
        >
          <RotateCcw size={20} className="group-hover:rotate-[-90deg] transition-transform duration-500" />
        </button>
      </div>

      {/* ZONE DES FILTRES DÉPLOYABLE */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 p-8 bg-[#F0F4F4]/50 rounded-[40px] border border-white animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* TRI CHRONOLOGIQUE */}
          <div className="relative group">
            <ArrowDownUp size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as any })}
              className="appearance-none h-12 pl-12 pr-12 rounded-full border-2 border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none focus:border-gray-900 shadow-sm cursor-pointer transition-all"
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="qty_desc">Qté (Décroissante)</option>
              <option value="qty_asc">Qté (Croissante)</option>
            </select>
            <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* FILTRE EMBALLAGE */}
          <div className="relative group">
            <Package size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.emballage}
              onChange={(e) => onChange({ ...filters, emballage: e.target.value })}
              className="appearance-none h-12 pl-12 pr-12 rounded-full border-2 border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none focus:border-gray-900 shadow-sm cursor-pointer transition-all"
            >
              <option value="">Tous les emballages</option>
              {emballages.map((e) => ( <option key={e.id} value={e.id}>{e.label}</option> ))}
            </select>
            <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* FILTRE COMMENTAIRES (BOUTON TOGGLE) */}
          <button
            onClick={() => onChange({ ...filters, commentOnly: !filters.commentOnly })}
            className={`h-12 px-6 rounded-full border-2 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              filters.commentOnly
              ? "bg-[#00A09D] border-[#00A09D] text-white shadow-[0_0_15px_rgba(0,160,157,0.3)]"
              : "bg-white border-white text-gray-500 shadow-sm"
            }`}
          >
            <MessageSquare size={14} />
            Notes uniquement
          </button>

          {/* SÉLECTEUR DE PÉRIODE */}
          <div className="flex items-center bg-white border-2 border-white rounded-full h-12 px-6 shadow-sm">
            <CalendarDays size={14} className="text-[#00A09D] mr-4" />
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              className="text-[10px] font-black text-gray-600 bg-transparent outline-none w-28 uppercase"
            />
            <div className="w-[1px] h-4 bg-gray-100 mx-4" />
            <input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              className="text-[10px] font-black text-gray-600 bg-transparent outline-none w-28 uppercase"
            />
          </div>

        </div>
      )}
    </div>
  );
}