"use client";

import {
  CalendarDays,
  MessageSquareText,
  Package,
  User2,
  Pencil,
  Trash2,
  Eye,
  ArrowRight
} from "lucide-react";
import { Lot } from "@/types/lot";

interface Props {
  lot: Lot;
  compact?: boolean;
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function LotCard({ lot, compact = false, onView, onEdit, onDelete }: Props) {
  return (
    /* AJOUT : flex flex-col h-full pour que toutes les cartes aient la même hauteur */
    <div className="group relative bg-white border-2 border-gray-50 rounded-[40px] p-8 flex flex-col h-full transition-all duration-500 hover:border-[#DDF2F1] hover:shadow-[20px_20px_60px_rgba(0,160,157,0.05)]">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 rounded-[20px] bg-[#F2F7F7] border border-[#DDF2F1] flex items-center justify-center text-[#00A09D] group-hover:scale-110 transition-transform duration-500">
            <Package size={24} />
          </div>
          <div className="min-w-0"> {/* min-w-0 permet le truncate */}
            <span className="text-[9px] font-[1000] text-[#00A09D] uppercase tracking-[0.2em] block">Lot Identifiant</span>
            <h3 className="text-2xl font-[1000] text-[#1C2434] uppercase tracking-tighter leading-tight truncate">
              {lot.code_lot}
            </h3>
          </div>
        </div>
        
        <div className="shrink-0">
          <div className="px-3 py-1.5 bg-[#F8FAFA] rounded-xl border border-gray-100">
             <span className="text-[10px] font-black text-[#1C2434] uppercase tracking-wider">
               {lot.emballage?.name || "Standard"}
             </span>
          </div>
        </div>
      </div>

      {/* BODY : flex-1 pousse le footer vers le bas */}
      <div className="flex-1 space-y-8">
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00A09D] animate-pulse" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock Actuel</span>
          </div>
          <div className="text-5xl font-[1000] text-[#1C2434] tracking-tighter flex items-baseline gap-2">
            {Number(lot.quantite).toLocaleString()}
            <span className="text-lg text-gray-200 font-black uppercase">PCS</span>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-50">
           <div className="flex items-center gap-2 mb-1">
             <CalendarDays size={14} className="text-[#00A09D]" />
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dernière Mise à jour</span>
           </div>
           <div className="text-[12px] font-[900] text-[#1C2434] uppercase">
             {formatDate(lot.date_mvt)}
           </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-gray-50 flex flex-col gap-4">
        {/* Ligne Infos */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F2F7F7] rounded-full">
            <User2 size={12} className="text-[#00A09D]" />
            <span className="text-[9px] font-[1000] text-[#1C2434] uppercase tracking-widest truncate max-w-[80px]">
              {lot.user?.name || "Admin"}
            </span>
          </div>

          {lot.commentaire && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50/50 rounded-full border border-orange-100 flex-1 min-w-0">
              <MessageSquareText size={12} className="text-orange-400 shrink-0" />
              <span className="text-[9px] font-bold text-orange-700 uppercase truncate">
                {lot.commentaire}
              </span>
            </div>
          )}
        </div>

        {/* Ligne Boutons : Utilisation de justify-end pour coller à droite */}
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => onView?.(lot)}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#00A09D] hover:border-[#00A09D] transition-all"
          >
            <Eye size={18} />
          </button>
          
          <button 
            onClick={() => onEdit?.(lot)}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:text-[#1C2434] hover:border-[#1C2434] transition-all"
          >
            <Pencil size={18} />
          </button>

          <button 
            onClick={() => onDelete?.(lot)}
            className="h-10 px-4 shrink-0 flex items-center gap-2 rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest"
          >
            <Trash2 size={14} />
            <span>Suppr.</span>
          </button>
        </div>
      </div>
    </div>
  );
}