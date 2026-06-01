import React from "react";
import { Search, Eye, AlertOctagon, CalendarClock, Ban } from "lucide-react";
import type {
  ContratDashboardStats,
  ContratInsightFilter,
} from "@/lib/contratAnalytics";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onOpenNew: () => void;
  stats: ContratDashboardStats;
  insightFilter: ContratInsightFilter;
  onInsightFilterChange: (filter: ContratInsightFilter) => void;
}

const INSIGHT_CARDS: {
  id: ContratInsightFilter;
  label: string;
  hint: string;
  icon: React.ReactNode;
  count: (stats: ContratDashboardStats) => number;
  activeClass: string;
  idleClass: string;
}[] = [
  {
    id: "SURVEILLER",
    label: "À surveiller",
    hint: "Actifs ≥ 80 % ou dépassement",
    icon: <Eye className="h-6 w-6" />,
    count: (s) => s.aSurveiller,
    activeClass: "border-amber-400 bg-amber-50 ring-2 ring-amber-200 shadow-md",
    idleClass: "border-gray-100 hover:border-amber-200 hover:bg-amber-50/40",
  },
  {
    id: "DEPASSEMENT",
    label: "Dépassements",
    hint: "Volume réalisé > contractuel",
    icon: <AlertOctagon className="h-6 w-6" />,
    count: (s) => s.enDepassement,
    activeClass: "border-red-400 bg-red-50 ring-2 ring-red-200 shadow-md",
    idleClass: "border-gray-100 hover:border-red-200 hover:bg-red-50/40",
  },
  {
    id: "ECHEANCE_30",
    label: "Échéance 30 j",
    hint: "Actifs expirant sous 30 jours",
    icon: <CalendarClock className="h-6 w-6" />,
    count: (s) => s.echeanceProche,
    activeClass: "border-orange-400 bg-orange-50 ring-2 ring-orange-200 shadow-md",
    idleClass: "border-gray-100 hover:border-orange-200 hover:bg-orange-50/40",
  },
  {
    id: "INACTIFS",
    label: "Suspendus / expirés",
    hint: "Contrats hors exploitation",
    icon: <Ban className="h-6 w-6" />,
    count: (s) => s.inactifs,
    activeClass: "border-gray-500 bg-gray-100 ring-2 ring-gray-300 shadow-md",
    idleClass: "border-gray-100 hover:border-gray-300 hover:bg-gray-50",
  },
];

export const ContratHeader = ({
  query,
  setQuery,
  onOpenNew,
  stats,
  insightFilter,
  onInsightFilterChange,
}: Props) => (
  <div className="space-y-8 mb-8">
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
          Contrats
          <span className="text-[#00A09D]">.</span>
        </h1>
        <p className="mt-2 text-sm font-medium text-gray-500 max-w-xl">
          Cliquez sur une carte pour filtrer le tableau — {stats.total} contrat
          {stats.total > 1 ? "s" : ""} au total ({stats.actifs} actif
          {stats.actifs > 1 ? "s" : ""}).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {INSIGHT_CARDS.map((card) => {
          const isActive = insightFilter === card.id;
          const count = card.count(stats);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() =>
                onInsightFilterChange(isActive ? "" : card.id)
              }
              aria-pressed={isActive}
              className={`rounded-[2rem] border bg-white p-6 text-left shadow-sm transition-all ${isActive ? card.activeClass : card.idleClass}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    card.id === "SURVEILLER"
                      ? "bg-amber-50 text-amber-600"
                      : card.id === "DEPASSEMENT"
                        ? "bg-red-50 text-red-600"
                        : card.id === "ECHEANCE_30"
                          ? "bg-orange-50 text-orange-600"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {card.icon}
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] font-black uppercase tracking-widest leading-none text-gray-400 mb-1">
                    {card.label}
                  </span>
                  <span
                    className={`text-2xl font-black leading-none ${
                      count > 0 && card.id === "DEPASSEMENT"
                        ? "text-red-600"
                        : count > 0 && card.id === "SURVEILLER"
                          ? "text-amber-600"
                          : "text-gray-900"
                    }`}
                  >
                    {count}
                  </span>
                  <span className="mt-1.5 block text-[10px] font-bold uppercase leading-snug text-gray-400">
                    {isActive ? "Filtre actif · recliquer pour tout afficher" : card.hint}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>

    <div className="flex items-center gap-4">
      <div className="flex-1 flex items-center bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 focus-within:ring-2 ring-indigo-500/10 transition-all">
        <Search size={18} className="text-gray-300 mr-3" />
        <input
          className="flex-1 outline-none text-sm font-medium placeholder:text-gray-300"
          placeholder="N° contrat, fournisseur, emballage ou objet…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <button
        onClick={onOpenNew}
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
      >
        Nouveau contrat
      </button>
    </div>
  </div>
);
