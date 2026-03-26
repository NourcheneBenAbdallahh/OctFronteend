import { Search, ChevronRight, Plus, MapPin, Database } from "lucide-react";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
}
export const EntrepotsHeader = ({ count, onAdd }: { count: number, onAdd: () => void }) => (
  <div className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
    <div>
      <div className="flex items-center gap-3 mb-2">
         <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#00A09D]">
            <Database size={20} />
         </div>
         <nav className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
           Ressources / <span className="text-gray-900">Logistique</span>
         </nav>
      </div>
      <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
        Entrepôts<span className="text-[#00A09D]">.</span>
      </h1>
    </div>

    <div className="flex items-center gap-6">
      <div className="text-right hidden sm:block">
        <span className="text-[10px] font-black text-gray-400 uppercase block">Total Actif</span>
        <span className="text-2xl font-black text-gray-900 leading-none">{count} Sites</span>
      </div>
      <button 
        onClick={onAdd}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
      >
        Ajouter un site
      </button>
    </div>
  </div>
);