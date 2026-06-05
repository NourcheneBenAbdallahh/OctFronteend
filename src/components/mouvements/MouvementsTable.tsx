"use client";

import { useMemo } from "react";
import {
  formatDate,
  formatEmballageLabel,
  formatQuantity,
  isMouvementBrouillon,
} from "@/lib/mouvement.helpers";
import { MouvementStock } from "@/types/mouvement";
import { StatusBadge, TypeBadge } from "./mouvement-ui";
import { CheckCircle2, History, Loader2, Trash2, User } from "lucide-react";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";

const MOUVEMENT_SORT_COLUMNS: Record<string, SortColumn<MouvementStock>> = {
  code: { accessor: (m) => m.code_mouvement ?? m.id, type: "string" },
  type: { accessor: (m) => m.type_mouvement, type: "string" },
  statut: { accessor: (m) => m.statut, type: "string" },
  produit: { accessor: (m) => m.emballage?.name ?? m.emballage?.code, type: "string" },
  entrepot: { accessor: (m) => m.entrepotSource?.nom, type: "string" },
  quantite: { accessor: (m) => m.quantite, type: "number" },
  user: { accessor: (m) => m.user?.name, type: "string" },
};

const LocalPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="flex items-center gap-4">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Précédent
    </button>

    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-x px-6 border-gray-100">
      Page {currentPage} sur {totalPages}
    </div>

    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Suivant
    </button>
  </div>
);

export default function MouvementsTable({
  items,
  loading,
  onValidate,
  onDelete,
  busyActionId,
  focusedId,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  items: MouvementStock[];
  loading: boolean;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  /** Désactive les boutons pendant validate/delete */
  busyActionId?: string | null;
  focusedId?: string | number | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(MOUVEMENT_SORT_COLUMNS);
  const sortedItems = useMemo(
    () => sortRows(items ?? []),
    [items, sortRows]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-[35px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-8 py-6 bg-white">
          <div>
            <h3 className="flex items-center gap-2 text-xl font-[1000] text-[#1C2434] uppercase tracking-tighter">
              <History className="text-[#00A09D]" size={22} />
              Journal des Flux
              <span className="text-[#00A09D]">.</span>
            </h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              {totalItems} mouvement(s) trouvé(s)
            </p>
            <p className="mt-2 max-w-lg text-[11px] font-medium normal-case tracking-normal text-gray-500">
              Mouvements en <strong>brouillon</strong> : validez pour appliquer le flux au stock, ou
              supprimez le brouillon depuis la colonne <strong>Actions</strong>.
            </p>
          </div>
        </div>

        <ResponsiveTableWrap>
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#1C2434]/60">
                <SortableTh columnKey="code" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-8 py-5">Code & Date_Mvt</SortableTh>
                <SortableTh columnKey="type" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5">Type</SortableTh>
                <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5">Statut</SortableTh>
                <SortableTh columnKey="produit" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5">Produit / Lot</SortableTh>
                <SortableTh columnKey="entrepot" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5">Entrepots</SortableTh>
                <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5" align="center">Quantité</SortableTh>
                <SortableTh columnKey="user" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-5" align="center">Créé Par</SortableTh>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#00A09D] border-t-transparent"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Synchronisation...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : !sortedItems || sortedItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-20 text-center text-sm font-bold text-gray-400 uppercase tracking-widest"
                  >
                    Aucun mouvement enregistré
                  </td>
                </tr>
              ) : (
                sortedItems.map((m) => (
                  <tr
                    id={`mouvement-row-${m.id}`}
                    key={m.id}
                    className={`group transition-all ${
                      String(focusedId ?? "") === String(m.id)
                        ? "bg-amber-50 ring-2 ring-inset ring-amber-400"
                        : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-8 py-6">
                      <div className="font-mono text-sm font-black text-[#1C2434]">
                        {m.code_mouvement ?? `#${m.id.substring(0, 8)}`}
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-gray-400 uppercase">
                        {formatDate(m.date_mouvement)}
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <TypeBadge type={m.type_mouvement} />
                    </td>

                    <td className="px-6 py-6">
                      <StatusBadge statut={m.statut} />
                    </td>

                    <td className="px-6 py-6">
                      <div className="text-sm font-black text-[#1C2434] leading-tight">
                        {m.emballage ? formatEmballageLabel(m.emballage) : "N/A"}
                      </div>
                      <div className="mt-1 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-tight text-gray-500">
                        Lot: {m.lot?.code_lot ?? "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-6">
                      <div className="text-sm font-black text-[#1C2434] leading-tight">
                        Source: {m.entrepotSource?.nom ?? "N/A"}
                      </div>
                      <div className="mt-1 text-sm font-black text-[#1C2434] leading-tight">
                        Destination: {m.entrepotDestination?.nom ?? "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <div className="text-lg font-[1000] tracking-tighter text-[#1C2434]">
                        {formatQuantity(m.quantite)}
                      </div>
                      <div className="text-[9px] font-black uppercase text-gray-400">
                        Unités
                      </div>
                    </td>

                    <td className="px-6 py-6 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00A09D]/10 text-[#00A09D]">
                          <User size={14} />
                        </div>
                        <span className="text-[10px] font-extrabold uppercase text-[#1C2434]">
                          {m.user?.name ?? "Système"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-6 text-right align-middle">
                      {isMouvementBrouillon(m.statut) ? (
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={() => onValidate(m.id)}
                            disabled={busyActionId != null}
                            aria-label={`Valider le mouvement ${m.code_mouvement ?? m.id}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#00A09D] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition hover:bg-[#008e8b] disabled:opacity-40"
                          >
                            {busyActionId === m.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            ) : (
                              <CheckCircle2 size={14} aria-hidden />
                            )}
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(m.id)}
                            disabled={busyActionId != null}
                            aria-label={`Supprimer le brouillon ${m.code_mouvement ?? m.id}`}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                          >
                            {busyActionId === m.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                            ) : (
                              <Trash2 size={14} aria-hidden />
                            )}
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold uppercase text-gray-400" title="Déjà validé">
                          Validé
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResponsiveTableWrap>
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <LocalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}