"use client";

import {
  Package,
  MapPin,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Calendar,
} from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

interface Props {
  data: TableInventaire[];
  onAdjust: (id: string, newVal: number) => void;
  onView: (item: TableInventaire) => void;
  onEdit: (item: TableInventaire) => void;
  onDelete: (id: string) => void;
}

export default function InventaireAuditCards({ data, onAdjust, onView, onEdit, onDelete }: Props) {
  if (!data.length) {
    return (
      <div className="bg-white border-2 border-dashed border-gray-100 rounded-[32px] p-20 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
          <Package size={40} />
        </div>
        <p className="text-[13px] font-[1000] uppercase tracking-widest text-gray-400">
          Aucun résultat pour ces filtres
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-20">
      {data.map((row) => {
        const isLoss = row.ecart < 0;
        const isPerfect = row.ecart === 0;
        const progress = row.stock_theorique > 0 
          ? Math.min((row.stock_physique / row.stock_theorique) * 100, 100) 
          : 0;

        return (
          <div
            key={row.id}
            className="group relative bg-white rounded-[32px] border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 overflow-hidden"
          >
            {/* Barre de statut latérale */}
            <div className={`absolute left-0 top-0 bottom-0 w-2 ${
              isLoss ? "bg-red-500" : isPerfect ? "bg-[#00A09D]" : "bg-blue-500"
            }`} />

            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr_0.8fr_1fr] gap-0">
              
              {/* SECTION 1 : PRODUIT */}
              <div className="p-8 border-r border-gray-50">
                <div className="flex items-center gap-5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isLoss ? "bg-red-50 text-red-500" : isPerfect ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-500"
                  }`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-[1000] text-[#1C2434] leading-tight tracking-tight">
                      {row.emballage_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                       <MapPin size={12} className="text-[#00A09D]" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                         {row.entrepot_name}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-gray-400">
                    <span>Précision du stock</span>
                    <span className={isLoss ? "text-red-500" : "text-[#00A09D]"}>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        isLoss ? "bg-red-500" : isPerfect ? "bg-[#00A09D]" : "bg-blue-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2 : THÉORIQUE */}
              <div className="p-8 border-r border-gray-50 bg-gray-50/30 flex flex-col justify-center text-center xl:text-left">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Système</span>
                <div className="text-[32px] font-[1000] text-gray-400 tracking-tighter">
                  {row.stock_theorique}
                </div>
                <span className="text-[11px] font-bold text-gray-300">Unités théoriques</span>
              </div>

              {/* SECTION 3 : PHYSIQUE (AJUSTABLE) */}
              <div className="p-8 border-r border-gray-50 flex flex-col justify-center group/input">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00A09D] mb-2">Comptage Réel</span>
                <input
                  type="number"
                  defaultValue={row.stock_physique}
                  onBlur={(e) => onAdjust(row.id, parseFloat(e.target.value))}
                  className="w-full text-[42px] font-[1000] text-[#1C2434] tracking-tighter outline-none bg-transparent focus:text-[#00A09D] transition-colors"
                />
                <div className="h-1 w-12 bg-gray-100 group-focus-within/input:w-full group-focus-within/input:bg-[#00A09D] transition-all duration-500" />
              </div>

              {/* SECTION 4 : RÉSULTAT & ACTIONS */}
              <div className="p-8 flex flex-col justify-between bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2">Écart final</span>
                    {isPerfect ? (
                      <div className="flex items-center gap-2 text-[#00A09D]">
                        <CheckCircle2 size={18} />
                        <span className="text-lg font-[1000] tracking-tighter uppercase">Conforme</span>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-2 text-2xl font-[1000] tracking-tighter ${isLoss ? "text-red-500" : "text-blue-500"}`}>
                        {isLoss ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
                        {row.ecart > 0 ? `+${row.ecart}` : row.ecart}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => onView(row)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#1C2434] hover:text-white transition-all">
                      <Eye size={18} />
                    </button>
                    <button onClick={() => onEdit(row)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-[#00A09D] hover:text-white transition-all">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => onDelete(row.id)} className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between text-[11px] font-bold text-gray-300 uppercase tracking-widest border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(row.date_inventaire).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })}
    </div>
  );
}