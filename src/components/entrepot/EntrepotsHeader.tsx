import { Search, ChevronRight, Plus, MapPin } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
}

export const EntrepotsHeader= ({ count, onAdd }: { count: number, onAdd: () => void }) => (
  <div className="bg-white border-b border-gray-300 sticky top-0 z-10 shadow-sm">
    <div className="px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
      <div>
        <nav className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">
          Inventaire / Configuration / <span className="text-gray-800 font-bold">Entrepôts</span>
        </nav>
        <div className="flex gap-2">
          <button 
            onClick={onAdd}
            className="bg-[#00A09D] hover:bg-[#008784] text-white px-4 py-1.5 rounded-sm text-xs font-bold shadow-sm transition-colors uppercase"
          >
            Nouveau
          </button>
          <button className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-1.5 rounded-sm text-xs font-bold transition-colors uppercase">
            Importer
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-500">
          <span className="font-bold text-gray-800">{count}</span> entrepôts au total
        </div>
      </div>
    </div>
  </div>
);