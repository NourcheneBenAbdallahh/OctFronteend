"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  ShoppingCart,
  Clock,
  TrendingDown,
} from "lucide-react";
import type { ForecastInsight } from "@/lib/prediction";
import { alertLevelLabel, alertLevelStyles } from "@/lib/prediction";

type Props = {
  insight: ForecastInsight;
  productName: string;
  unitLabel: string;
};

export default function PredictionInsightPanel({
  insight,
  productName,
  unitLabel,
}: Props) {
  const styles = alertLevelStyles(insight.niveau_alerte);
  const Icon =
    insight.niveau_alerte === "CRITIQUE"
      ? AlertTriangle
      : insight.niveau_alerte === "ATTENTION"
        ? AlertTriangle
        : CheckCircle2;

  const joursLabel =
    insight.jours_avant_rupture >= 999
      ? "Plus de 2 ans"
      : insight.jours_avant_rupture === 0
        ? "Aujourd'hui"
        : `${insight.jours_avant_rupture} jour${insight.jours_avant_rupture > 1 ? "s" : ""}`;

  return (
    <div className={`rounded-2xl border-2 p-6 ${styles.banner}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 max-w-2xl">
          <Icon className="shrink-0 mt-0.5" size={28} />
          <div>
            <span
              className={`inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${styles.badge}`}
            >
              {alertLevelLabel(insight.niveau_alerte)}
            </span>
            <h2 className="mt-2 text-lg font-bold">{productName}</h2>
            <p className="mt-2 text-base leading-relaxed">{insight.message_agent}</p>
          </div>
        </div>
        <Link
          href="/mouvements"
          className="text-sm font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Voir les mouvements de stock →
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={18} />}
          label="Stock actuel"
          value={`${insight.stock_actuel.toLocaleString("fr-FR")} ${unitLabel}`}
          hint={
            insight.min_stock > 0
              ? `Seuil minimum : ${insight.min_stock} ${unitLabel}`
              : undefined
          }
        />
        <StatCard
          icon={<TrendingDown size={18} />}
          label="Sorties par jour (estimé)"
          value={`${insight.conso_moyenne_jour.toLocaleString("fr-FR")} ${unitLabel}`}
          hint="Moyenne sur les 7 prochains jours"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Autonomie estimée"
          value={joursLabel}
          hint="Avant épuisement au rythme actuel"
        />
        <StatCard
          icon={<ShoppingCart size={18} />}
          label="Quantité à prévoir"
          value={`${insight.quantite_a_commander.toLocaleString("fr-FR")} ${unitLabel}`}
          hint="Suggestion pour 7 jours + marge de sécurité"
          highlight
        />
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl bg-white/80 p-4 border ${
        highlight ? "border-[#00A09D]/40 ring-1 ring-[#00A09D]/20" : "border-white/60"
      }`}
    >
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-black text-gray-900">{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}
