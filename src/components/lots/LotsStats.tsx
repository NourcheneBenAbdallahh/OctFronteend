"use client";

import { PackageCheck, Boxes, CalendarDays, MessageSquareText } from "lucide-react";
import { LotsStats as LotsStatsType } from "@/types/lot";

interface Props {
  stats: LotsStatsType;
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

export default function LotsStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Lots"
        value={String(stats.totalLots)}
        sub="Nombre total de lots enregistrés"
        icon={<Boxes size={18} />}
      />
      <StatCard
        title="Quantité Totale"
        value={stats.totalQuantite.toLocaleString(undefined, {
          maximumFractionDigits: 2,
        })}
        sub="Somme des quantités des lots"
        icon={<PackageCheck size={18} />}
      />
      <StatCard
        title="Lots Aujourd’hui"
        value={String(stats.lotsToday)}
        sub="Créés sur la journée"
        icon={<CalendarDays size={18} />}
      />
      <StatCard
        title="Avec Commentaire"
        value={String(stats.commentedLots)}
        sub="Lots enrichis par une note"
        icon={<MessageSquareText size={18} />}
      />
    </div>
  );
}