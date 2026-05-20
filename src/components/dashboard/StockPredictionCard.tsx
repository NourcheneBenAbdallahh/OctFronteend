"use client";
import React, { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { Stock } from "@/types/stock";
import Link from "next/link";
import {
  formatUnitCodeShort,
  resolvePrincipalUnitCode,
} from "@/lib/unite-conversion";
import type { UniteMesure } from "@/types/unite-mesure";

interface Props {
  stocks: Stock[];
  variant?: "small" | "large";
  /** Référentiel unités (optionnel) pour libellés ; sinon affichage du code unité. */
  unitesMesure?: UniteMesure[];
}

type ProductAgg = {
  name: string;
  unitCode: string;
  current: number;
  consumption30d: number;
};

/** Solde stock affiché : jamais négatif (les sorties ne peuvent pas dépasser le disponible). */
function stockBalance(raw: number): number {
  return Math.max(0, raw);
}

function unitDisplay(
  code: string,
  unitesMesure: UniteMesure[] | undefined
): string {
  const normalized = formatUnitCodeShort(code);
  if (normalized === "—") return normalized;
  const row = unitesMesure?.find(
    (u) => formatUnitCodeShort(u.code) === normalized
  );
  return row ? formatUnitCodeShort(row.code) : normalized;
}

export default function StockPredictionCard({
  stocks,
  variant = "small",
  unitesMesure,
}: Props) {
  const productAnalysis = useMemo(() => {
    return stocks.reduce((acc: Record<string, ProductAgg>, s) => {
      const emb = s.emballage;
      const key = String(s.emballage_id ?? emb?.id ?? emb?.name ?? "unknown");
      const name = emb?.name || "Inconnu";
      const unitCode = resolvePrincipalUnitCode(
        emb?.capacity_unit,
        unitesMesure ?? []
      );

      if (!acc[key]) {
        acc[key] = { name, unitCode, current: 0, consumption30d: 0 };
      }

      const val = Number(s.quantite);
      if (s.sens === "entree") {
        acc[key].current += val;
      } else {
        const sortie = Math.min(val, acc[key].current);
        acc[key].current -= sortie;
        const isRecent =
          new Date().getTime() - new Date(s.date_stock).getTime() <
          30 * 24 * 60 * 60 * 1000;
        if (isRecent) acc[key].consumption30d += sortie;
      }
      acc[key].current = stockBalance(acc[key].current);
      return acc;
    }, {});
  }, [stocks, unitesMesure]);

  const predictions = useMemo(() => {
    return Object.values(productAnalysis)
      .map((data) => {
        const current = stockBalance(data.current);
        const dailyConso = data.consumption30d / 30;
        const daysLeft =
          dailyConso > 0
            ? current === 0
              ? 0
              : Math.max(0, Math.round(current / dailyConso))
            : 999;
        return {
          name: data.name,
          unitCode: data.unitCode,
          daysLeft,
          current,
          dailyConso,
        };
      })
      .filter((p) => p.dailyConso > 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  }, [productAnalysis]);

  const totalProducts = Object.keys(productAnalysis).length;
  const remainingCount = Math.max(0, totalProducts - predictions.length);

  return (
    <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
      {predictions.map((p, i) => {
        const isCritical = p.daysLeft < 7;
        const unit = unitDisplay(p.unitCode, unitesMesure);

        return (
          <div
            key={`${p.name}-${p.unitCode}-${i}`}
            className={`relative flex min-h-[220px] flex-col justify-between rounded-[35px] border-2 p-6 transition-all ${
              isCritical
                ? "border-red-200 bg-red-50 shadow-sm"
                : "border-gray-100 bg-white shadow-sm hover:border-[#00A09D]/30"
            }`}
          >
            <div
              className={`absolute right-0 top-0 rounded-bl-2xl px-4 py-1.5 text-[9px] font-[1000] uppercase tracking-wider ${
                isCritical ? "bg-red-500 text-white" : "bg-[#00A09D] text-white"
              }`}
            >
              {p.daysLeft > 90
                ? "+90 JOURS"
                : p.daysLeft === 0
                  ? "RUPTURE"
                  : `J-${p.daysLeft} AVANT RUPTURE`}
            </div>

            <div className="mt-2">
              <h4 className="mb-1 truncate pr-10 text-[13px] font-[1000] uppercase text-[#1C2434]">
                {p.name}
              </h4>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                Analyse Prédictive
              </p>
            </div>

            <div className="my-6 flex items-center justify-between">
              <div>
                <p className="mb-1 text-[8px] font-black uppercase leading-none text-gray-400">
                  Stock Actuel
                </p>
                <p className="text-xl font-[1000] tracking-tighter text-[#1C2434]">
                  {p.current.toLocaleString()}{" "}
                  <span className="text-[10px] text-gray-400">{unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="mb-1 text-[8px] font-black uppercase leading-none text-gray-400">
                  Vitesse Sortie
                </p>
                <p
                  className={`text-xl font-[1000] tracking-tighter ${isCritical ? "text-red-600" : "text-[#00A09D]"}`}
                >
                  {Math.round(p.dailyConso)}{" "}
                  <span className="text-[10px] text-gray-400">
                    {unit}/j
                  </span>
                </p>
              </div>
            </div>

            <div
              className={`flex items-center justify-between rounded-2xl p-3 ${
                isCritical ? "bg-red-100/50" : "bg-[#F8FAFA]"
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp
                  size={14}
                  className={isCritical ? "text-red-500" : "text-[#00A09D]"}
                />
                <span className="text-[9px] font-black uppercase text-gray-500">
                  Qte suggérée
                </span>
              </div>
              <span className="text-xs font-[1000] text-[#1C2434]">
                +{Math.round(p.dailyConso * 60).toLocaleString()}{" "}
                <span className="text-[8px]">{unit}</span>
              </span>
            </div>
          </div>
        );
      })}

      <div className="col-span-full mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-100"
              >
                <div className="flex h-full w-full items-center justify-center bg-[#00A09D]/10 text-[8px] font-black text-[#00A09D]">
                  PKG
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span className="font-black text-[#1C2434]">
              +{remainingCount} autres emballages
            </span>{" "}
            surveillés en temps réel
          </p>
        </div>

        <Link href="/stock">
          <button
            type="button"
            className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-2.5 shadow-sm transition-all hover:border-[#00A09D] hover:text-[#00A09D]"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">
              Rapport complet
            </span>
            <TrendingUp
              size={14}
              className="transition-transform group-hover:translate-y-[-2px]"
            />
          </button>
        </Link>
      </div>
    </div>
  );
}
