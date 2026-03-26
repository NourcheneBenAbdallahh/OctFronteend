"use client";
import React from "react";
import { Hourglass, AlertTriangle, TrendingUp, Calendar } from "lucide-react";
import { Stock } from "@/types/stock";
import Link from "next/link";
interface Props {
  stocks: Stock[];
  variant?: "small" | "large";
}

export default function StockPredictionCard({ stocks, variant = "small" }: Props) {
  
  // --- LOGIQUE BI : CALCUL PAR TYPE D'EMBALLAGE ---
  const productAnalysis = stocks.reduce((acc: any, s) => {
    const name = s.emballage?.name || "Inconnu";
    if (!acc[name]) acc[name] = { current: 0, consumption30d: 0 };
    
    const val = Number(s.quantite);
    if (s.sens === "entree") {
      acc[name].current += val;
    } else {
      acc[name].current -= val;
      // Calcul de la consommation sur les 30 derniers jours
      const isRecent = (new Date().getTime() - new Date(s.date_stock).getTime()) < (30 * 24 * 60 * 60 * 1000);
      if (isRecent) acc[name].consumption30d += val;
    }
    return acc;
  }, {});

  // Transformation en liste triée par urgence (jours restants)
  const predictions = Object.keys(productAnalysis)
    .map((name) => {
      const data = productAnalysis[name];
      const dailyConso = data.consumption30d / 30;
      const daysLeft = dailyConso > 0 ? Math.round(data.current / dailyConso) : 999;
      return { name, daysLeft, current: data.current, dailyConso };
    })
    .filter(p => p.current !== 0) // On ignore les produits sans stock du tout
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 3); // On affiche le Top 3 des risques
// Compte le nombre total de produits analysés
const totalProducts = Object.keys(productAnalysis).length;
const remainingCount = totalProducts - predictions.length;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {predictions.map((p, i) => {
        const isUrgent = p.daysLeft < 15;
        const isCritical = p.daysLeft < 7;

        return (
          <div 
            key={i} 
            className={`relative p-6 rounded-[35px] border-2 flex flex-col justify-between transition-all min-h-[220px] ${
              isCritical 
                ? "bg-red-50 border-red-200 shadow-sm" 
                : "bg-white border-gray-100 shadow-sm hover:border-[#00A09D]/30"
            }`}
          >
            {/* Badge de Temps */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[9px] font-[1000] uppercase tracking-wider ${
              isCritical ? "bg-red-500 text-white" : "bg-[#00A09D] text-white"
            }`}>
              {p.daysLeft > 90 ? "+90 JOURS" : `J-${p.daysLeft} AVANT RUPTURE`}
            </div>

            {/* Titre du Produit */}
            <div className="mt-2">
              <h4 className="text-[13px] font-[1000] text-[#1C2434] uppercase truncate pr-10 mb-1">
                {p.name}
              </h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                Analyse Prédictive
              </p>
            </div>

            {/* Stats du milieu */}
            <div className="flex justify-between items-center my-6">
              <div>
                <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Stock Actuel</p>
                <p className="text-xl font-[1000] text-[#1C2434] tracking-tighter">
                  {p.current.toLocaleString()} <span className="text-[10px] text-gray-400">PCS</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">Vitesse Sortie</p>
                <p className={`text-xl font-[1000] tracking-tighter ${isCritical ? "text-red-600" : "text-[#00A09D]"}`}>
                  {Math.round(p.dailyConso)} <span className="text-[10px] text-gray-400">/J</span>
                </p>
              </div>
            </div>

            {/* Footer : Suggestion d'achat */}
            <div className={`p-3 rounded-2xl flex items-center justify-between ${
              isCritical ? "bg-red-100/50" : "bg-[#F8FAFA]"
            }`}>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className={isCritical ? "text-red-500" : "text-[#00A09D]"} />
                <span className="text-[9px] font-black text-gray-500 uppercase">Qte suggérée</span>
              </div>
              <span className="text-xs font-[1000] text-[#1C2434]">
                +{Math.round(p.dailyConso * 60).toLocaleString()} <span className="text-[8px]">PCS</span>
              </span>
            </div>
          </div>
        );
      })}

      {/* Pied de composant : Statut de la surveillance globale */}
<div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-gray-100 pt-6">
  <div className="flex items-center gap-3">
    <div className="flex -space-x-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-[#00A09D]/10 text-[#00A09D] text-[8px] font-black flex items-center justify-center">
            PKG
          </div>
        </div>
      ))}
    </div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      <span className="text-[#1C2434] font-black">+{remainingCount} autres emballages</span> surveillés en temps réel
    </p>
  </div>


<Link href="/stock">
  <button className="group flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-2xl hover:border-[#00A09D] hover:text-[#00A09D] transition-all shadow-sm">
    <span className="text-[10px] font-black uppercase tracking-widest">Rapport complet</span>
    <TrendingUp size={14} className="group-hover:translate-y-[-2px] transition-transform" />
  </button>
</Link>
</div>
    </div>

    
  );
}