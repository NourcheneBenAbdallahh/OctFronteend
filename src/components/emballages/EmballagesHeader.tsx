import { Search, Filter, LayoutGrid, ChevronRight, Plus } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
}

export const EmballagesHeader = ({ query, setQuery, onOpenNew }: Props) => (
  <div className="bg-white border-b border-gray-300 px-4 py-3 flex flex-wrap items-center justify-between gap-4 shadow-sm">
    <div className="flex flex-col gap-1">
      <nav className="flex items-center text-sm text-gray-500 gap-1">
        <span>Configuration</span> <ChevronRight size={14} /> 
        <span className="text-gray-800 font-medium tracking-tight">Types d'Emballages</span>
      </nav>
      <button 
        onClick={onOpenNew} 
        className="bg-[#00A09D] hover:bg-[#008784] text-white px-4 py-1.5 rounded text-xs font-bold uppercase shadow-sm flex items-center gap-2 w-fit"
      >
        <Plus size={14} /> Créer
      </button>
    </div>

    <div className="flex items-center flex-1 max-w-lg bg-white border border-gray-300 rounded shadow-inner px-2 py-1 focus-within:border-[#00A09D] transition-all">
      <Search size={16} className="text-gray-400 mr-2" />
      <input 
        className="flex-1 outline-none text-sm p-0.5 bg-transparent" 
        placeholder="Rechercher un emballage (Code, Nom...)" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex items-center gap-2 border-l pl-2 ml-2">
        <Filter size={16} className="text-[#00A09D] cursor-pointer" />
        <LayoutGrid size={16} className="text-gray-400 cursor-pointer" />
      </div>
    </div>
  </div>
);