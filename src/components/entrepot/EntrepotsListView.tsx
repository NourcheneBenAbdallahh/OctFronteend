// components/entrepot/EntrepotsKanbanView.tsx
import { Entrepot } from "@/lib/entrepot.api";
import { Package, MapPin, MoreVertical } from "lucide-react";

export const EntrepotsListView = ({ rows, onEdit }: { rows: Entrepot[], onEdit: (i: Entrepot) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
    {rows.map((it) => {
      const taux = it.capacite_totale ? Math.round(((Number(it.capacite_totale) - Number(it.capacite_disponible)) / Number(it.capacite_totale)) * 100) : 0;
      return (
        <div key={it.id} onClick={() => onEdit(it)} className="bg-white border border-gray-300 rounded-sm shadow-sm hover:shadow-md hover:border-[#00A09D] transition-all cursor-pointer group">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <span className="font-bold text-[#00A09D] uppercase tracking-tight truncate">{it.nom || 'Sans nom'}</span>
              <MoreVertical size={14} className="text-gray-400" />
            </div>
            
            <div className="mt-2 space-y-1 text-[13px] text-gray-500">
              <div className="flex items-center gap-2"><MapPin size={12}/> {it.adresse}</div>



              <div className="flex items-center gap-2">
    <Package size={12} className="text-gray-400"/> 
    <span>
      Disponibilité : 
      <strong className={`ml-1 ${Number(it.capacite_disponible) < 10 ? 'text-red-600' : 'text-gray-800'}`}>
        {it.capacite_disponible ?? 0}
      </strong> 
      <span className="text-gray-400 mx-1">/</span>
      <span className="text-gray-500">{it.capacite_totale ?? 0}</span>
      <span className="ml-1 text-[10px] text-gray-400 uppercase">Unités</span>
    </span>
  </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                <span>UTILISATION</span>
                <span>{taux}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                <div 
                  className={`h-full transition-all ${taux > 85 ? 'bg-red-500' : taux > 60 ? 'bg-orange-400' : 'bg-[#00A09D]'}`} 
                  style={{ width: `${taux}%` }}
                />
              </div>
            </div>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${it.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
              {it.statut}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);