"use client";

import { LayoutGrid, CheckCircle2, Box } from "lucide-react";

export default function StocksHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      {/* TITRE STYLE CONTRATS */}
      <div className="flex items-center">
        <h1 className="text-[48px] font-black text-[#1C2434] tracking-tighter flex items-center gap-1">
          Stocks<span className="text-[#00A09D]">.</span>
        </h1>
      </div>

      {/* STATS COMPACTES (À DROITE COMME SUR LA CAPTURE) */}
      <div className="flex items-center gap-4">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 pr-8 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED]">
            <Box size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mouvements</span>
            <span className="text-xl font-black text-[#1C2434]">154</span>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 pr-8 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
            <CheckCircle2 size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Réalisation</span>
            <span className="text-xl font-black text-[#1C2434]">84%</span>
          </div>
        </div>

        <button 
        
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
        >
        Nouveau
        </button>
      </div>
    </div>
  );
}