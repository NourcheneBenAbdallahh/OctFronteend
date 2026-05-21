"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchStockForecast, PredictDemandResponse } from "@/lib/prediction";
import StockForecastChart from "@/components/prediction/StockForecastChart";
import { listEmballages } from "@/lib/emballages.api";
import jsPDF from "jspdf";
import { useAuthStore } from "@/store/useAuthStore";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { useAppFeedback } from "@/hooks/useAppFeedback";

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

  // ===== Unité affichable =====
  const displayUnit = useMemo(() => {
    return selectedEmballage?.capacity_unit?.trim() || "unités";
  }, [selectedEmballage]);

  // ===== Chargement des emballages =====
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
      } catch (err: any) {
        console.error(err);
        setError("Impossible de charger la liste des produits.");
      }
    }

    init();
  }, [token]);

  // ===== Chargement des prédictions =====
  useEffect(() => {
    if (!selectedId) return;

    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchStockForecast(selectedId);
        setData(response.predictDemand);
      } catch (err: any) {
        console.error(err);

        if (err.message?.includes("Pas assez de données")) {
          setError("Historique insuffisant pour ce produit. L'IA a besoin de plus de mouvements.");
        } else {
          setError("Le service d'analyse est temporairement indisponible.");
        }

        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedId]);

  // ===== Export PDF =====
  const exportToPDF = async () => {
    if (!data) return;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // ===== Charger logo =====
      const loadImageAsBase64 = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.crossOrigin = "anonymous";

          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) return reject("Canvas introuvable");

            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          };

          img.onerror = reject;
        });
      };

      let logoBase64 = "";
      try {
        logoBase64 = await loadImageAsBase64("/images/logo/logoOCT.png");
      } catch (e) {
        console.warn("Logo non chargé");
      }

      // ===== HEADER PREMIUM =====
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, 34, "F");

      // Accent bleu vertical à gauche
      pdf.setFillColor(30, 64, 175);
      pdf.rect(0, 0, 6, 34, "F");

      // Ligne fine
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.5);
      pdf.line(10, 31, pageWidth - 10, 31);

      // Logo
      if (logoBase64) {
        pdf.addImage(logoBase64, "PNG", 12, 7, 18, 18);
      }

      // Titre header
      pdf.setTextColor(15, 23, 42);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(15);
      pdf.text("OFFICE DU COMMERCE DE LA TUNISIE", 35, 14);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(71, 85, 105);
      pdf.text("Rapport d’Analyse Prédictive des Stocks", 35, 21);

      pdf.setFontSize(9);
      pdf.setTextColor(148, 163, 184);
      pdf.text("Système d’aide à la décision stratégique", 35, 27);

      // ===== INFOS GÉNÉRALES =====
      let y = 42;

      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.text("Informations générales", 14, y);

      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.text(`Produit analysé : ${data.name}`, 14, y);

      y += 7;
      pdf.text(`Date d'extraction : ${new Date().toLocaleDateString("fr-FR")}`, 14, y);

      y += 7;
      pdf.text(`Niveau de confiance : ${data.metrics.confidence_level}`, 14, y);

      y += 7;
      pdf.text(`Unité de mesure : ${displayUnit}`, 14, y);

      // ===== KPI BOXES =====
      y += 12;

      const drawBox = (x: number, title: string, value: string) => {
        pdf.setDrawColor(220, 220, 220);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, 55, 22, 3, 3, "FD");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.setTextColor(100, 116, 139);
        pdf.text(title, x + 4, y + 7);

        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text(value, x + 4, y + 16);
      };

      drawBox(14, "Stock de sécurité", `${data.metrics.safety_stock} ${displayUnit}`);
      drawBox(77, "Fiabilité (Sigma)", `${data.metrics.volatility_sigma}`);
      drawBox(140, "Confiance modèle", `${data.metrics.confidence_level}`);

      y += 32;

      // ===== TITRE TABLEAU =====
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Prévisions de demande", 14, y);

      y += 8;

      // ===== TABLE HEADER =====
      pdf.setFillColor(241, 245, 249);
      pdf.rect(14, y, 182, 10, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Date", 18, y + 6.5);
      pdf.text("Quantité prévue", 70, y + 6.5);
      pdf.text("Intervalle de risque", 135, y + 6.5);

      y += 12;

      // ===== TABLE ROWS =====
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      data.predictions.forEach((p, index) => {
        if (y > pageHeight - 30) {
          pdf.addPage();
          y = 20;

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(15, 23, 42);
          pdf.text("Prévisions de demande (suite)", 14, y);

          y += 8;
          pdf.setFillColor(241, 245, 249);
          pdf.rect(14, y, 182, 10, "F");

          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.text("Date", 18, y + 6.5);
          pdf.text("Quantité prévue", 70, y + 6.5);
          pdf.text("Intervalle de risque", 135, y + 6.5);

          y += 12;
        }

        if (index % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(14, y - 5, 182, 9, "F");
        }

        pdf.setTextColor(31, 41, 55);
        pdf.text(String(p.date), 18, y);
        pdf.text(`${p.quantite_predite} ${displayUnit}`, 70, y);
        pdf.text(`[${p.borne_basse} - ${p.borne_haute}] ${displayUnit}`, 135, y);

        y += 9;
      });

      // ===== CONCLUSION =====
      y += 10;

      if (y > pageHeight - 45) {
        pdf.addPage();
        y = 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("Interprétation analytique", 14, y);

      y += 8;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(31, 41, 55);

      const commentaire = `Ce rapport présente une estimation prévisionnelle de la demande future pour le produit "${data.name}". Le stock de sécurité recommandé est de ${data.metrics.safety_stock} ${displayUnit}, avec un niveau de confiance de ${data.metrics.confidence_level}. Cette analyse permet d’anticiper les besoins, de mieux planifier l’approvisionnement et de réduire les risques de rupture ou de surstockage.`;

      const lines = pdf.splitTextToSize(commentaire, 180);
      pdf.text(lines, 14, y);

      // ===== FOOTER =====
      const totalPages = (pdf as any).internal.getNumberOfPages?.() || 1;

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text(
          "Rapport généré automatiquement par le système intelligent d’aide à la décision - OCT",
          14,
          287
        );
        pdf.text(`Page ${i}/${totalPages}`, pageWidth - 30, 287);
      }

      pdf.save(`Rapport_OCT_${data.name}.pdf`);
    } catch (err) {
      console.error("Erreur PDF:", err);
      showActionError("Erreur lors de la génération du PDF.");
    }
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen space-y-6">
      <div className="max-w-7xl mx-auto mt-8">
        <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
        {/* HEADER PAGE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analyse Prédictive IA</h1>
            <p className="text-gray-500 text-sm italic">Système d&apos;aide à la décision stratégique</p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={selectedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedId(id);

                const emb = emballages.find((item) => item.id === id) || null;
                setSelectedEmballage(emb);
              }}
              className="min-w-[220px] p-2.5 bg-gray-50 border border-gray-200 text-sm rounded-xl font-semibold outline-none transition-all focus:ring-2 focus:ring-indigo-500"
            >
              {emballages.map((emb) => (
                <option key={emb.id} value={emb.id}>
                  {emb.name}
                </option>
              ))}
            </select>

            {data && (
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
              >
                📥 Télécharger Rapport
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-indigo-600 font-bold">Calcul des modèles mathématiques...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-8 bg-white border-2 border-red-100 rounded-3xl text-center shadow-xl">
            <span className="text-4xl mb-4 block text-red-400">📊</span>
            <h3 className="text-red-700 font-bold text-lg mb-2">Analyse impossible</h3>
            <p className="text-gray-500 max-w-md mx-auto">{error}</p>
          </div>
        )}

        {/* Data */}
        {!loading && data && (
          <div id="report-content" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border-b-4 border-red-500 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Stock de Sécurité IA
                </p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {data.metrics.safety_stock}{" "}
                  <small className="text-sm font-normal text-gray-400">{displayUnit}</small>
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-b-4 border-indigo-500 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Fiabilité (Sigma)
                </p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {data.metrics.volatility_sigma}
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border-b-4 border-green-500 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Confiance Modèle
                </p>
                <p className="text-3xl font-black text-gray-900 mt-2">
                  {data.metrics.confidence_level}
                </p>
              </div>
            </div>

            {/* Graphique */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-3">
                  <span className="w-2 h-8 bg-indigo-600 rounded-full"></span>
                  Prévisions de demande : {data.name}
                </h3>
              </div>
              <StockForecastChart data={data} />
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-8 py-5 text-left text-xs font-bold text-indigo-600 uppercase">
                      Prévision
                    </th>
                    <th className="px-8 py-5 text-center text-xs font-bold text-gray-400 uppercase">
                      Plage de Risque
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.predictions.map((p, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors text-sm">
                      <td className="px-8 py-5 font-semibold text-gray-700">{p.date}</td>
                      <td className="px-8 py-5 font-bold text-gray-900">
                        {p.quantite_predite} {displayUnit}
                      </td>
                      <td className="px-8 py-5 text-xs text-gray-400 text-center font-mono">
                        [{p.borne_basse} - {p.borne_haute}] {displayUnit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}