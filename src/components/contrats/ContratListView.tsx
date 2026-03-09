import { Edit3, Trash2, Calendar, Package, Percent } from "lucide-react";
import { TableContrat } from "@/types/contrat";
import { getContratStatus } from "@/lib/contratAnalytics";

interface Props {
  rows: TableContrat[];
  onEdit: (c: TableContrat) => void;
  onDelete: (id: string | number) => void;
}

export const ContratListView = ({ rows, onEdit, onDelete }: Props) => (
  <div className="flex-1 overflow-auto p-4">
    <div className="bg-white shadow-md border border-gray-200 rounded-sm">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-gray-300 text-gray-800 uppercase text-[11px] font-bold">
            <th className="px-4 py-3">N° Contrat</th>
            <th className="px-4 py-3">Fournisseur & Emballage</th>
            <th className="px-4 py-3">Dates (Début - Fin)</th>
            <th className="px-4 py-3 text-right">Qté Contractuelle</th>
            <th className="px-4 py-3 text-right">Taux Dép.</th>
            <th className="px-4 py-3">Progression Réelle</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((c) => {
            const statusInfo = getContratStatus(c);
            const progress = ((c.quantite_realisee ?? 0) / (c.quantite_contractuelle ?? 1)) * 100;
            
            return (
              <tr key={c.id} className="hover:bg-[#F2F7F7] group transition-colors">
                {/* 1. Numéro */}
                <td className="px-4 py-3 font-bold text-[#00A09D] uppercase">
                  {c.numero_contrat}
                </td>

                {/* 2. Fournisseur et Emballage (Groupés pour gagner de la place) */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-700">{c.fournisseur?.raison_sociale || "—"}</span>
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Package size={10} /> {c.emballage?.name || "Non spécifié"}
                    </span>
                  </div>
                </td>

                {/* 3. Dates */}
                <td className="px-4 py-3 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>{c.date_debut}</span>
                    <span className="mx-1">→</span>
                    <span>{c.date_fin}</span>
                  </div>
                </td>

                {/* 4. Quantité Contractuelle */}
                <td className="px-4 py-3 text-right font-mono font-medium">
                  {c.quantite_contractuelle?.toLocaleString()}
                </td>

                {/* 5. Taux Dépassement */}
                <td className="px-4 py-3 text-right text-gray-500 font-mono">
                  {c.taux_depassement_autorise}%
                </td>

                {/* 6. Barre de progression (Réalisation) */}
                <td className="px-4 py-3 w-48">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${progress > 100 ? 'bg-red-500' : 'bg-[#00A09D]'}`} 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 w-8">{Math.round(progress)}%</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">
                    {c.quantite_realisee ?? 0} unités réalisées
                  </div>
                </td>

                {/* 7. Statut */}
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                    ${c.statut === 'ACTIF' ? 'bg-green-50 text-green-700 border-green-200' : 
                      c.statut === 'EXPIRE' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    {c.statut}
                  </span>
                </td>

                {/* 8. Actions */}
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(c)} className="p-1.5 text-gray-600 hover:text-[#00A09D] hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => onDelete(c.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);