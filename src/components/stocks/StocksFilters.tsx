"use client";

import { useState } from "react";
import {
  Search,
  Package,
  Warehouse,
  User,
  ArrowDownUp,
  CalendarDays,
  RotateCcw,
  ChevronDown,
  Filter,
  ChevronUp
} from "lucide-react";
import type { Stock, StockFiltersState } from "@/types/stock";

interface Props {
  rows: Stock[];
  filters: StockFiltersState;
  onChange: (filters: StockFiltersState) => void;
}

export default function StocksFilters({ rows, filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false); // État pour masquer/afficher

  // --- Logique de données (Identique à ton code) ---
  const entrepots = Array.from(new Map(rows.filter((r) => r.entrepot).map((r) => [String(r.entrepot?.id), { id: String(r.entrepot?.id), label: r.entrepot?.nom || r.entrepot?.name || `Entrepôt #${r.entrepot_id}` }])).values());
  const emballages = Array.from(new Map(rows.filter((r) => r.emballage).map((r) => [String(r.emballage?.id), { id: String(r.emballage?.id), label: r.emballage?.name || r.emballage?.code || `Emballage #${r.emballage_id}` }])).values());
  const users = Array.from(new Map(rows.filter((r) => r.user).map((r) => [String(r.user?.id), { id: String(r.user?.id), label: r.user?.name || r.user?.email || `User #${r.user_id}` }])).values());

  return (
    <div className="flex flex-col gap-4 mb-10">
      
      {/* LIGNE PRINCIPALE : RECHERCHE + BOUTON FILTRE */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
          <input
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Rechercher par lot, entrepôt, utilisateur..."
            className="w-full h-[56px] bg-white border border-gray-100 rounded-full pl-16 pr-6 text-[15px] font-medium outline-none focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/5 shadow-sm transition-all"
          />
        </div>

        {/* LE BOUTON AFFICHER/MASQUER */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`h-[56px] px-6 flex items-center gap-3 rounded-full border transition-all font-black text-[11px] uppercase tracking-widest shadow-sm ${
            showFilters 
            ? "bg-[#1C2434] border-[#1C2434] text-white" 
            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
          }`}
        >
          <Filter size={18} />
          {showFilters ? "Masquer" : "Filtres"}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button
          onClick={() => onChange({ search: "", entrepot: "", emballage: "", sens: "", user: "", sort: "recent", dateFrom: "", dateTo: "" })}
          className="h-[56px] w-[56px] flex items-center justify-center rounded-full bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:shadow-md transition-all shadow-sm"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* ZONE DES FILTRES (CONDITIONNELLE AVEC ANIMATION) */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-6 bg-gray-50/50 rounded-[32px] border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
          
          {/* Tri */}
          <div className="relative">
            <ArrowDownUp size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as any })}
              className="appearance-none h-11 pl-10 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm"
            >
              <option value="recent">Plus récent</option>
              <option value="oldest">Plus ancien</option>
              <option value="quantite_desc">Qté décroissante</option>
              <option value="quantite_asc">Qté croissante</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Sens */}
          <div className="relative">
            <select
              value={filters.sens}
              onChange={(e) => onChange({ ...filters, sens: e.target.value as any })}
              className="appearance-none h-11 pl-5 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm"
            >
              <option value="">Tous les sens</option>
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Entrepôt */}
          <div className="relative">
            <Warehouse size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.entrepot}
              onChange={(e) => onChange({ ...filters, entrepot: e.target.value })}
              className="appearance-none h-11 pl-10 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm"
            >
              <option value="">Entrepôts</option>
              {entrepots.map((e) => ( <option key={e.id} value={e.id}>{e.label}</option> ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Utilisateur */}
          <div className="relative">
            <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]" />
            <select
              value={filters.user}
              onChange={(e) => onChange({ ...filters, user: e.target.value })}
              className="appearance-none h-11 pl-10 pr-10 rounded-full border border-white bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-[#00A09D] shadow-sm"
            >
              <option value="">Utilisateurs</option>
              {users.map((u) => ( <option key={u.id} value={u.id}>{u.label}</option> ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
          </div>

          {/* Dates */}
          <div className="flex items-center bg-white border border-white rounded-full h-11 px-5 shadow-sm">
            <CalendarDays size={14} className="text-[#00A09D] mr-3" />
            <input
              type="date"
              value={filters.dateFrom || ""}
              onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
              className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-28"
            />
            <div className="w-[1px] h-4 bg-gray-100 mx-3" />
            <input
              type="date"
              value={filters.dateTo || ""}
              onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
              className="text-[10px] font-bold text-gray-500 bg-transparent outline-none w-28"
            />
          </div>
        </div>
      )}
    </div>
  );
}