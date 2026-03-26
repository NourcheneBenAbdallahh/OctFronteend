import { MouvementsPageStats } from "@/types/mouvement";

export default function MouvementsStats({ stats }: { stats: MouvementsPageStats }) {
  const cards = [
    { label: "Total", value: stats.total, tone: "from-slate-900 to-slate-700" },
    { label: "Brouillons", value: stats.brouillons, tone: "from-amber-500 to-orange-500" },
    { label: "Validés", value: stats.valides, tone: "from-emerald-500 to-green-500" },
    { label: "Transferts", value: stats.transferts, tone: "from-blue-500 to-indigo-500" },
    { label: "Production", value: stats.sortiesProduction, tone: "from-cyan-500 to-teal-500" },
    { label: "Pertes / Surplus", value: stats.pertes + stats.surplus, tone: "from-rose-500 to-fuchsia-500" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.tone}`} />
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
            {card.label}
          </div>
          <div className="mt-4 text-4xl font-black tracking-tight text-gray-950">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}