"use client";

import { ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarDays } from "lucide-react";
import type { StocksStats as StocksStatsType } from "@/types/stock";

interface Props {
  stats: StocksStatsType;
}

const STAT_CARDS = [
  {
    id: "mouvements",
    label: "Mouvements",
    hint: "Total des enregistrements",
    icon: <Boxes className="h-6 w-6" />,
    iconClass: "bg-indigo-50 text-indigo-600",
    valueClass: "text-gray-900",
    idleClass: "border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40",
    getValue: (s: StocksStatsType) => String(s.totalMouvements),
  },
  {
    id: "entrees",
    label: "Entrées",
    hint: "Quantités entrées en stock",
    icon: <ArrowDownToLine className="h-6 w-6" />,
    iconClass: "bg-emerald-50 text-emerald-600",
    valueClass: "text-emerald-600",
    idleClass: "border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/40",
    getValue: (s: StocksStatsType) => s.totalEntrees.toLocaleString("fr-FR"),
  },
  {
    id: "sorties",
    label: "Sorties",
    hint: "Quantités sorties du stock",
    icon: <ArrowUpFromLine className="h-6 w-6" />,
    iconClass: "bg-orange-50 text-orange-600",
    valueClass: "text-orange-600",
    idleClass: "border-gray-100 hover:border-orange-200 hover:bg-orange-50/40",
    getValue: (s: StocksStatsType) => s.totalSorties.toLocaleString("fr-FR"),
  },
  {
    id: "today",
    label: "Aujourd'hui",
    hint: "Mouvements du jour",
    icon: <CalendarDays className="h-6 w-6" />,
    iconClass: "bg-sky-50 text-sky-600",
    valueClass: "text-gray-900",
    idleClass: "border-gray-100 hover:border-sky-200 hover:bg-sky-50/40",
    getValue: (s: StocksStatsType) => String(s.mouvementsToday),
  },
] as const;

export default function StocksStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {STAT_CARDS.map((card) => (
        <div
          key={card.id}
          className={`rounded-[2rem] border bg-white p-6 text-left shadow-sm transition-all ${card.idleClass}`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.iconClass}`}
            >
              {card.icon}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] font-black uppercase tracking-widest leading-none text-gray-400 mb-1">
                {card.label}
              </span>
              <span className={`text-2xl font-black leading-none ${card.valueClass}`}>
                {card.getValue(stats)}
              </span>
              <span className="mt-1.5 block text-[10px] font-bold uppercase leading-snug text-gray-400">
                {card.hint}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
