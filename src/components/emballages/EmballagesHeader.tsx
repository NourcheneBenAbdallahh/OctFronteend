import { Search, Filter, LayoutGrid, Plus } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
}

export const EmballagesHeader = ({ query, setQuery, onOpenNew }: Props) => (
  <div className="border-b px-4 py-3 flex flex-wrap items-center justify-between gap-4">
    <button 
      onClick={onOpenNew} 
      className="bg-[#00A09D] hover:bg-[#008784] text-white px-4 py-1.5 rounded text-xs font-bold uppercase shadow-sm flex items-center gap-2 w-fit"
    >
      <Plus size={14} /> Créer
    </button>

    <div className="flex items-center flex-1 max-w-lg bg-gray-50 border border-gray-200 rounded px-2 py-1.5 focus-within:border-[#00A09D] focus-within:bg-white transition-all">
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
