"use client";

import {
  CalendarDays,
  Package,
  User2,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Eye,
  Hash,
  ArrowRight
} from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  stock: Stock;
  onView?: (stock: Stock) => void;
  onEdit?: (stock: Stock) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function StockCard({ stock, onView }: Props) {
  const isEntree = stock.sens === "entree";

  return (
    <div className="group bg-white border border-gray-100 rounded-[32px] p-8 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 relative overflow-hidden">
      
      {/* HEADER DE LA CARTE */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className={`px-4 py-1 rounded-full text-[10px] font-[1000] uppercase tracking-[0.2em] border ${
              isEntree 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-orange-50 text-orange-600 border-orange-100"
            }`}>
              {stock.sens}
            </span>
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              ID #{stock.id}
            </span>
          </div>
          <h3 className="text-[13px] font-[1000] text-gray-400 uppercase mt-2 flex items-center gap-2">
            <Hash size={14} className="text-[#00A09D]" />
            Lot: <span className="text-[#1C2434]">{stock.lot?.code_lot || "N/A"}</span>
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onView?.(stock)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-[#00A09D] hover:bg-[#F2F7F7] transition-all"
          >
            <Eye size={20} />
          </button>
          
        </div>
      </div>

      {/* ZONE QUANTITÉ (TRÈS GRANDE) */}
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-[52px] font-[1000] text-[#1C2434] tracking-tighter leading-none">
            {Number(stock.quantite).toLocaleString("fr-FR")}
          </span>
          <span className="text-gray-400 font-bold text-lg uppercase tracking-widest">Unités</span>
        </div>
        <div className="w-full bg-gray-50 h-[1px] mt-4 relative">
            <div className={`absolute left-0 top-0 h-full w-24 ${isEntree ? 'bg-emerald-400' : 'bg-orange-400'}`} />
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <Warehouse size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Entrepôt</span>
          </div>
          <p className="text-[15px] font-[900] text-[#1C2434] leading-tight">
            {stock.entrepot?.nom || stock.entrepot?.name || "Non défini"}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <Package size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Emballage</span>
          </div>
          <p className="text-[15px] font-[900] text-[#1C2434] leading-tight truncate">
            {stock.emballage?.name || "Vrac / Aucun"}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <CalendarDays size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Date</span>
          </div>
          <p className="text-[13px] font-bold text-gray-600">
            {formatDate(stock.date_stock)}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-400">
            <User2 size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Auteur</span>
          </div>
          <p className="text-[13px] font-bold text-gray-600 truncate">
            {stock.user?.name || "Système"}
          </p>
        </div>
      </div>

      {/* DÉCORATION ICON SENS (FOND DE CARTE) */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
        {isEntree ? <ArrowDownToLine size={180} /> : <ArrowUpFromLine size={180} />}
      </div>
    </div>
  );
}