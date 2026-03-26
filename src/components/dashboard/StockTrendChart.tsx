"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Stock } from "@/types/stock";

const Chart = dynamic(() => import("react-apexcharts"), { 
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-gray-50 animate-pulse rounded-[40px]" /> 
});

interface Props {
  stocks: Stock[];
}

export default function StockTrendChart({ stocks }: Props) {
  
  // --- BI LOGIQUE : Transformer les stocks en séries temporelles ---
  
  // 1. Générer les 6 derniers mois (labels)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString('fr-FR', { month: 'short' });
  });

  // 2. Initialiser les tableaux de données à 0
  const monthlyEntrees = new Array(6).fill(0);
  const monthlySorties = new Array(6).fill(0);

  // 3. Remplir les données avec les VRAIS stocks
  stocks.forEach(s => {
    const date = new Date(s.date_stock);
    const monthDiff = (new Date().getMonth() - date.getMonth() + 12) % 12;
    
    // Si la donnée date d'il y a moins de 6 mois
    if (monthDiff < 6) {
      const index = 5 - monthDiff; // Placer au bon index du tableau (0 à 5)
      if (s.sens === 'entree') {
        monthlyEntrees[index] += Number(s.quantite);
      } else {
        monthlySorties[index] += Number(s.quantite);
      }
    }
  });

  const chartOptions: any = {
    legend: { show: false },
    colors: ["#00A09D", "#FF9C55"],
    chart: {
      fontFamily: "inherit",
      type: "area",
      toolbar: { show: false },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    stroke: { curve: "smooth", width: 3 },
    grid: {
      strokeDashArray: 5,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: last6Months,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { 
      labels: {
        formatter: (val: number) => val.toLocaleString()
      }
    },
    tooltip: { 
      y: { formatter: (val: number) => `${val.toLocaleString()} PCS` }
    },
  };

  const series = [
    { name: "Entrées (Achats)", data: monthlyEntrees },
    { name: "Sorties (Production)", data: monthlySorties },
  ];

  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-[1000] text-[#1C2434] uppercase tracking-tighter">
            Analyse des Flux Réels
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Basé sur les {stocks.length} derniers mouvements
          </p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#00A09D]"></span>
            <span className="text-[10px] font-[1000] text-[#1C2434] uppercase">Réception</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF9C55]"></span>
            <span className="text-[10px] font-[1000] text-[#1C2434] uppercase">Consommation</span>
          </div>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <Chart options={chartOptions} series={series} type="area" height="100%" />
      </div>
    </div>
  );
}