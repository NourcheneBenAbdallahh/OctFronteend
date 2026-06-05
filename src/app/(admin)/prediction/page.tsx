"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchStockForecast,
  PredictDemandResponse,
  modelTypeLabel,
  reliabilityPlainLabel,
} from "@/lib/prediction";
import StockForecastChart from "@/components/prediction/StockForecastChart";
import PredictionInsightPanel from "@/components/prediction/PredictionInsightPanel";
import { listEmballages } from "@/lib/emballages.api";
import { fetchEntrepots, type Entrepot } from "@/lib/entrepot.api";
import { exportPredictionPdf } from "@/lib/prediction.pdf";
import { useAuthStore } from "@/store/useAuthStore";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { useAppFeedback } from "@/hooks/useAppFeedback";
import { HelpCircle, FileDown, Info, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import type { PredictionPoint } from "@/lib/prediction";

interface Emballage {
  id: string;
  name: string;
  capacity_unit: string | null;
}

const PREDICTION_SORT_COLUMNS: Record<string, SortColumn<PredictionPoint>> = {
  date: { accessor: (p) => p.date, type: "date" },
  quantite: { accessor: (p) => p.quantite_predite, type: "number" },
  borne: { accessor: (p) => p.borne_basse, type: "number" },
};

export default function ForecastingPage() {
  const token = useAuthStore((state) => state.token);
  const [emballages, setEmballages] = useState<Emballage[]>([]);
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedEntrepotId, setSelectedEntrepotId] = useState<string>("");
  const [selectedEmballage, setSelectedEmballage] = useState<Emballage | null>(null);

  const [data, setData] = useState<PredictDemandResponse["predictDemand"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { feedback, showError: showActionError, showSuccess, clearFeedback } = useAppFeedback();

  const displayUnit = useMemo(() => {
    return selectedEmballage?.capacity_unit?.trim() || "unités";
  }, [selectedEmballage]);

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(PREDICTION_SORT_COLUMNS);
  const sortedPredictions = useMemo(
    () => (data?.predictions ? sortRows(data.predictions) : []),
    [data?.predictions, sortRows]
  );

  useEffect(() => {
    if (!token) return;

    async function init() {
      try {
        const [embResponse, entrepotList] = await Promise.all([
          listEmballages(1, 100, { token }),
          fetchEntrepots({ token }).catch(() => [] as Entrepot[]),
        ]);
        const listeBrute = embResponse.emballages.data as Emballage[];
        setEmballages(listeBrute);
        setEntrepots(entrepotList);
        if (listeBrute.length > 0) {
          setSelectedId(listeBrute[0].id);
          setSelectedEmballage(listeBrute[0]);
        }
      } catch (err: unknown) {
        console.error(err);
        setError("Impossible de charger la liste des produits.");
      }
    }

    init();
  }, [token]);

  useEffect(() => {
    if (!selectedId) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchStockForecast(
          selectedId,
          selectedEntrepotId || null
        );
        setData(response.predictDemand);
      } catch (err: unknown) {
        console.error(err);
        const msg =
          err instanceof Error ? err.message : "Erreur lors du chargement de la prévision.";
        if (
          /mouvement|mouvements|sorties|historique|pas assez/i.test(msg)
        ) {
          setError(msg);
        } else if (/indisponible|500|internal server/i.test(msg)) {
          setError("Le service d'analyse est temporairement indisponible.");
        } else {
          setError(msg);
        }
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedId, selectedEntrepotId]);

  const exportToPDF = async () => {
    if (!data?.insight) return;

    try {
      const entrepotLabel =
        data.entrepot_name ??
        (selectedEntrepotId
          ? entrepots.find((e) => String(e.id) === selectedEntrepotId)?.nom ?? null
          : null);

      await exportPredictionPdf({
        productName: data.name,
        unitLabel: displayUnit,
        entrepotLabel,
        insight: data.insight,
        metrics: data.metrics,
        predictions: sortedPredictions,
      });
      showSuccess("PDF téléchargé.");
    } catch (err) {
      console.error(err);
      showActionError("Erreur lors de la génération du PDF.");
    }
  };

  return (
      <div className="mx-auto mt-8 max-w-7xl space-y-6">
        <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                Faut-il commander ?
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                On vous dit combien de stock il reste, combien de temps ça tiendra, et
                combien commander si besoin.
              </p>
            </div>

            <div
              className={`grid w-full shrink-0 gap-3 sm:items-center ${
                entrepots.length > 0
                  ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
                  : "sm:grid-cols-[minmax(0,1fr)_auto]"
              } lg:w-auto lg:min-w-[min(100%,52rem)]`}
            >
              <label className="sr-only" htmlFor="product-select">
                Choisir un produit
              </label>
              <select
                id="product-select"
                aria-label="Choisir un produit"
                value={selectedId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedId(id);
                  setSelectedEmballage(emballages.find((item) => item.id === id) ?? null);
                }}
                className="min-w-0 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00A09D]"
              >
                {emballages.map((emb) => (
                  <option key={emb.id} value={emb.id}>
                    {emb.name}
                  </option>
                ))}
              </select>

              {entrepots.length > 0 && (
                <>
                  <label className="sr-only" htmlFor="entrepot-select">
                    Filtrer par entrepôt
                  </label>
                  <select
                    id="entrepot-select"
                    value={selectedEntrepotId}
                    onChange={(e) => setSelectedEntrepotId(e.target.value)}
                    className="min-w-0 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00A09D]"
                  >
                    <option value="">Tous les entrepôts</option>
                    {entrepots.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.nom}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <button
                type="button"
                onClick={exportToPDF}
                disabled={!data?.insight}
                className="inline-flex h-[46px] w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#1C2434] px-5 text-sm font-bold text-white transition hover:bg-[#00A09D] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              >
                <FileDown size={16} />
                Télécharger le récapitulatif
              </button>
            </div>
          </div>
        </div>

        <details className="group rounded-xl border border-blue-100 bg-blue-50/80">
          <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm text-blue-900 [&::-webkit-details-marker]:hidden">
            <HelpCircle className="shrink-0" size={20} />
            <span className="font-semibold flex-1">Comment lire cette page ?</span>
            <ChevronDown
              size={18}
              className="shrink-0 transition group-open:rotate-180"
            />
          </summary>
          <div className="border-t border-blue-100 px-4 pb-4 pt-2 text-sm text-blue-800/90 space-y-2">
            <p>
              <strong>1.</strong> Choisissez un produit (et un entrepôt si besoin).
            </p>
            <p>
              <strong>2.</strong> Lisez le bandeau coloré : il vous dit s&apos;il faut agir
              ou non.
            </p>
            <p>
              <strong>3.</strong> Regardez « En stock maintenant » et « Autonomie » pour
              savoir combien de temps il vous reste.
            </p>
            <p>
              <strong>4.</strong> Si une commande est conseillée, le bouton « Aller aux
              commandes » vous y emmène directement.
            </p>
            <p className="text-xs text-blue-700/80">
              Les chiffres viennent des sorties enregistrées dans « Mouvements de stock
              » (production et pertes).
            </p>
          </div>
        </details>

        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00A09D]/30 border-t-[#00A09D]" />
            <p className="mt-4 font-semibold text-gray-700">
              Calcul en cours…
            </p>
            <p className="text-sm text-gray-500">Patientez quelques instants.</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-red-100 bg-white p-8 text-center shadow-sm">
            <span className="mb-3 block text-4xl">📋</span>
            <h3 className="text-lg font-bold text-red-700">Pas assez de données</h3>
            <p className="mx-auto mt-2 max-w-lg text-gray-600">{error}</p>
            <Link
              href="/mouvements"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#00A09D] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Enregistrer des sorties de stock
            </Link>
          </div>
        )}

        {!loading && data?.insight && (
          <div id="report-content" className="space-y-6">
            <PredictionInsightPanel
              emballageId={selectedId}
              entrepotId={selectedEntrepotId || null}
              insight={data.insight}
              productName={data.name}
              unitLabel={displayUnit}
              safetyStock={data.metrics.safety_stock}
              onCopied={() => showSuccess("Suggestion copiée — transmettez-la à la logistique.")}
              onCopyError={() => showActionError("Impossible de copier la suggestion.")}
            />

            <details className="rounded-2xl border border-gray-100 bg-white shadow-sm">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-gray-600 hover:text-gray-900 [&::-webkit-details-marker]:hidden">
                + Détails du calcul (optionnel)
              </summary>
              <div className="border-t border-gray-100 p-5 pt-0">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  <MetricHelp
                    title="Méthode de calcul"
                    value={modelTypeLabel(data.metrics.model_type)}
                    explanation={data.metrics.method ?? "Calcul automatique à partir des sorties passées."}
                  />
                  <MetricHelp
                    title="Qualité de l'estimation"
                    value={reliabilityPlainLabel(data.metrics.reliability_score)}
                    explanation={
                      data.metrics.reliability_score != null
                        ? `Score interne : ${Math.round(data.metrics.reliability_score)} %`
                        : "Basé sur les sorties enregistrées."
                    }
                  />
                  <MetricHelp
                    title="Réserve de sécurité"
                    value={`${data.metrics.safety_stock} ${displayUnit}`}
                    explanation="Marge gardée pour les imprévus."
                  />
                  <MetricHelp
                    title="Historique utilisé"
                    value={`${data.insight.history_days} jours`}
                    explanation="Nombre de jours de sorties analysés."
                  />
                </div>
              </div>
            </details>

            {data.metrics.cap_applied && (
              <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
                <Info className="shrink-0 mt-0.5" size={18} />
                <p>
                  L&apos;estimation a été ajustée pour rester proche de la consommation
                  réelle récente (environ {data.metrics.cap_value} {displayUnit} par jour).
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Sorties passées et estimées — {data.name}
              </h3>

              {data.metrics.yearly_seasonality && (
                <div className="mb-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
                  <Info className="mt-0.5 shrink-0" size={18} />
                  <p>
                    Nous avons plus d&apos;un an de données : l&apos;estimation tient compte
                    des variations selon la période de l&apos;année. En cas de doute, fiez-vous
                    surtout aux chiffres des dernières semaines (ligne bleue).
                  </p>
                </div>
              )}

              <StockForecastChart
                history={data.history ?? []}
                predictions={data.predictions}
                unitLabel={displayUnit}
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <h3 className="font-bold text-gray-800">
                  Semaine à venir — jour par jour
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Estimation de ce qui sortira chaque jour. La fourchette indique le minimum
                  et le maximum possibles.
                </p>
              </div>
              <ResponsiveTableWrap showScrollHint={sortedPredictions.length > 0}>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase text-gray-400">
                    <SortableTh columnKey="date" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4">Jour</SortableTh>
                    <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4">Sorties estimées</SortableTh>
                    <SortableTh columnKey="borne" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4" align="center">Entre… et…</SortableTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedPredictions.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-700">
                        {new Date(p.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ≈ {p.quantite_predite.toLocaleString("fr-FR")} {displayUnit}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-500">
                        de {p.borne_basse} à {p.borne_haute} {displayUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </ResponsiveTableWrap>
            </div>
          </div>
        )}
      </div>
  );
}

function MetricHelp({
  title,
  value,
  explanation,
}: {
  title: string;
  value: string;
  explanation: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-gray-900">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{explanation}</p>
    </div>
  );
}
