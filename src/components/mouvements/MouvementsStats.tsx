import { MouvementsPageStats } from "@/types/mouvement";
import { Layers, FileEdit, CheckCircle, ArrowLeftRight, Package, AlertTriangle } from "lucide-react";

export default function MouvementsStats({ stats }: { stats: MouvementsPageStats }) {
  const cards = [
    { label: "Total Flux", value: stats.total, icon: <Layers size={20} />, color: "text-[#1C2434]", bg: "bg-gray-100" },
    { label: "Brouillons", value: stats.brouillons, icon: <FileEdit size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Validés", value: stats.valides, icon: <CheckCircle size={20} />, color: "text-[#00A09D]", bg: "bg-[#00A09D]/10" },
    { label: "Transferts", value: stats.transferts, icon: <ArrowLeftRight size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Production", value: stats.sortiesProduction, icon: <Package size={20} />, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Pertes / Surplus", value: stats.pertes + stats.surplus, icon: <AlertTriangle size={20} />, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="group relative overflow-hidden rounded-[30px] border-2 border-gray-100 bg-white p-7 transition-all hover:border-[#00A09D]/30 hover:shadow-xl hover:shadow-[#00A09D]/5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-[1000] uppercase tracking-[0.2em] text-gray-400 group-hover:text-[#00A09D] transition-colors">
                {card.label}
              </p>
              <h4 className="mt-3 text-5xl font-[1000] tracking-tighter text-[#1C2434]">
                {card.value}
              </h4>
            </div>
            
            {/* Icône stylisée dans un cercle */}
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.bg} ${card.color} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
              {card.icon}
            </div>
          </div>

          {/* Barre de progression décorative subtile */}
          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-50">
            <div 
              className={`h-full rounded-full opacity-70 ${card.color.replace('text', 'bg')}`}
              style={{ width: stats.total > 0 ? `${(card.value / stats.total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}