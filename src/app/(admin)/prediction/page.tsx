"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  fetchStockForecast,
  PredictDemandResponse,
  alertLevelLabel,
} from "@/lib/prediction";
import StockForecastChart from "@/components/prediction/StockForecastChart";
import PredictionInsightPanel from "@/components/prediction/PredictionInsightPanel";
import { listEmballages } from "@/lib/emballages.api";
import jsPDF from "jspdf";
import { useAuthStore } from "@/store/useAuthStore";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { useAppFeedback } from "@/hooks/useAppFeedback";
import { HelpCircle, FileDown } from "lucide-react";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";

interface Emballage {
  id: string;
  name: string;
  capacity_unit: string | null;
}

export default function ForecastingPage() {
  const token = useAuthStore((state) => state.token);
  const [emballages, setEmballages] = useState<Emballage[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedEmballage, setSelectedEmballage] = useState<Emballage | null>(null);

  const [data, setData] = useState<PredictDemandResponse["predictDemand"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { feedback, showError: showActionError, clearFeedback } = useAppFeedback();

  const displayUnit = useMemo(() => {
    return selectedEmballage?.capacity_unit?.trim() || "unités";
  }, [selectedEmballage]);

  useEffect(() => {
    if (!token) return;

    async function init() {
      try {
        const response = await listEmballages(1, 100, { token });
        const listeBrute = response.emballages.data as Emballage[];
        setEmballages(listeBrute);
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
        const response = await fetchStockForecast(selectedId);
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
  }, [selectedId]);

  const exportToPDF = async () => {
    if (!data?.insight) return;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const ins = data.insight;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("OCT — Aide à la décision stock", 14, 20);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(`Produit : ${data.name}`, 14, 30);
      pdf.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, 14, 37);
      pdf.text(`État : ${alertLevelLabel(ins.niveau_alerte)}`, 14, 44);

      let y = 54;
      const lines = pdf.splitTextToSize(ins.message_agent, 180);
      pdf.text(lines, 14, y);
      y += lines.length * 6 + 8;

      pdf.text(`Stock actuel : ${ins.stock_actuel} ${displayUnit}`, 14, y);
      y += 7;
      pdf.text(`Autonomie estimée : ${ins.jours_avant_rupture} jours`, 14, y);
      y += 7;
      pdf.text(`Quantité suggérée à commander : ${ins.quantite_a_commander} ${displayUnit}`, 14, y);
      y += 7;
      pdf.text(`Marge de sécurité recommandée : ${data.metrics.safety_stock} ${displayUnit}`, 14, y);
      y += 12;

      pdf.setFont("helvetica", "bold");
      pdf.text("Prévisions des sorties (7 jours)", 14, y);
      y += 8;
      pdf.setFont("helvetica", "normal");
      data.predictions.forEach((p) => {
        pdf.text(`${p.date} : environ ${p.quantite_predite} ${displayUnit}`, 14, y);
        y += 6;
      });

      pdf.save(`Prevision_${data.name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      console.error(err);
      showActionError("Erreur lors de la génération du PDF.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="mx-auto mt-8 max-w-7xl space-y-6">
        <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Prévisions de consommation
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Estimez combien de temps votre stock tiendra et combien commander.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor="product-select">
                Choisir un produit
              </label>
              <select
                id="product-select"
                value={selectedId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedId(id);
                  setSelectedEmballage(emballages.find((item) => item.id === id) ?? null);
                }}
                className="min-w-[240px] rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#00A09D]"
              >
                {emballages.map((emb) => (
                  <option key={emb.id} value={emb.id}>
                    {emb.name}
                  </option>
                ))}
              </select>

              {data && (
                <button
                  type="button"
                  onClick={exportToPDF}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1C2434] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00A09D]"
                >
                  <FileDown size={16} />
                  Télécharger le résumé
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-blue-900">
          <HelpCircle className="shrink-0" size={20} />
          <div>
            <p className="font-semibold">Comment lire cette page ?</p>
            <p className="mt-1 text-blue-800/90">
              Nous analysons uniquement les <strong>sorties validées</strong> (production,
              pertes) enregistrées dans « Mouvements de stock ». Le bandeau coloré vous dit
              quoi faire. Le graphique montre le passé (bleu) et les 7 prochains jours
              (orange).
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-20 shadow-sm">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00A09D]/30 border-t-[#00A09D]" />
            <p className="mt-4 font-semibold text-gray-700">
              Calcul de la prévision en cours…
            </p>
            <p className="text-sm text-gray-500">Cela peut prendre jusqu’à une minute.</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-red-100 bg-white p-8 text-center shadow-sm">
            <span className="mb-3 block text-4xl">📋</span>
            <h3 className="text-lg font-bold text-red-700">Analyse non disponible</h3>
            <p className="mx-auto mt-2 max-w-lg text-gray-600">{error}</p>
          </div>
        )}

        {!loading && data?.insight && (
          <div id="report-content" className="space-y-6">
            <PredictionInsightPanel
              insight={data.insight}
              productName={data.name}
              unitLabel={displayUnit}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <MetricHelp
                title="Marge de sécurité"
                value={`${data.metrics.safety_stock} ${displayUnit}`}
                explanation="Quantité supplémentaire à garder pour absorber les imprévus."
              />
              <MetricHelp
                title="Variabilité des sorties"
                value={String(data.metrics.volatility_sigma)}
                explanation="Plus le chiffre est élevé, plus les sorties varient d’un jour à l’autre."
              />
              <MetricHelp
                title="Fiabilité du calcul"
                value={data.metrics.confidence_level}
                explanation={`Basé sur ${data.insight.history_days} jours de sorties enregistrées.`}
              />
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <h3 className="mb-4 text-lg font-bold text-gray-900">
                Évolution des sorties — {data.name}
              </h3>
              <StockForecastChart
                history={data.history ?? []}
                predictions={data.predictions}
                unitLabel={displayUnit}
              />
            </div>

            <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 bg-gray-50/80 px-6 py-4">
                <h3 className="font-bold text-gray-800">
                  Détail jour par jour (7 prochains jours)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Fourchette = scénario prudent (bas) et optimiste (haut).
                </p>
              </div>
              <ResponsiveTableWrap showScrollHint={data.predictions.length > 0}>
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-bold uppercase text-gray-400">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Sorties prévues</th>
                    <th className="px-6 py-4 text-center">Fourchette possible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.predictions.map((p, idx) => (
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
                        entre {p.borne_basse} et {p.borne_haute} {displayUnit}
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
