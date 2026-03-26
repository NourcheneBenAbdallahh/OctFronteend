"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

interface Props {
  data: TableInventaire[];
  onSelect: (item: TableInventaire) => void;
}

export default function InventaireCriticalPanel({ data, onSelect }: Props) {
  const critical = [...data]
    .filter((i) => i.ecart !== 0)
    .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))
    .slice(0, 5);

  if (!critical.length) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-[32px] p-8 mb-10">
        <div className="flex items-center gap-4 text-emerald-600 font-[1000] uppercase text-[12px] tracking-widest">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
          Aucun écart critique à signaler. Le stock est parfaitement aligné.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-[11px] font-[1000] uppercase tracking-[0.2em] text-[#1C2434]">
            Top 5 Écarts Critiques
          </h2>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">
          Priorité Audit
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {critical.map((item) => {
          const isNegative = item.ecart < 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`group relative text-left rounded-[28px] border p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                isNegative
                  ? "border-red-100 bg-white hover:border-red-200"
                  : "border-blue-100 bg-white hover:border-blue-200"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-[9px] font-[1000] uppercase tracking-tighter px-2.5 py-1 rounded-full ${
                    isNegative ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                  }`}
                >
                  {isNegative ? "Perte Sèche" : "Surplus Stock"}
                </span>
                <div className={`p-2 rounded-xl ${isNegative ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                   {isNegative ? <ArrowDownRight size={16} /> : <ArrowUpRight size={16} />}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[14px] font-[1000] text-[#1C2434] leading-tight truncate">
                  {item.emballage_name}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">
                  {item.entrepot_name}
                </div>
              </div>

              <div className={`mt-6 text-3xl font-[1000] tracking-tighter ${isNegative ? "text-red-600" : "text-blue-600"}`}>
                {item.ecart > 0 ? `+${item.ecart}` : item.ecart}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-gray-400">THÉORIQUE</span>
                   <span className="text-[#1C2434]">{item.stock_theorique}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-gray-400">PHYSIQUE</span>
                   <span className={`font-black ${isNegative ? "text-red-500" : "text-blue-500"}`}>{item.stock_physique}</span>
                </div>
              </div>

              {/* Effet visuel au hover */}
              <div className={`absolute inset-x-0 bottom-0 h-1 rounded-b-[28px] transition-all ${isNegative ? "bg-red-500" : "bg-blue-500"} opacity-0 group-hover:opacity-100`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}