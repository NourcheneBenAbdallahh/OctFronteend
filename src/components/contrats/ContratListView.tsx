import React from "react";
import { Edit3, Trash2, Calendar, AlertCircle, Eye, Download, FileText } from "lucide-react";
import { TableContrat } from "@/types/contrat";
import { getContratStatutNote, getProgressColor } from "@/lib/contratAnalytics";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { GmailEmailLink } from "@/components/ui/GmailEmailLink";
import { SortableTh, type TableSortHeaderProps } from "@/components/ui/SortableTableHeader";

interface Props extends TableSortHeaderProps {
  rows: TableContrat[];
  userNamesById: Record<string, string>;
  uniteLabelByCode?: Record<string, string>;
  onEdit: (c: TableContrat) => void;
  onDelete: (id: string | number) => void;
  onViewDocument?: (c: TableContrat) => void;
  onDownloadDocument?: (c: TableContrat) => void;
  focusedId?: string | number | null;
}

export const ContratListView = ({
  rows,
  userNamesById,
  uniteLabelByCode,
  onEdit,
  onDelete,
  onViewDocument,
  onDownloadDocument,
  focusedId,
  sortKey,
  sortDirection,
  onSort,
}: Props) => (
  <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
    <ResponsiveTableWrap>
    <table className="w-full min-w-[1100px] text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <SortableTh columnKey="numero" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Référence & Dates</SortableTh>
          <SortableTh columnKey="fournisseur" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Partenaire / Emballage</SortableTh>
          <SortableTh columnKey="montant_ht" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6" align="right">Finance (HT)</SortableTh>
          <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6" align="right">Quantité Contractuelle</SortableTh>
          <SortableTh columnKey="progression" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Progression Réelle</SortableTh>
          <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">État</SortableTh>
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
          const isLocked = qteRealisee > 0;
          const statutNote = getContratStatutNote(c.statut, c.note_statut);
          const hasDocument = !!c.document_contrat;

          return (
            <tr
              id={`contrat-row-${c.id}`}
              key={c.id}
              className={`group transition-all text-[13px] ${
                String(focusedId ?? "") === String(c.id)
                  ? "bg-amber-50 ring-2 ring-inset ring-amber-400 shadow-[0_0_0_1px_rgba(251,191,36,0.35)]"
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
                <div className="mt-1 text-[11px]">
                  <GmailEmailLink
                    email={c.fournisseur?.email}
                    subject={`Contrat ${c.numero_contrat}`}
                    emptyLabel="Email non renseigné"
                    className="text-[11px]"
                  />
                </div>
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
                  {(() => {
                    const u = c.unite_quantite?.trim();
                    if (!u) return "—";
                    const lbl = uniteLabelByCode?.[u];
                    return lbl ? `${lbl} (${u})` : u;
                  })()}
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
                {statutNote && (
                  <p className="mt-2 max-w-[180px] text-[9px] font-semibold leading-snug text-gray-500">
                    {statutNote}
                  </p>
                )}
              </td>

              <td className="px-8 py-6 text-center">
                <div className="flex justify-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                  {hasDocument && onViewDocument && (
                    <button
                      type="button"
                      onClick={() => onViewDocument(c)}
                      title="Voir le document"
                      className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-[#00A09D] hover:border-[#00A09D]/30 rounded-xl transition-all shadow-sm"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  {hasDocument && onDownloadDocument && (
                    <button
                      type="button"
                      onClick={() => onDownloadDocument(c)}
                      title="Télécharger le document"
                      className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                    >
                      <Download size={14} />
                    </button>
                  )}
                  {!hasDocument && (
                    <span
                      title="Aucun document importé"
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-300"
                    >
                      <FileText size={14} />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    title="Modifier"
                    className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 hover:border-indigo-100 rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
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
    </ResponsiveTableWrap>
  </div>
);
