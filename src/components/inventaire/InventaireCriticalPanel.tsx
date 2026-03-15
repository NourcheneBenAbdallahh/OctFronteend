"use client";

import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
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
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-5">
        <div className="flex items-center gap-2 text-green-600 font-bold">
          <AlertTriangle size={18} />
          Aucun écart critique détecté
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-700">
          Écarts critiques
        </h2>
        <span className="text-[11px] text-gray-400 uppercase">Priorité audit</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {critical.map((item) => {
          const negative = item.ecart < 0;

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`text-left rounded-sm border p-4 transition-all hover:shadow-md ${
                negative
                  ? "border-red-200 bg-red-50"
                  : "border-blue-200 bg-blue-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase ${
                    negative ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {negative ? "Perte" : "Surplus"}
                </span>
                {negative ? (
                  <ArrowDownRight size={16} className="text-red-500" />
                ) : (
                  <ArrowUpRight size={16} className="text-blue-500" />
                )}
              </div>

              <div className="mt-3 text-sm font-bold text-gray-800">
                {item.emballage_name}
              </div>
              <div className="text-[11px] text-gray-500 uppercase mt-1">
                {item.entrepot_name}
              </div>

              <div className="mt-4 text-2xl font-black">
                {item.ecart > 0 ? `+${item.ecart}` : item.ecart}
              </div>

              <div className="mt-2 text-[11px] text-gray-500">
                Théo. {item.stock_theorique} · Phys. {item.stock_physique}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}