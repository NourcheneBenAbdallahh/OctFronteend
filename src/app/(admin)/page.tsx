"use client";

import React, { useEffect, useMemo, useState } from "react";
import { canViewFournisseursMap, filterStocksForDashboardUser } from "@/lib/access";
import { getStocks } from "@/lib/stock.api"; 
import { Stock } from "@/types/stock";

// Imports des composants BI
import PackagingMetrics from "@/components/dashboard/PackagingMetrics";
import StockTrendChart from "@/components/dashboard/StockTrendChart";
import RecentStockMovements from "@/components/dashboard/RecentStockMovements";
import StockHealthScore from "@/components/dashboard/StockHealthScore";
import StockPredictionCard from "@/components/dashboard/StockPredictionCard";
import FournisseursMapCard from "@/components/fournisseurs/FournisseursMapCard";
import { useAuthStore } from "@/store/useAuthStore";

export default function Ecommerce() {
  const user = useAuthStore((s) => s.user);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await getStocks(1, 500);
        setStocks(data);
      } catch (err) {
        console.error("Erreur de chargement BI:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const dashboardStocks = useMemo(
    () => filterStocksForDashboardUser(stocks, user?.id ?? null, user?.role ?? null),
    [stocks, user?.id, user?.role]
  );

 return (
  <div className="flex flex-col gap-6">
    {/* 1. Les 4 KPI du haut */}
    <div data-tour="page-dashboard-kpi">
    <PackagingMetrics stocks={dashboardStocks} loading={loading} />
    </div>

    <div className="grid grid-cols-12 gap-6 items-start">
      
      {/* --- COLONNE GAUCHE (8/12) : PILOTAGE & DÉTAILS --- */}
      <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
        
        {/* Le Graphique de Flux */}
        <div className="w-full bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm">
           <StockTrendChart stocks={dashboardStocks} />
        </div>
        
        {/* SECTION INTELLIGENCE PRÉDICTIVE */}
        <div className="bg-[#F8FAFA] p-8 rounded-[40px] border border-[#DDF2F1] w-full">
           <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-[1000] text-[#1C2434] uppercase tracking-tighter">
                  Alertes Prédictives
                </h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Basé sur la consommation réelle par produit
                </p>
              </div>
            
           </div>
           
           <StockPredictionCard stocks={dashboardStocks} />
        </div>

        {/* ✅ AJOUTÉ ICI : Le Journal des Flux (Lots) sous la prédiction */}
        <div className="w-full">
           <RecentStockMovements stocks={dashboardStocks} />
        </div>
      </div>

      {/* --- COLONNE DROITE (4/12) : SANTÉ & GÉO --- */}
      <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
        {/* Santé globale (Radial bar) */}
        <StockHealthScore stocks={dashboardStocks} />
        
        {canViewFournisseursMap(user?.role) ? <FournisseursMapCard /> : null}
        
        {/* Petit rappel informatif ou autre widget si nécessaire */}
     <div className="p-8 bg-gradient-to-br from-[#00A09D] to-[#00817F] rounded-[40px] text-white shadow-lg shadow-[#00A09D]/10 relative overflow-hidden group">
  {/* Un petit cercle décoratif en arrière-plan pour le style */}
  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
  
  <div className="relative z-10">
    <div className="flex items-center gap-2 mb-3">
       <div className="w-1.5 h-6 bg-white/40 rounded-full" />
       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
         Note de gestion
       </h4>
    </div>
    
    <p className="text-[13px] font-bold leading-relaxed italic pr-4">
      "L'anticipation est la clé d'une chaîne logistique sans rupture."
    </p>
    
    <div className="mt-4 flex justify-end">
       <span className="text-[8px] font-black uppercase px-2 py-1 bg-black/10 rounded-lg">
         PFE 2026 • OCT
       </span>
    </div>
  </div>
</div>
      </div>

    </div>
  </div>
);
}