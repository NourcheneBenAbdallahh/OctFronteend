"use client";

import { X, Package, CalendarDays, User2, MessageSquareText, Hash, Info, History } from "lucide-react";
import type { Lot } from "@/types/lot";

interface Props {
  lot: Lot | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getEmballageLabel(lot: Lot | null) {
  if (!lot) return "-";
  return lot.emballage?.name || lot.emballage?.code || `Emballage #${lot.emballage_id}`;
}

export default function LotDetailsDrawer({ lot, open, onClose }: Props) {
  if (!open || !lot) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay avec flou pour le focus */}
      <div
        className="absolute inset-0 bg-[#1C2434]/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative h-full w-full max-w-xl bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER STYLE "DASHBOARD" */}
        <div className="px-8 py-8 border-b border-gray-50">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#F2F7F7] text-[#00A09D] text-[10px] font-[1000] uppercase tracking-[0.2em] rounded-full">
                  Fiche Traçabilité
                </span>
               
              </div>
              <h2 className="text-4xl font-[1000] text-[#1C2434] uppercase tracking-tighter mt-2">
                {lot.code_lot}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1C2434] hover:bg-gray-100 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* CONTENU - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
          
          {/* SECTION 1: STATS CLÉS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-[32px] bg-[#F2F7F7] border border-[#DDF2F1]">
              <div className="flex items-center gap-2 text-[#00A09D] mb-4">
                <Package size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Volume Total</span>
              </div>
              <div className="text-4xl font-[1000] text-[#1C2434] tracking-tighter">
                {Number(lot.quantite).toLocaleString("fr-FR")}
                <span className="ml-2 text-sm text-gray-400 font-black uppercase tracking-widest">PCS</span>
              </div>
            </div>

            <div className="p-6 rounded-[32px] bg-white border-2 border-gray-50">
              <div className="flex items-center gap-2 text-gray-400 mb-4">
                <CalendarDays size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Mouvement</span>
              </div>
              <div className="text-[15px] font-[900] text-[#1C2434] leading-tight">
                {formatDate(lot.date_mvt)}
              </div>
            </div>
          </div>

          {/* SECTION 2: INFOS COMPLÉMENTAIRES */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-[#00A09D]" />
              <h3 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.3em]">Propriétés du lot</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Emballage */}
              <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl group hover:border-[#DDF2F1] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#00A09D] transition-colors">
                    <Hash size={18} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Type Emballage</span>
                </div>
                <span className="text-[14px] font-[900] text-[#1C2434] uppercase">{getEmballageLabel(lot)}</span>
              </div>

              {/* Utilisateur */}
              <div className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-2xl group hover:border-[#DDF2F1] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#00A09D] transition-colors">
                    <User2 size={18} />
                  </div>
                  <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Opérateur</span>
                </div>
                <span className="text-[14px] font-[900] text-[#1C2434] uppercase">{lot.user?.name || "Système"}</span>
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMENTAIRES STYLE "MESSAGE" */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-8 bg-orange-400" />
              <h3 className="text-[11px] font-[1000] text-gray-400 uppercase tracking-[0.3em]">Observations</h3>
            </div>
            
            <div className="p-6 bg-orange-50/30 border border-orange-100/50 rounded-[32px] relative overflow-hidden">
              <MessageSquareText size={60} className="absolute -right-4 -bottom-4 text-orange-200 opacity-20" />
              <p className="text-[14px] leading-relaxed font-medium text-gray-700 relative z-10 italic">
                "{lot.commentaire?.trim() || "Aucune observation particulière n'a été rattachée à ce lot de production."}"
              </p>
            </div>
          </div>

          {/* SECTION 4: METADONNÉES TECHNIQUES */}
          <div className="pt-6 border-t border-gray-50">
             <div className="grid grid-cols-2 gap-8">
                <div>
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1 text-right">Création</p>
                   <p className="text-[11px] font-bold text-gray-500 text-right">{formatDate(lot.created_at)}</p>
                </div>
                <div>
                   <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Mise à jour</p>
                   <p className="text-[11px] font-bold text-gray-500">{formatDate(lot.updated_at)}</p>
                </div>
             </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-6 border-t border-gray-50 bg-[#F8FAFA] flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-4 bg-[#1C2434] text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#00A09D] transition-all shadow-lg shadow-gray-200"
          >
            Fermer l'inspecteur
          </button>
        </div>
      </div>
    </div>
  );
}