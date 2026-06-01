import React from "react";
import { Search, Package, CheckCircle2 } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
  stats: { total: number; actifs: number; realisation: number };
}

export const ContratHeader = ({ query, setQuery, onOpenNew, stats }: Props) => (
  <div className="space-y-8 mb-8">
    {/* Breadcrumb & Title */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
       
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Contrats
          <span className="text-[#00A09D]">.</span>
          </h1>
  
      </div>

      <div className="flex gap-3">
        <StatCard icon={<Package size={18}/>} label="Contrats" value={stats.total} color="bg-indigo-50 text-indigo-600" />
        <StatCard icon={<CheckCircle2 size={18}/>} label="Réalisation" value={`${stats.realisation}%`} color="bg-green-50 text-green-600" />
      </div>
    </div>

    {/* Search & Action */}
    <div className="flex items-center gap-4">
      <div className="flex-1 flex items-center bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 focus-within:ring-2 ring-indigo-500/10 transition-all">
        <Search size={18} className="text-gray-300 mr-3" />
        <input 
          className="flex-1 outline-none text-sm font-medium placeholder:text-gray-300" 
          placeholder="Rechercher une référence ou un fournisseur..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button 
        onClick={onOpenNew}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
      >       
        Nouveau
      </button>
    </div>
  </div>
);

const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white border border-gray-50 p-4 rounded-[2rem] flex items-center gap-4 min-w-[160px] shadow-sm">
    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] leading-none mb-1">{label}</span>
      <span className="text-xl font-black text-gray-900 leading-none">{value}</span>
    </div>
  </div>
);