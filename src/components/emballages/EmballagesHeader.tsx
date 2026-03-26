import React from "react";
import { Search, Filter, Plus, Box, ShieldCheck, ChevronRight } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
  total: number;
}

export const EmballagesHeader = ({ query, setQuery, onOpenNew, total }: Props) => (
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
          <span className="text-xl font-black text-gray-900 leading-none">{total} modèles</span>
        </div>
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex-1 flex items-center bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 focus-within:ring-2 ring-indigo-500/10 transition-all">
        <Search size={18} className="text-gray-300 mr-3" />
        <input 
          className="flex-1 outline-none text-sm font-medium placeholder:text-gray-300" 
          placeholder="Rechercher par code ou nom..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Filter size={18} className="text-gray-400 ml-3 cursor-pointer hover:text-indigo-600" />
      </div>
      <button 
        onClick={onOpenNew}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
      >
         Ajouter
      </button>
    </div>
  </div>
);