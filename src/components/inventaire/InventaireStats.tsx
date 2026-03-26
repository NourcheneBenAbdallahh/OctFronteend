"use client";

import { Activity, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

export default function InventaireStats({ data }: { data: TableInventaire[] }) {
  const total = data.length;
  const exact = data.filter((i) => i.ecart === 0).length;
  const negative = data.filter((i) => i.ecart < 0);
  const positive = data.filter((i) => i.ecart > 0);

  const exactitude = total > 0 ? Math.round((exact / total) * 100) : 0;
  const totalNegative = negative.reduce((acc, curr) => acc + curr.ecart, 0);
  const totalPositive = positive.reduce((acc, curr) => acc + curr.ecart, 0);
  const anomalies = data.filter((i) => i.ecart !== 0).length;

  const cards = [
    {
      title: "Fiabilité Stock",
      value: `${exactitude}%`,
      sub: `${exact} lignes conformes`,
      icon: <Activity size={22} />,
      bg: "bg-[#F2F7F7]",
      text: "text-[#00A09D]",
      accent: "bg-[#00A09D]",
    },
    {
      title: "Lignes en écart",
      value: `${anomalies}`,
      sub: "À contrôler",
      icon: <AlertTriangle size={22} />,
      bg: "bg-orange-50",
      text: "text-orange-600",
      accent: "bg-orange-500",
    },
    {
      title: "Perte nette",
      value: `${totalNegative}`,
      sub: `${negative.length} lignes négatives`,
      icon: <TrendingDown size={22} />,
      bg: "bg-red-50",
      text: "text-red-600",
      accent: "bg-red-500",
    },
    {
      title: "Surstock",
      value: `+${totalPositive}`,
      sub: `${positive.length} lignes positives`,
      icon: <TrendingUp size={22} />,
      bg: "bg-blue-50",
      text: "text-blue-600",
      accent: "bg-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
      {cards.map((card) => (
        <div
          key={card.title}
          className="group relative bg-white p-8 rounded-[32px] border border-gray-100 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 overflow-hidden"
        >
          {/* Header de la Card */}
          <div className="flex items-start justify-between mb-6">
            <div className={`w-12 h-12 rounded-2xl ${card.bg} ${card.text} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-[1000] text-gray-300 uppercase tracking-[0.2em]">
              {card.title}
            </span>
          </div>

          {/* Valeur Massive */}
          <div className="flex flex-col">
            <span className={`text-[42px] font-[1000] tracking-tighter leading-none ${card.text}`}>
              {card.value}
            </span>
            <span className="mt-3 text-[11px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${card.accent}`} />
              {card.sub}
            </span>
          </div>

          {/* Décoration en fond */}
          <div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${card.text} group-hover:opacity-[0.07] transition-opacity`}>
             {cloneElement(card.icon, { size: 120 })}
          </div>
        </div>
      ))}
    </div>
  );
}

import { cloneElement } from "react";