"use client";

import { X, Hash, ArrowDownToLine, ArrowUpFromLine, Calendar, User, Warehouse, Package } from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  stock: Stock | null;
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
    minute: "2-digit",
  });
}

export default function StockDetailsDrawer({ stock, open, onClose }: Props) {
  if (!open || !stock) return null;

  const isEntree = stock.sens === "entree";

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden">
      {/* Overlay avec flou pour focus sur le drawer */}
      <div 
        className="absolute inset-0 bg-[#1C2434]/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER STYLE CONTRAT */}
        <div className="px-10 pt-12 pb-8 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <span className={`px-4 py-1 rounded-full text-[10px] font-[1000] uppercase tracking-[0.2em] ${
                isEntree ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
              }`}>
                {stock.sens}
              </span>
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Mouvement #{stock.id}
              </span>
            </div>
            <h2 className="text-[42px] font-[1000] text-[#1C2434] leading-[1.1] tracking-tight">
              Détails du <br />
              <span className="text-[#00A09D]">Stock.</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all group"
          >
            <X size={24} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENU AÉRÉ */}
        <div className="form-scroll flex-1 space-y-8 px-10 py-6">
          
          {/* SECTION QUANTITÉ IMPACT */}
          <div className="bg-gray-50 rounded-[32px] p-8 flex items-center justify-between overflow-hidden relative">
            <div>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Quantité Totale</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-[1000] text-[#1C2434]">
                  {Number(stock.quantite).toLocaleString("fr-FR")}
                </span>
                <span className="text-gray-400 font-bold">unités</span>
              </div>
            </div>
            <div className="text-[#00A09D]/10">
              {isEntree ? <ArrowDownToLine size={80} /> : <ArrowUpFromLine size={80} />}
            </div>
          </div>

          {/* GRID D'INFORMATIONS */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10">
            <InfoIcon 
              icon={<Hash size={20} />} 
              label="Référence Lot" 
              value={stock.lot?.code_lot || "Aucun lot"} 
            />
            <InfoIcon 
              icon={<Warehouse size={20} />} 
              label="Emplacement" 
              value={stock.entrepot?.nom || stock.entrepot?.name || "Non spécifié"} 
            />
            <InfoIcon 
              icon={<Package size={20} />} 
              label="Type Emballage" 
              value={stock.emballage?.name || "Vrac"} 
            />
            <InfoIcon 
              icon={<Calendar size={20} />} 
              label="Date d'opération" 
              value={formatDate(stock.date_stock)} 
            />
            <InfoIcon 
              icon={<User size={20} />} 
              label="Opérateur" 
              value={stock.user?.name || "Système"} 
            />
            <InfoIcon 
              icon={<Calendar size={20} />} 
              label="Enregistré le" 
              value={formatDate(stock.created_at)} 
            />
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-10 py-8 border-t border-gray-50 bg-white">
          <button
            onClick={onClose}
            className="w-full h-14 rounded-2xl bg-[#1C2434] text-white font-bold text-sm uppercase tracking-widest hover:bg-[#00A09D] transition-colors shadow-lg shadow-gray-200"
          >
            Fermer le volet
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoIcon({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-[#00A09D] shrink-0 font-bold">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">
          {label}
        </span>
        <span className="text-[15px] font-[900] text-[#1C2434] leading-tight">
          {value}
        </span>
      </div>
    </div>
  );
}