import React from "react";
import { Truck, Package, CheckCircle2 } from "lucide-react";

export const CommandeTimeline = ({ total, dejaRecu, actuel }: { total: number; dejaRecu: number; actuel: number }) => {
  const totalApresSaisie = Math.min(dejaRecu + actuel, total);
  const pourcentageAncien = (dejaRecu / total) * 100;
  const pourcentageNouveau = (totalApresSaisie / total) * 100;

  return (
    <div className="bg-gray-50/50 rounded-[2.5rem] p-6 border border-gray-100 my-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-1">État de la Commande</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-gray-900">{totalApresSaisie}</span>
            <span className="text-sm font-bold text-gray-300 uppercase">/ {total} Unités</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter ${pourcentageNouveau === 100 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>
            {pourcentageNouveau === 100 ? 'Terminée' : `${Math.round(pourcentageNouveau)}% Reçu`}
          </span>
        </div>
      </div>

      {/* Track du Bus */}
      <div className="relative h-14 flex items-center px-2">
        {/* Rail de fond */}
        <div className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
           {/* Barre de progression fantôme (ce qui a déjà été reçu) */}
           <div className="h-full bg-gray-300 transition-all duration-1000" style={{ width: `${pourcentageAncien}%` }} />
           {/* Barre de progression active (nouvelle saisie) */}
           <div className="h-full bg-indigo-500 absolute top-0 transition-all duration-1000 ease-out" style={{ width: `${pourcentageNouveau}%` }} />
        </div>

        {/* Le Bus (Camion) */}
        <div 
          className="absolute transition-all duration-1000 ease-in-out z-10"
          style={{ left: `calc(${pourcentageNouveau}% - 24px)` }}
        >
          <div className={`p-2.5 rounded-2xl shadow-xl transition-colors duration-500 ${pourcentageNouveau === 100 ? 'bg-green-600' : 'bg-indigo-600'} text-white animate-bounce-slow`}>
            {pourcentageNouveau === 100 ? <CheckCircle2 className="h-5 w-5" /> : <Truck className="h-5 w-5 fill-current" />}
          </div>
          {/* Tooltip quantité */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] font-black px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            +{actuel}
          </div>
        </div>

        {/* Points d'étapes */}
        <div className="absolute left-0 h-4 w-4 rounded-full bg-white border-4 border-indigo-600" title="Départ" />
        <div className={`absolute right-0 h-4 w-4 rounded-full border-4 transition-colors ${pourcentageNouveau === 100 ? 'bg-white border-green-600' : 'bg-white border-gray-200'}`} title="Destination" />
      </div>

      <div className="flex justify-between mt-4">
        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
            <Package className="h-3 w-3" /> Stock Fournisseur
        </div>
        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
            Entrepôt Central <CheckCircle2 className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
};