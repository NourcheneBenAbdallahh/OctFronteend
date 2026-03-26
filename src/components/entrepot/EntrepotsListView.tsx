import { Entrepot } from "@/lib/entrepot.api";
import { Package, MapPin, MoreVertical ,Plus} from "lucide-react";
export const EntrepotsListView = ({ rows, onEdit }: { rows: Entrepot[], onEdit: (i: Entrepot) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-[#F0F4F4] min-h-screen">
    {rows.map((it) => {
      const utilisation = it.capacite_totale ? Math.round(((Number(it.capacite_totale) - Number(it.capacite_disponible)) / Number(it.capacite_totale)) * 100) : 0;
      
      return (
        <div 
          key={it.id} 
          onClick={() => onEdit(it)} 
          className="relative bg-white rounded-[2rem] p-1 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group overflow-hidden border border-transparent hover:border-[#00A09D]/20"
        >
          <div className="p-6">
            <div className={`absolute top-6 right-6 w-2 h-2 rounded-full ${it.statut === 'ACTIF' ? 'bg-[#00A09D] shadow-[0_0_10px_#00A09D]' : 'bg-red-400'}`} />
            
            <div className="mb-8">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] block mb-1">Site-ID: 00{it.id}</span>
              <h3 className="text-xl font-black text-gray-800 uppercase leading-none group-hover:text-[#00A09D] transition-colors truncate">
                {it.nom}
              </h3>
              <div className="flex items-center gap-1 mt-2 text-gray-400">
                <MapPin size={10} />
                <span className="text-[10px] font-bold uppercase truncate">{it.adresse}</span>
              </div>
            </div>

            {/* Jauge innovante (Verticale ou Horizontale stylisée) */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[14px] font-black text-gray-800">{it.capacite_disponible}</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Disponibles</span>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black text-[#00A09D]">{utilisation}%</span>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter block">Occupation</span>
                </div>
              </div>
              
              <div className="relative h-4 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 p-0.5">
                <div 
                  className={`h-full rounded-md transition-all duration-1000 ${utilisation > 90 ? 'bg-red-500' : 'bg-[#00A09D]'}`}
                  style={{ width: `${utilisation}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 px-6 py-4 flex justify-between items-center group-hover:bg-[#00A09D]/5 transition-colors">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Inventory-Sync Ready</span>
            <div className="w-6 h-6 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#00A09D] group-hover:rotate-90 transition-all">
               <Plus size={12} />
            </div>
          </div>
        </div>
      );
    })}
  </div>
);