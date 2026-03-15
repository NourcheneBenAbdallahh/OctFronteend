"use client";

import { ArrowDownToLine, ArrowUpFromLine, Boxes, CalendarDays } from "lucide-react";
import type { StocksStats as StocksStatsType } from "@/types/stock";

interface Props {
  stats: StocksStatsType;
}

const StatCard = ({
  title,
  value,
  sub,
  icon,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
    <div className="flex items-center justify-between">
      <span className="text-[12px] uppercase font-bold tracking-wide text-gray-500">
        {title}
      </span>
      <div className="w-9 h-9 rounded-sm bg-[#F2F7F7] border border-[#DDF2F1] flex items-center justify-center text-[#00A09D]">
        {icon}
      </div>
    </div>

    <div className="mt-4 text-[28px] font-bold text-gray-800">{value}</div>
    {sub ? <div className="text-[12px] text-gray-400 mt-1">{sub}</div> : null}

    <div className="mt-4 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className="h-full w-2/3 bg-[#00A09D]" />
    </div>
  </div>
);

export default function StocksStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total mouvements"
        value={String(stats.totalMouvements)}
        sub="Historique des écritures de stock"
        icon={<Boxes size={18} />}
      />
      <StatCard
        title="Entrées"
        value={stats.totalEntrees.toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })}
        sub="Volume des mouvements entrants"
        icon={<ArrowDownToLine size={18} />}
      />
      <StatCard
        title="Sorties"
        value={stats.totalSorties.toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })}
        sub="Volume des mouvements sortants"
        icon={<ArrowUpFromLine size={18} />}
      />
      <StatCard
        title="Aujourd’hui"
        value={String(stats.mouvementsToday)}
        sub="Mouvements enregistrés ce jour"
        icon={<CalendarDays size={18} />}
      />
    </div>
  );
}