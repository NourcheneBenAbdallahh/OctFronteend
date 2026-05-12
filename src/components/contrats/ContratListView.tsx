import React from "react";
import { Edit3, Trash2, Calendar, AlertCircle } from "lucide-react";
import { TableContrat } from "@/types/contrat";
import { getProgressColor } from "@/lib/contratAnalytics";

interface Props {
  rows: TableContrat[];
  userNamesById: Record<string, string>;
  onEdit: (c: TableContrat) => void;
  onDelete: (id: string | number) => void;
  focusedId?: string | number | null;
}

export const ContratListView = ({ rows, userNamesById, onEdit, onDelete, focusedId }: Props) => (
  <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <th className="px-8 py-6">Référence & Dates</th>
          <th className="px-8 py-6">Partenaire / Emballage</th>
          <th className="px-8 py-6 text-right">Finance (HT)</th>
          <th className="px-8 py-6 text-right">Quantité Contractuelle</th>
          <th className="px-8 py-6">Progression Réelle</th>
          <th className="px-8 py-6">État</th>
          <th className="px-8 py-6 text-center">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((c) => {
          const qteRealisee = Number(c.quantite_realisee ?? 0);
          const qteContractuelle = Number(c.quantite_contractuelle ?? 1);
          const restant = qteContractuelle - qteRealisee;
          const rawRate = Number(c.taux_depassement_autorise ?? 0);
          const tauxDepassementPercent = rawRate <= 1 ? rawRate * 100 : rawRate;
          const restantAvecDepassement = restant + (restant * tauxDepassementPercent) / 100;
          const restantColor = restant < 0 ? "text-red-600" : restant === 0 ? "text-green-600" : "text-amber-600";
          const restantDepColor = restantAvecDepassement < 0 ? "text-red-600" : restantAvecDepassement === 0 ? "text-green-600" : "text-indigo-600";
          const progress = Math.min((qteRealisee / qteContractuelle) * 100, 100);
          
          // Règle de gestion : Verrouillage si qte réalisée > 0
          const isLocked = qteRealisee > 0;

          return (
            <tr
              id={`contrat-row-${c.id}`}
              key={c.id}
              className={`group transition-all text-[13px] ${
                String(focusedId ?? "") === String(c.id)
                  ? "bg-indigo-50 ring-2 ring-indigo-300"
                  : "hover:bg-gray-50/50"
              }`}
            >
              <td className="px-8 py-6">
                <span className="text-sm font-black text-gray-900 tracking-tighter uppercase">{c.numero_contrat}</span>
                <div className="flex flex-col gap-0.5 text-[9px] font-bold text-gray-400 mt-1 uppercase">
                  <span className="flex items-center gap-1"><Calendar size={10} /> Début: {c.date_debut}</span>
                  <span className="text-red-400">Fin: {c.date_fin}</span>
                </div>
              </td>

              <td className="px-8 py-6">
                <div className="font-black text-gray-800 text-sm">{c.fournisseur?.raison_sociale || "—"}</div>
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                  {c.emballage?.name || "Standard"}
                </div>
                <div className="mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <span>Créé par: {c.created_by ? (userNamesById[String(c.created_by)] || `#${c.created_by}`) : "-"}</span>
                  <span className="mx-2">•</span>
                  <span>Modifié par: {c.modified_by ? (userNamesById[String(c.modified_by)] || `#${c.modified_by}`) : "-"}</span>
                </div>
              </td>

              <td className="px-8 py-6 text-right">
                <div className="text-sm font-black text-gray-900">
                  {c.montant_ht ? `${c.montant_ht.toLocaleString()} DT` : "—"}
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase">
                  TVA: {c.montant_tva || 0} DT
                </div>
              </td>

              <td className="px-8 py-6 text-right font-black text-gray-900">
                {qteContractuelle.toLocaleString()}
                <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-tighter">
                  {c.unite_quantite?.trim() || "unitées"}
                </span>
                <span className="text-[10px] font-bold text-indigo-500 block mt-1">
                  Taux depassement: {tauxDepassementPercent.toFixed(2)}%
                </span>
                <span className={`text-[10px] font-bold block ${restantColor}`}>
                  Reste: {restant.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={`text-[10px] font-bold block ${restantDepColor}`}>
                  Restant + taux: {restantAvecDepassement.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </td>

              <td className="px-8 py-6 w-56">
                <div className="flex items-center justify-between mb-2">
                   <span className={`text-[10px] font-black ${isLocked ? 'text-indigo-600' : 'text-gray-900'}`}>
                     {Math.round(progress)}%
                   </span>
                   <span className="text-[9px] font-bold text-gray-400 uppercase italic">
                     {qteRealisee.toLocaleString()} réalisés
                   </span>
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
                    c.statut === 'EXPIRE' ? 'bg-gray-50 text-gray-500 border-gray-100' : 
                    'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  {c.statut}
                </span>
              </td>

              <td className="px-8 py-6 text-center">
                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  {/* Bouton Edit : Toujours visible, mais le formulaire gèrera le lock interne */}
                  <button 
                    onClick={() => onEdit(c)} 
                    title="Modifier"
                    className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={14} />
                  </button>

                  {/* Bouton Delete : Désactivé si qte_realisee > 0 */}
                  <button 
                    onClick={() => !isLocked && onDelete(c.id)} 
                    disabled={isLocked}
                    title={isLocked ? "Impossible de supprimer : livraisons en cours" : "Supprimer"}
                    className={`h-9 w-9 flex items-center justify-center rounded-xl transition-all shadow-sm border ${
                      isLocked 
                      ? "bg-gray-50 border-gray-50 text-gray-200 cursor-not-allowed" 
                      : "bg-white border-gray-100 text-gray-400 hover:text-red-600 hover:border-red-100"
                    }`}
                  >
                    {isLocked ? <AlertCircle size={14} /> : <Trash2 size={14} />}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);