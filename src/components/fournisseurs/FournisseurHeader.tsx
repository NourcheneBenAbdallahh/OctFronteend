import {
  Search,
  Plus,
  Building2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { tourPageAttrs } from "@/lib/tourPageAttrs";

const tour = tourPageAttrs("/fournisseurs");

export type FournisseurStats = {
  total: number;
  actifs: number;
  inactifs: number;
};

type StatusFilter = "" | "ACTIF" | "INACTIF";

interface Props {
  query: string;
  setQuery: (q: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (s: StatusFilter) => void;
  stats: FournisseurStats;
  onOpenNew: () => void;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="flex min-w-[150px] items-center gap-4 rounded-[2rem] border border-gray-50 bg-white p-4 shadow-sm">
    <div
      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}
    >
      <Icon size={18} />
    </div>
    <div>
      <span className="mb-1 block text-[9px] font-black uppercase leading-none tracking-widest text-gray-400">
        {label}
      </span>
      <span className="text-xl font-black leading-none text-gray-900">
        {value}
      </span>
    </div>
  </div>
);

export const FournisseurHeader = ({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  stats,
  onOpenNew,
}: Props) => (
  <div className="mb-8 space-y-8">
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
          <div className="h-[2px] w-8 bg-[#00A09D]" />
          Gestion Achats
        </div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">
          Fournisseurs <span className="text-[#00A09D]">.</span>
        </h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatCard
          icon={Building2}
          label="Total"
          value={stats.total}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={CheckCircle2}
          label="Actifs"
          value={stats.actifs}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={XCircle}
          label="Inactifs"
          value={stats.inactifs}
          color="bg-rose-50 text-rose-600"
        />
      </div>
    </div>

    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
      <div className="relative flex-1 group">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-[#00A09D]"
          size={16}
        />
        <input
          {...tour.search}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un partenaire, matricule fiscal…"
          className="w-full rounded-2xl border border-gray-100 bg-white py-4 pl-12 pr-6 text-sm font-medium shadow-sm transition-all placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-[#00A09D]/5"
        />
      </div>

      <button
        type="button"
        {...tour.actions}
        onClick={onOpenNew}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-gray-900 bg-white px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-[8px_8px_0px_rgba(0,160,157,0.2)] transition-all hover:bg-gray-900 hover:text-white"
      >
        <Plus size={18} strokeWidth={3} />
        Nouveau
      </button>
    </div>

    <div className="flex flex-wrap gap-3">
      {(
        [
          { id: "" as const, label: "Tous" },
          { id: "ACTIF" as const, label: "Actifs" },
          { id: "INACTIF" as const, label: "Inactifs" },
        ] as const
      ).map(({ id, label }) => {
        const isActive = statusFilter === id;
        const count =
          id === ""
            ? stats.total
            : id === "ACTIF"
              ? stats.actifs
              : stats.inactifs;
        return (
          <button
            key={id || "all"}
            type="button"
            onClick={() => setStatusFilter(id)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition-all ${
              isActive
                ? id === "INACTIF"
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                  : id === "ACTIF"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-gray-900 text-white shadow-[4px_4px_0px_rgba(0,160,157,0.2)]"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  </div>
);
