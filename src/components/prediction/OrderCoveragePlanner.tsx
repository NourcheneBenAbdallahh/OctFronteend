"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Copy, Check } from "lucide-react";
import type { ForecastInsight } from "@/lib/prediction";
import { canManageCommandes } from "@/lib/access";
import { useAuthStore } from "@/store/useAuthStore";
import {
  COVERAGE_DAY_PRESETS,
  buildCommandeCreateUrl,
  buildLogisticsSuggestionText,
  computeCoverageQuantity,
} from "@/lib/prediction-order";

type Props = {
  emballageId: string;
  entrepotId?: string | null;
  productName: string;
  unitLabel: string;
  insight: ForecastInsight;
  safetyStock: number;
  onCopied?: () => void;
  onCopyError?: () => void;
};

export default function OrderCoveragePlanner({
  emballageId,
  entrepotId,
  productName,
  unitLabel,
  insight,
  safetyStock,
  onCopied,
  onCopyError,
}: Props) {
  const role = useAuthStore((s) => s.user?.role);
  const canOrder = canManageCommandes(role);
  const [coverageDays, setCoverageDays] = useState(14);
  const [copied, setCopied] = useState(false);

  const quantite = useMemo(
    () => computeCoverageQuantity(insight, safetyStock, coverageDays),
    [insight, safetyStock, coverageDays]
  );

  const commandeUrl = buildCommandeCreateUrl({
    emballageId,
    quantite,
    entrepotId,
    leadTimeDays: insight.lead_time_jours,
    coverageDays,
  });

  async function copySuggestion() {
    try {
      const text = buildLogisticsSuggestionText({
        productName,
        unitLabel,
        quantite,
        coverageDays,
        entrepotName: insight.entrepot_name,
      });
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopied?.();
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      onCopyError?.();
    }
  }

  return (
    <div className="mt-5 rounded-xl bg-white/95 border border-white p-5 shadow-sm space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
          Combien commander ?
        </p>
        <p className="mt-1 text-sm text-gray-700">
          Choisissez combien de jours de stock vous voulez couvrir. On calcule la quantité
          à commander pour vous.
        </p>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-800 mb-2">
          Je veux couvrir :
        </p>
        <div className="flex flex-wrap gap-2">
          {COVERAGE_DAY_PRESETS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setCoverageDays(days)}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                coverageDays === days
                  ? "bg-[#1C2434] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {days} jours
            </button>
          ))}
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          <span>Ou</span>
          <input
            type="number"
            min={1}
            max={365}
            value={coverageDays}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) setCoverageDays(Math.min(365, Math.max(1, v)));
            }}
            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-center font-semibold"
          />
          <span>jours</span>
        </label>
      </div>

      <div className="rounded-xl bg-[#F8FAFA] border border-gray-100 p-4">
        <p className="text-sm text-gray-600">Quantité suggérée pour {coverageDays} jours :</p>
        <p className="mt-1 text-2xl font-black text-gray-900">
          {quantite.toLocaleString("fr-FR")}{" "}
          <span className="text-base font-semibold text-gray-500">{unitLabel}</span>
        </p>
        {insight.commandes_en_cours > 0 && (
          <p className="mt-2 text-xs text-gray-500">
            Déjà commandé et en attente :{" "}
            {insight.commandes_en_cours.toLocaleString("fr-FR")} {unitLabel}
          </p>
        )}
        {quantite === 0 && (
          <p className="mt-2 text-sm text-emerald-700 font-medium">
            Votre stock actuel suffit déjà pour cette durée.
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {canOrder ? (
          <Link
            href={commandeUrl}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition ${
              quantite > 0
                ? "bg-[#1C2434] hover:bg-[#00A09D]"
                : "bg-gray-300 pointer-events-none"
            }`}
            aria-disabled={quantite <= 0}
          >
            <ShoppingCart size={18} />
            Lancer la commande
          </Link>
        ) : (
          <button
            type="button"
            onClick={copySuggestion}
            disabled={quantite <= 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1C2434] px-5 py-3 text-sm font-bold text-white hover:bg-[#00A09D] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? "Copié !" : "Copier pour la logistique"}
          </button>
        )}
      </div>

      {!canOrder && (
        <p className="text-xs text-gray-500">
          Vous ne pouvez pas créer la commande vous-même : copiez la suggestion et transmettez-la
          au service logistique.
        </p>
      )}
    </div>
  );
}
