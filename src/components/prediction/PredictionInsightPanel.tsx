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
import { alertLevelLabel, alertLevelStyles, alertLevelActionHint } from "@/lib/prediction";
import OrderCoveragePlanner from "@/components/prediction/OrderCoveragePlanner";

type Props = {
  emballageId: string;
  entrepotId?: string | null;
  insight: ForecastInsight;
  productName: string;
  unitLabel: string;
  safetyStock: number;
  onCopied?: () => void;
  onCopyError?: () => void;
};

function autonomyBarColor(jours: number): string {
  if (jours < 7) return "bg-red-500";
  if (jours < 14) return "bg-orange-500";
  if (jours < 21) return "bg-amber-400";
  return "bg-[#00A09D]";
}

function autonomyBarWidth(jours: number): string {
  if (jours >= 999) return "100%";
  const pct = Math.min(100, Math.round((jours / 30) * 100));
  return `${Math.max(pct, 4)}%`;
}

export default function PredictionInsightPanel({
  emballageId,
  entrepotId,
  insight,
  productName,
  unitLabel,
  safetyStock,
  onCopied,
  onCopyError,
}: Props) {
  const styles = alertLevelStyles(insight.niveau_alerte);
  const Icon =
    insight.niveau_alerte === "CRITIQUE" || insight.niveau_alerte === "URGENT"
      ? AlertTriangle
      : insight.niveau_alerte === "ATTENTION"
        ? AlertTriangle
        : CheckCircle2;

  const joursLabel =
    insight.jours_avant_rupture >= 999
      ? "Plus d'un mois"
      : insight.jours_avant_rupture === 0
        ? "Aujourd'hui"
        : insight.jours_avant_rupture === 1
          ? "1 jour"
          : `${insight.jours_avant_rupture} jours`;

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
            <h2 className="mt-2 text-xl font-bold">
              {productName}
              {insight.entrepot_name ? (
                <span className="ml-2 text-base font-semibold text-gray-600">
                  — {insight.entrepot_name}
                </span>
              ) : null}
            </h2>
            <p className="mt-2 text-base leading-relaxed font-medium">
              {alertLevelActionHint(insight.niveau_alerte)}
            </p>
            <p className="mt-2 text-sm leading-relaxed opacity-90">{insight.message_agent}</p>
          </div>
        </div>
      </div>

      <OrderCoveragePlanner
        emballageId={emballageId}
        entrepotId={entrepotId}
        productName={productName}
        unitLabel={unitLabel}
        insight={insight}
        safetyStock={safetyStock}
        onCopied={onCopied}
        onCopyError={onCopyError}
      />

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-semibold">Temps restant avant rupture estimée</span>
          <span className="font-black">{joursLabel}</span>
        </div>
        <div className="h-3 rounded-full bg-white/60 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${autonomyBarColor(insight.jours_avant_rupture)}`}
            style={{ width: autonomyBarWidth(insight.jours_avant_rupture) }}
          />
        </div>
        <p className="mt-1 text-xs opacity-80">
          Estimation basée sur le stock disponible et la consommation prévue.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package size={18} />}
          label="En stock maintenant"
          value={`${insight.stock_actuel.toLocaleString("fr-FR")} ${unitLabel}`}
          hint={
            insight.min_stock > 0
              ? `Seuil d'alerte : ${insight.min_stock} ${unitLabel}`
              : undefined
          }
        />
        <StatCard
          icon={<TrendingDown size={18} />}
          label="Consommation par jour"
          value={`≈ ${insight.conso_moyenne_jour.toLocaleString("fr-FR")} ${unitLabel}`}
          hint="Quantité sortie chaque jour en moyenne"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Autonomie"
          value={joursLabel}
          hint="Durée avant épuisement du stock"
        />
        <StatCard
          icon={<ShoppingCart size={18} />}
          label="Suggestion rapide (7 j)"
          value={`${insight.quantite_a_commander.toLocaleString("fr-FR")} ${unitLabel}`}
          hint="Utilisez le calculateur ci-dessus pour une autre durée"
        />
      </div>

      <p className="mt-4 text-center">
        <Link
          href="/mouvements"
          className="text-sm font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Voir l'historique des sorties →
        </Link>
      </p>
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
