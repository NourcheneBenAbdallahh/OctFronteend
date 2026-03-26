"use client";

import { Boxes, LayoutGrid, Clock3 } from "lucide-react";

interface Props {
  viewMode: "timeline" | "cards";
  onChangeView: (mode: "timeline" | "cards") => void;
  count: number;
}

export default function LotsHeader({
  viewMode,
  onChangeView,
  count
}: Props) {
  return (
    <div className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
      {/* SECTION TITRE & FIL D'ARIANE */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#00A09D]">
            <Boxes size={20} />
          </div>
          <nav className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
            Traçabilité / <span className="text-gray-900">Flux Stocks</span>
          </nav>
        </div>
        
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
          Gestion des Lots<span className="text-[#00A09D]">.</span>
        </h1>
        
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-3 italic">
          Génération automatique post-réception
        </p>
      </div>

      {/* SECTION ACTIONS & STATS */}
      <div className="flex items-center gap-8">
        {/* Affichage du compteur comme sur Entrepôts */}
        <div className="text-right hidden sm:block">
          <span className="text-[10px] font-black text-gray-400 uppercase block leading-none mb-1">Total Flux</span>
          <span className="text-2xl font-black text-gray-900 leading-none">{count} Unités</span>
        </div>

        {/* SWITCHER DE VUE DESIGN "NEUMORPHIQUE/BRUTAL" */}
        <div className="flex bg-white p-1.5 rounded-2xl border-2 border-gray-900 shadow-[4px_4px_0px_rgba(0,160,157,0.2)]">
          <button
            onClick={() => onChangeView("timeline")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              viewMode === "timeline"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <Clock3 size={14} />
            Timeline
          </button>

          <button
            onClick={() => onChangeView("cards")}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              viewMode === "cards"
                ? "bg-gray-900 text-white"
                : "text-gray-400 hover:text-gray-900"
            }`}
          >
            <LayoutGrid size={14} />
            Grille
          </button>
        </div>
      </div>
    </div>
  );
}