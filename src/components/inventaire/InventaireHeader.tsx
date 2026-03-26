"use client";

import { ClipboardCheck, RefreshCw, ShieldAlert, CheckCircle2, Plus } from "lucide-react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
  onNew: () => void; // Ajoute cette prop pour ouvrir le drawer
  total: number;
  criticalCount: number;
}

export default function InventaireHeader({
  loading,
  onRefresh,
  onNew,
  total,
  criticalCount,
}: Props) {
  return (
    <div className="mb-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        
        {/* SECTION TITRE (Inchangée) */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F7F7] flex items-center justify-center text-[#00A09D]">
              <ClipboardCheck size={26} />
            </div>
            
            {criticalCount > 0 ? (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[10px] font-[1000] uppercase tracking-[0.15em]">
                <ShieldAlert size={14} />
                {criticalCount} Alerte{criticalCount > 1 ? "s" : ""} Critique{criticalCount > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-[1000] uppercase tracking-[0.15em]">
                <CheckCircle2 size={14} />
                Stock Stable
              </span>
            )}
          </div>

          <h1 className="text-[56px] font-[1000] text-[#1C2434] tracking-[-0.05em] leading-[0.9]">
            Inventaire<span className="text-[#00A09D]">.</span>
          </h1>
          
          <p className="text-gray-400 font-medium mt-4 text-[15px] max-w-xl leading-relaxed">
            Pilotage visuel des écarts. Actuellement 
            <span className="text-[#1C2434] font-black mx-1 inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-[13px]">
              {total}
            </span> 
            enregistrements sous surveillance.
          </p>
        </div>

        {/* --- ZONE DES BOUTONS D'ACTION --- */}
        <div className="flex items-center gap-3">
          {/* BOUTON ACTUALISER (Style secondaire) */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="h-14 px-6 inline-flex items-center justify-center rounded-full bg-white border border-gray-100 text-[#1C2434] shadow-sm hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-50"
            title="Actualiser les données"
          >
            <RefreshCw size={20} className={`${loading ? "animate-spin" : ""} text-[#00A09D]`} />
          </button>

          {/* BOUTON NOUVEL INVENTAIRE (Style Primaire - Noir) */}
          <button
            onClick={onNew}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
          >
            <Plus size={18} />
            Nouvel Audit
          </button>
        </div>
      </div>

      <div className="w-full h-[1px] bg-gray-100 mt-10" />
    </div>
  );
}