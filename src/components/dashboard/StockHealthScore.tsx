"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Stock } from "@/types/stock";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function StockHealthScore({ stocks }: { stocks: Stock[] }) {
  
  // 1. On calcule le bilan réel par produit en tenant compte du min_stock
  const analysis = stocks.reduce((acc: any, s) => {
    const emballageId = s.emballage_id;
    // On récupère le min_stock depuis la relation (ou 0 par défaut)
    const minStock = s.emballage?.min_stock || 0; 
    console.log(`Emballage ${emballageId} - Min Stock: ${minStock}`);
    
    if (!acc[emballageId]) {
      acc[emballageId] = { current: 0, min: minStock };
    }

    const val = Number(s.quantite);
    if (s.sens === 'entree') {
      acc[emballageId].current += val;
    } else {
      acc[emballageId].current -= val;
    }
    return acc;
  }, {});

  const productEntries = Object.values(analysis) as any[];
  const totalTypes = productEntries.length;

  // 2. Un produit est "Healthy" UNIQUEMENT s'il est au-dessus de son PROPRE seuil d'alerte
  const healthy = productEntries.filter(p => p.current > p.min).length;
  
  // 3. Calcul du score final
  const score = totalTypes > 0 ? Math.round((healthy / totalTypes) * 100) : 0;

  const options: any = {
    chart: { type: "radialBar", sparkline: { enabled: true } },
    colors: [score > 80 ? "#00A09D" : score > 40 ? "#FF9C55" : "#EF4444"], // Vert, Orange ou Rouge
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "70%" },
        track: { background: "#F1F5F9", strokeWidth: '100%' },
        dataLabels: {
          name: { show: false },
          value: { 
            fontSize: "32px", 
            fontWeight: "1000", 
            offsetY: 10, 
            color: "#1C2434",
            formatter: (v:any) => `${v}%` 
          }
        }
      }
    },
    stroke: { lineCap: "round" }
  };

  return (
    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col items-center min-h-[340px] justify-between">
      <div className="text-center">
        <h3 className="text-[11px] font-[1000] text-[#1C2434] uppercase tracking-[0.2em] mb-1">État du stock</h3>
        <p className="text-[9px] font-bold text-gray-400 uppercase">Produits au-dessus du minimum</p>
      </div>

      <div className="relative w-full flex justify-center">
         <Chart options={options} series={[score]} type="radialBar" height={250} width="100%" />
      </div>

      <div className="w-full bg-[#F8FAFA] p-4 rounded-[25px] text-center border border-[#EDF2F2]">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Disponibilité</p>
        <p className="text-sm font-[1000] text-[#1C2434]">
          {healthy} <span className="text-gray-400 mx-1">/</span> {totalTypes} 
          <span className="ml-2 text-[10px] text-[#00A09D] bg-[#00A09D]/10 px-2 py-0.5 rounded-full uppercase">OK</span>
        </p>
      </div>
    </div>
  );
}