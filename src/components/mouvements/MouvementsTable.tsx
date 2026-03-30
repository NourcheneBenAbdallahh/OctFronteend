"use client";

import { formatDate, formatEmballageLabel, formatFlow, formatQuantity } from "@/lib/mouvement.helpers";
import { MouvementStock } from "@/types/mouvement";
import { StatusBadge, TypeBadge } from "./mouvement-ui";
import { CheckCircle2, Trash2, History, User, ChevronLeft, ChevronRight } from "lucide-react";

export default function MouvementsTable({
  items,
  loading,
  onValidate,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  items: MouvementStock[];
  loading: boolean;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30 text-left text-[10px] font-black uppercase tracking-[0.2em] text-[#1C2434]/60">
                <th className="px-8 py-5">Code & Date_Mvt</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Statut</th>
                <th className="px-6 py-5">Produit / Lot</th>
                <th className="px-6 py-5">Entrepots</th>
                <th className="px-6 py-5 text-center">Quantité</th>
                <th className="px-6 py-5 text-center">Créé Par</th>
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
              ) : !items || items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Aucun mouvement enregistré
                  </td>
                </tr>
              ) : (
                items.map((m) => (
                  <tr key={m.id} className="group transition-all hover:bg-gray-50/50">
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
Destination: {m.entrepotDestination?.nom ?? "N/A"}  </div>
</td>

                    <td className="px-6 py-6 text-center">
                      <div className="text-lg font-[1000] tracking-tighter text-[#1C2434]">
                        {formatQuantity(m.quantite)}
                      </div>
                      <div className="text-[9px] font-black uppercase text-gray-400">Unités</div>
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

             
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-6 py-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Page {currentPage} sur {totalPages}
            </span>
            <div className="text-xs font-bold text-[#1C2434] mt-1">
              Total : {totalItems} mouvement(s)
            </div>
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}