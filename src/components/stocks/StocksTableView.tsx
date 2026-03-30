"use client";

import { Eye, Trash2, ArrowDownToLine, ArrowUpFromLine, User2 } from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  rows: Stock[];
  onView?: (stock: Stock) => void;
  onDelete?: (stock: Stock) => void;
}

export default function StocksTableView({ rows, onView, onDelete }: Props) {
  if (!rows.length) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sens</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Référence Lot</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Entrepôt & Emballage</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Quantité</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Date</th>
            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((stock) => {
            const isEntree = stock.sens === "entree";
            return (
              <tr key={stock.id} className="group hover:bg-[#F2F7F7]/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEntree ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                      {isEntree ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-black text-[#1C2434] text-sm">
                  {stock.lot?.code_lot || "N/A"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#1C2434]">{stock.entrepot?.nom || stock.entrepot?.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase font-black">{stock.emballage?.name || "Vrac"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`text-base font-[1000] ${isEntree ? 'text-emerald-600' : 'text-orange-600'}`}>
                    {Number(stock.quantite).toLocaleString("fr-FR")}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-bold text-gray-500">
                  {stock.date_stock ? new Date(stock.date_stock).toLocaleDateString("fr-FR") : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onView?.(stock)} className="p-2 text-gray-400 hover:text-[#00A09D] transition-colors"><Eye size={18} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}