import React from "react";
import { Edit3, Trash2, Calendar, HardDrive, Percent } from "lucide-react";
import { TableContrat } from "@/types/contrat";
import { getProgressColor } from "@/lib/contratAnalytics";

interface Props {
  rows: TableContrat[];
  onEdit: (c: TableContrat) => void;
  onDelete: (id: string | number) => void;
}

export const ContratListView = ({ rows, onEdit, onDelete }: Props) => (
  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <th className="px-8 py-6 uppercase">Référence</th>
          <th className="px-8 py-6 uppercase">Partenaire / Emballage</th>
          <th className="px-8 py-6 uppercase text-right">Volume</th>
          <th className="px-8 py-6 uppercase">Exécution</th>
          <th className="px-8 py-6 uppercase">État</th>
          <th className="px-8 py-6 text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((c) => {
          const progress = Math.min(((c.quantite_realisee ?? 0) / (c.quantite_contractuelle ?? 1)) * 100, 100);
          
          return (
            <tr key={c.id} className="hover:bg-gray-50/50 group transition-all">
              <td className="px-8 py-6">
                <span className="text-sm font-black text-gray-900 tracking-tighter uppercase">{c.numero_contrat}</span>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1">
                  <Calendar size={10} /> {c.date_debut}
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="font-black text-gray-800 text-sm">{c.fournisseur?.raison_sociale || "—"}</div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                  {c.emballage?.name || "Standard"}
                </div>
              </td>

              <td className="px-8 py-6 text-right">
                <span className="text-sm font-black text-gray-900">
                  {c.quantite_contractuelle?.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-gray-400 block uppercase">Unités</span>
              </td>

              <td className="px-8 py-6 w-64">
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-black text-gray-900">{Math.round(progress)}%</span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{c.quantite_realisee} réels</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${getProgressColor(progress)}`} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </td>

              <td className="px-8 py-6">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border
                  ${c.statut === 'ACTIF' ? 'bg-green-50 text-green-600 border-green-100' : 
                    c.statut === 'EXPIRE' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {c.statut}
                </span>
              </td>

              <td className="px-8 py-6 text-center">
                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => onEdit(c)} className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"><Edit3 size={14} /></button>
                  <button onClick={() => onDelete(c.id)} className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100 rounded-xl transition-all shadow-sm"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);