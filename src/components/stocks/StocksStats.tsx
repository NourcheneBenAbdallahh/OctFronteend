"use client";

import { ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarDays } from "lucide-react";
import type { StocksStats as StocksStatsType } from "@/types/stock";

interface Props {
  stats: StocksStatsType;
}

const StatCard = ({
  title,
  value,
  icon,
  colorClass,
  iconBg,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  colorClass: string;
  iconBg: string;
}) => (
  /* Style Pilule : rounded-2xl, border léger, padding ajusté */
  <div className="bg-white border border-gray-100 rounded-2xl p-3 pr-8 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
    {/* Cercle d'icône parfait à gauche */}
    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg} ${colorClass}`}>
      {icon}
    </div>
    
    <div className="flex flex-col">
      {/* Label en haut : petit, noir, uppercase, espacé */}
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {title}
      </span>
      {/* Valeur : Grande, noire, grasse */}
      <span className="text-2xl font-black text-[#1C2434]">
        {value}
      </span>
    </div>
  </div>
);

export default function StocksStats({ stats }: Props) {
  return (
    /* Flexbox au lieu de Grid pour un alignement plus naturel comme sur ta capture */
    <div className="flex flex-wrap items-center gap-4 mb-8">
      <StatCard
        title="Mouvements"
        value={String(stats.totalMouvements)}
        icon={<Boxes size={22} />}
        colorClass="text-indigo-600"
        iconBg="bg-indigo-50"
      />
      
      <StatCard
        title="Entrées"
        value={stats.totalEntrees.toLocaleString("fr-FR")}
        icon={<ArrowDownToLine size={22} />}
        colorClass="text-emerald-600"
        iconBg="bg-emerald-50"
      />

      <StatCard
        title="Sorties"
        value={stats.totalSorties.toLocaleString("fr-FR")}
        icon={<ArrowUpFromLine size={22} />}
        colorClass="text-orange-600"
        iconBg="bg-orange-50"
      />

      <StatCard
        title="Aujourd'hui"
        value={String(stats.mouvementsToday)}
        icon={<CalendarDays size={22} />}
        colorClass="text-sky-600"
        iconBg="bg-sky-50"
      />
    </div>
  );
}