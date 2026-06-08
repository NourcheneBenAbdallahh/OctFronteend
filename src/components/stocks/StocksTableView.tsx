"use client";

import Link from "next/link";
import { Eye, ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import type { Stock } from "@/types/stock";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh, type TableSortHeaderProps } from "@/components/ui/SortableTableHeader";

interface Props extends TableSortHeaderProps {
  rows: Stock[];
  onView?: (stock: Stock) => void;
  onViewLot?: (stock: Stock) => void;
  focusedId?: string | number | null;
}

function getMouvementId(stock: Stock) {
  return stock.mouvement_stock_id ?? stock.mouvementStock?.id ?? null;
}

export default function StocksTableView({
  rows,
  onView,
  onViewLot,
  focusedId,
  sortKey,
  sortDirection,
  onSort,
}: Props) {
  if (!rows.length) return null;

  return (
    <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
      <ResponsiveTableWrap>
      <table className="w-full min-w-[1040px] text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <SortableTh columnKey="sens" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-6 py-5">Sens</SortableTh>
            <SortableTh columnKey="lot" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-6 py-5">Référence Lot</SortableTh>
            <SortableTh columnKey="entrepot" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-6 py-5">Entrepôt & Emballage</SortableTh>
            <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-6 py-5" align="right">Quantité</SortableTh>
            <SortableTh columnKey="date" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-6 py-5">Date</SortableTh>
            <th className="px-6 py-5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((stock) => {
            const isEntree = stock.sens === "entree";
            const mouvementId = getMouvementId(stock);
            const lotId = stock.lot_id ?? stock.lot?.id;

            return (
              <tr
                id={`stock-row-${stock.id}`}
                key={stock.id}
                className={`group transition-colors ${
                  String(focusedId ?? "") === String(stock.id)
                    ? "bg-indigo-50 ring-2 ring-indigo-300"
                    : "hover:bg-[#F2F7F7]/50"
                }`}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isEntree ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"}`}>
                      {isEntree ? <ArrowDownToLine size={14} aria-hidden /> : <ArrowUpFromLine size={14} aria-hidden />}
                    </div>
                    <span className={`rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                      isEntree
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : "border-orange-100 bg-orange-50 text-orange-600"
                    }`}>
                      {stock.sens}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {lotId ? (
                    <button
                      type="button"
                      onClick={() => onViewLot?.(stock)}
                      className="text-left text-sm font-black text-[#00A09D] underline-offset-2 transition-colors hover:text-[#007a78] hover:underline"
                    >
                      {stock.lot?.code_lot || "N/A"}
                    </button>
                  ) : (
                    <span className="text-sm font-black text-[#1C2434]">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1C2434]">{stock.entrepot?.nom || stock.entrepot?.name}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stock.emballage?.name || "Vrac"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-base font-black ${isEntree ? "text-emerald-600" : "text-orange-600"}`}>
                    {Number(stock.quantite).toLocaleString("fr-FR")}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500">
                  {stock.date_stock ? new Date(stock.date_stock).toLocaleDateString("fr-FR") : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {mouvementId ? (
                      <Link
                        href={`/mouvements?focus=${mouvementId}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm transition-all hover:border-[#00A09D]/30 hover:text-[#00A09D]"
                        title="Voir le mouvement source"
                      >
                        <History size={14} aria-hidden />
                        Mouvement
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onView?.(stock)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-all hover:border-[#00A09D]/30 hover:text-[#00A09D]"
                      aria-label="Voir le détail du stock"
                    >
                      <Eye size={16} />
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
}
