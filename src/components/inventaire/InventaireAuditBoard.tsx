// components/inventaire/InventaireAuditBoard.tsx
import React from "react";
import { TableInventaire } from "@/types/inventaire";
import { TrendingDown, TrendingUp, CheckCircle2, AlertCircle, Package } from "lucide-react";

interface Props {
  data: TableInventaire[];
  onAdjust: (id: string, newVal: number) => void;
}

export default function InventaireAuditBoard({ data, onAdjust }: Props) {
  return (
    <div className="bg-white border border-gray-300 rounded-sm shadow-sm overflow-hidden">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-gray-300 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            <th className="px-6 py-3 text-left">Produit / Emplacement</th>
            <th className="px-6 py-3 text-right">Théorique</th>
            <th className="px-6 py-3 text-center">Réel (Physique)</th>
            <th className="px-6 py-3 text-right">Écart constaté</th>
            <th className="px-6 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row) => {
            const isLoss = row.ecart < 0;
            const isPerfect = row.ecart === 0;

            return (
              <tr key={row.id} className="group hover:bg-[#F2F7F7] transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-sm text-gray-400 group-hover:text-[#00A09D]">
                      <Package size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{row.emballage_name}</div>
                      <div className="text-[10px] text-gray-400 uppercase font-medium">{row.entrepot_name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-gray-400">
                  {row.stock_theorique}
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex items-center border-b-2 border-gray-200 group-hover:border-[#00A09D] transition-colors">
                    <input 
                      type="number"
                      className="w-20 text-center bg-transparent py-1 font-bold text-gray-700 outline-none"
                      defaultValue={row.stock_physique}
                      onBlur={(e) => onAdjust(row.id, parseFloat(e.target.value))}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`flex items-center justify-end gap-1 font-bold ${isLoss ? 'text-red-500' : isPerfect ? 'text-gray-300' : 'text-green-500'}`}>
                    {isLoss ? <TrendingDown size={14} /> : !isPerfect ? <TrendingUp size={14} /> : null}
                    <span>{row.ecart > 0 ? `+${row.ecart}` : row.ecart}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {isPerfect ? (
                    <CheckCircle2 size={20} className="text-green-400 mx-auto" />
                  ) : (
                    <button className="bg-white border border-gray-300 text-[10px] font-black px-3 py-1 rounded-sm uppercase text-gray-600 hover:bg-[#00A09D] hover:text-white hover:border-[#00A09D] transition-all">
                      Ajuster
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}