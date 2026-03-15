"use client";

import { Activity, AlertTriangle, Boxes, TrendingDown, TrendingUp } from "lucide-react";
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
      icon: <Activity size={18} />,
      color: "border-[#00A09D]",
      text: "text-[#00A09D]",
    },
    {
      title: "Lignes en écart",
      value: `${anomalies}`,
      sub: "À contrôler",
      icon: <AlertTriangle size={18} />,
      color: "border-orange-500",
      text: "text-orange-500",
    },
    {
      title: "Perte nette",
      value: `${totalNegative}`,
      sub: `${negative.length} lignes négatives`,
      icon: <TrendingDown size={18} />,
      color: "border-red-500",
      text: "text-red-500",
    },
    {
      title: "Surstock",
      value: `+${totalPositive}`,
      sub: `${positive.length} lignes positives`,
      icon: <TrendingUp size={18} />,
      color: "border-blue-500",
      text: "text-blue-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`bg-white p-4 border-l-4 ${card.color} shadow-sm rounded-sm border border-gray-200`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {card.title}
            </span>
            <div className={`${card.text}`}>{card.icon}</div>
          </div>

          <div className={`mt-3 text-3xl font-black ${card.text}`}>
            {card.value}
          </div>

          <div className="mt-1 text-[12px] text-gray-500">{card.sub}</div>
        </div>
      ))}
    </div>
  );
}