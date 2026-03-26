import { Search, Filter, LayoutGrid, ChevronRight, Plus, Download } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
}
export const FournisseurHeader = ({ query, setQuery, onOpenNew }: Props) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
        <div className="w-8 h-[2px] bg-[#00A09D]"></div>
        Gestion Achats
      </div>
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
        Fournisseurs <span className="text-[#00A09D]">.</span>
      </h1>
    </div>

    <div className="flex items-center gap-3">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" size={16} />
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="RECHERCHER UN PARTENAIRE..."
          className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-4 focus:ring-[#00A09D]/5 w-[300px] transition-all shadow-sm"
        />
      </div>
      
              <button onClick={onOpenNew}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
      > 
        <Plus size={18} strokeWidth={3} />
        <span className="text-[10px] font-black uppercase tracking-widest pr-2">Nouveau</span>
      </button>
    </div>
  </div>
);
