"use client";

import React, { cloneElement } from "react";
import { PackageCheck, Boxes, CalendarDays, MessageSquareText } from "lucide-react";
import { LotsStats as LotsStatsType } from "@/types/lot";

interface Props {
  stats: LotsStatsType;
}

export default function LotsStats({ stats }: Props) {
  const cards = [
    {
      title: "Flux Global",
      value: String(stats.totalLots),
      sub: "Lots enregistrés",
      icon: <Boxes size={22} />,
      bg: "bg-[#F2F7F7]",
      text: "text-[#00A09D]",
      accent: "bg-[#00A09D]",
    },
    {
      title: "Volume Stock",
      value: stats.totalQuantite.toLocaleString(undefined, {
        maximumFractionDigits: 0,
      }),
      sub: "Unités cumulées",
      icon: <PackageCheck size={22} />,
      bg: "bg-blue-50",
      text: "text-blue-600",
      accent: "bg-blue-500",
    },
    {
      title: "Activité Jour",
      value: String(stats.lotsToday),
      sub: "Nouveaux lots",
      icon: <CalendarDays size={22} />,
      bg: "bg-orange-50",
      text: "text-orange-600",
      accent: "bg-orange-500",
    },
    {
      title: "Annotations",
      value: String(stats.commentedLots),
      sub: "Notes enrichies",
      icon: <MessageSquareText size={22} />,
      bg: "bg-purple-50",
      text: "text-purple-600",
      accent: "bg-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10 px-8 py-4 bg-[#F0F4F4]">
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
          <div className="flex flex-col relative z-10">
            <span className={`text-[42px] font-[1000] tracking-tighter leading-none ${card.text}`}>
              {card.value}
            </span>
            <span className="mt-4 text-[11px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${card.accent}`} />
              {card.sub}
            </span>
          </div>

<div className={`absolute -right-4 -bottom-4 opacity-[0.03] ${card.text} group-hover:opacity-[0.07] transition-opacity duration-500`}>
    {React.cloneElement(card.icon as React.ReactElement<{ size: number }>, { 
        size: 120 
    })}
</div>
        </div>
      ))}
    </div>
  );
}