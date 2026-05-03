"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Layers,
  Package,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Line,
} from "recharts";
import { getAllStocks } from "@/lib/stock.api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Stock } from "@/types/stock";
import type { Commande } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import {
  type BiActivityDay,
  type BiPeriodKey,
  computeBiModel,
  fetchAllCommandes,
  fetchAllFactures,
  filterStocksByEntrepot,
  formatDelta,
  topBusyDays,
  uniqueEntrepotNames,
} from "@/lib/bi.data";
import { exportBiSummaryPdf } from "@/lib/bi.pdf";

const PERIOD_OPTIONS: { key: BiPeriodKey; label: string }[] = [
  { key: "7d", label: "7 j" },
  { key: "30d", label: "30 j" },
  { key: "90d", label: "90 j" },
  { key: "180d", label: "6 m" },
  { key: "365d", label: "12 m" },
  { key: "all", label: "Tout" },
];

const STATUT_FR: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDEE: "Validée",
  PARTIELLEMENT_RECEPTIONNEE: "Partiel",
  RECEPTIONNEE: "Réceptionnée",
  ANNULEE: "Annulée",
};

const FACTURE_FR: Record<string, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validée",
  PAYE: "Payée",
  ANNULE: "Annulée",
};

const PIE_COLORS = ["#00A09D", "#FF9C55", "#6366F1", "#F472B6", "#94A3B8", "#22C55E"];

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

function fmtMoney(n: number): string {
  return (
    n.toLocaleString("fr-TN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }) + " TND"
  );
}

export default function BiAdvancedDashboard() {
  const token = useAuthStore((s) => s.token);

  const [period, setPeriod] = useState<BiPeriodKey>("90d");
  const [entrepot, setEntrepot] = useState<string | "all">("all");
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [allStocks, cmd, fac] = await Promise.all([
        getAllStocks(),
        fetchAllCommandes(token),
        fetchAllFactures(token),
      ]);
      setStocks(allStocks);
      setCommandes(cmd);
      setFactures(fac);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Impossible de charger les données BI."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  const stocksScoped = useMemo(
    () => filterStocksByEntrepot(stocks, entrepot),
    [stocks, entrepot]
  );

  const model = useMemo(
    () => computeBiModel(stocksScoped, commandes, factures, period, new Date()),
    [stocksScoped, commandes, factures, period]
  );

  const entrepotsOptions = useMemo(
    () => uniqueEntrepotNames(stocks),
    [stocks]
  );

  const {
    kpis,
    prevKpis,
    daily,
    entrepots,
    emballages,
    pareto,
    commandesStat,
    facturesStat,
    activity56,
  } = model;

  const busiestDays = useMemo(() => topBusyDays(activity56, 5), [activity56]);

  const handleExportPdf = useCallback(() => {
    if (loading) return;
    setExporting(true);
    try {
      const periodLabel =
        PERIOD_OPTIONS.find((o) => o.key === period)?.label ?? period;
      const entrepotLabel =
        entrepot === "all" ? "Tous les entrepots" : String(entrepot);
      exportBiSummaryPdf({
        periodLabel,
        entrepotLabel,
        range: model.range,
        kpis,
        prevKpis,
        daily,
        entrepots,
        emballages,
        pareto,
        commandesStat,
        facturesStat,
        busiestDays,
        statutFr: STATUT_FR,
        factureFr: FACTURE_FR,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  }, [
    loading,
    period,
    entrepot,
    model.range,
    kpis,
    prevKpis,
    daily,
    entrepots,
    emballages,
    pareto,
    commandesStat,
    facturesStat,
    busiestDays,
  ]);

  const delta = (cur: number, prev: number | undefined, format: "num" | "money" = "num") => {
    if (prev === undefined || !prevKpis) return null;
    const d = formatDelta(cur, prev);
    const bad =
      d.startsWith("-") && !d.startsWith("-0") && d !== "—"
        ? true
        : false;
    const Icon = bad ? ArrowDownRight : ArrowUpRight;
    const label =
      format === "money"
        ? fmtMoney(cur - prev)
        : `${fmt(cur - prev)}`;
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-bold uppercase ${bad ? "text-red-500" : "text-emerald-600"}`}
      >
        <Icon className="w-3 h-3" />
        {d !== "—" ? `${d} vs période préc.` : "—"} ({label})
      </span>
    );
  };

  const cardShell =
    "rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900";

  if (error) {
    return (
      <div className={`${cardShell} text-center py-16`}>
        <p className="text-red-600 font-semibold mb-4">{error}</p>
        <button
          type="button"
          onClick={load}
          className="rounded-full bg-[#00A09D] px-5 py-2 text-sm font-bold text-white"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00A09D]">
            Intelligence opérationnelle
          </p>
       
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
          Tableau de bord BI
          <span className="text-[#00A09D]">.</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            Synthèse stocks, achats et facturation — filtres multi-périodes et
            comparaison à la fenêtre précédente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setPeriod(o.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  period === o.key
                    ? "bg-[#00A09D] text-white shadow"
                    : "text-gray-600 hover:text-[#1C2434] dark:text-gray-300"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <select
            value={entrepot}
            onChange={(e) => setEntrepot(e.target.value as typeof entrepot)}
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#1C2434] dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          >
            <option value="all">Tous les entrepôts</option>
            {entrepotsOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-[#1C2434] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 rounded-full bg-[#1C2434] px-4 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50 dark:bg-[#00A09D] dark:hover:bg-[#008e8b]"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Export…" : "PDF"}
          </button>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          loading={loading}
          icon={Package}
          label="Volume entrées"
          value={`${fmt(kpis.volumeEntrees)} u.`}
          hint={prevKpis ? delta(kpis.volumeEntrees, prevKpis.volumeEntrees) : null}
          tint="bg-teal-50 text-[#00A09D]"
        />
        <KpiCard
          loading={loading}
          icon={Activity}
          label="Volume sorties"
          value={`${fmt(kpis.volumeSorties)} u.`}
          hint={prevKpis ? delta(kpis.volumeSorties, prevKpis.volumeSorties) : null}
          tint="bg-orange-50 text-orange-600"
        />
        <KpiCard
          loading={loading}
          icon={Layers}
          label="Mouvements / SKU actifs"
          value={`${fmt(kpis.mouvements)} / ${fmt(kpis.skusActifs)}`}
          hint={
            prevKpis ? delta(kpis.mouvements, prevKpis.mouvements) : null
          }
          tint="bg-indigo-50 text-indigo-600"
        />
        <KpiCard
          loading={loading}
          icon={ShoppingCart}
          label="Commandes"
          value={`${fmt(kpis.commandesCreees)} créées`}
          hint={
            <span className="text-[10px] font-bold text-gray-400">
              Pipeline ouvert : {fmt(kpis.commandesPipeline)}
            </span>
          }
          tint="bg-sky-50 text-sky-600"
          secondaryHint={
            prevKpis ? delta(kpis.commandesCreees, prevKpis.commandesCreees) : null
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard
          loading={loading}
          icon={Wallet}
          label="CA factures (période)"
          value={fmtMoney(kpis.chiffreFacturesTtc)}
          hint={
            prevKpis
              ? delta(
                  kpis.chiffreFacturesTtc,
                  prevKpis.chiffreFacturesTtc,
                  "money"
                )
              : null
          }
          tint="bg-emerald-50 text-emerald-700"
          className="lg:col-span-1"
        />
        <div
          className={`${cardShell} lg:col-span-2 flex flex-col justify-center`}
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Lecture rapide
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1C2434] dark:text-gray-100">
            Flux net sur la période :{" "}
            <span className={kpis.netFlux >= 0 ? "text-emerald-600" : "text-orange-600"}>
              {kpis.netFlux >= 0 ? "+" : ""}
              {fmt(kpis.netFlux)} unités
            </span>
            . Alertes sous seuil (réf. stock global) :{" "}
            <span className="font-[1000]">{fmt(kpis.alertesSeuil)}</span> SKU.
          </p>
        </div>
      </section>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`${cardShell} xl:col-span-8 min-h-[380px]`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Entrées vs sorties (journalier)
          </h3>
          {loading ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={daily}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: "none" }}
                  formatter={(v) => fmt(Number(v ?? 0))}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="entrees"
                  name="Entrées"
                  fill="#00A09D"
                  stroke="#00A09D"
                  fillOpacity={0.25}
                />
                <Line
                  type="monotone"
                  dataKey="sorties"
                  name="Sorties"
                  stroke="#FF9C55"
                  strokeWidth={3}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${cardShell} xl:col-span-4 min-h-[380px]`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Pipeline commandes
          </h3>
          {loading ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : commandesStat.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune commande sur la période.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={commandesStat as unknown as Record<string, unknown>[]}
                  dataKey="count"
                  nameKey="statut"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={96}
                  paddingAngle={2}
                  label={false}
                >
                  {commandesStat.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _name, item) => {
                    const statut =
                      item?.payload &&
                      typeof item.payload === "object" &&
                      "statut" in item.payload
                        ? String(
                            (item.payload as { statut: string }).statut
                          )
                        : "";
                    return [
                      fmt(Number(value ?? 0)),
                      STATUT_FR[statut] ?? statut,
                    ];
                  }}
                />
                <Legend
                  formatter={(value) =>
                    STATUT_FR[String(value)] ?? String(value)
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2 — entrepôts & top SKU */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${cardShell} min-h-[360px]`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Activité par entrepôt
          </h3>
          {loading ? (
            <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={entrepots} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="entrees" name="Entrées" stackId="a" fill="#00A09D" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sorties" name="Sorties" stackId="a" fill="#FF9C55" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${cardShell} min-h-[360px]`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Top emballages (volume mouvementé)
          </h3>
          {loading ? (
            <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={emballages}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => fmt(Number(v ?? 0))} />
                <Bar dataKey="volume" name="Volume" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pareto & factures */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className={`${cardShell} xl:col-span-7`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Courbe de Pareto (cumul % — TOP articles)
          </h3>
          {loading ? (
            <div className="h-[260px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={pareto}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={90} />
                <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(v, name) =>
                    name === "cumulPct"
                      ? [`${Number(v ?? 0)}%`, "Cumul"]
                      : [fmt(Number(v ?? 0)), "Volume"]
                  }
                />
                <Bar yAxisId="left" dataKey="value" name="Volume" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulPct"
                  name="Cumul %"
                  stroke="#00A09D"
                  strokeWidth={2}
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={`${cardShell} xl:col-span-5`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Facturation (montants TTC)
          </h3>
          {loading ? (
            <div className="h-[260px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
          ) : facturesStat.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune facture sur la période.</p>
          ) : (
            <ul className="space-y-3">
              {facturesStat.map((f) => (
                <li
                  key={f.statut}
                  className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <span className="text-xs font-bold text-[#1C2434] dark:text-gray-100">
                    {FACTURE_FR[f.statut] ?? f.statut}
                  </span>
                  <span className="text-xs font-[1000] text-emerald-700 dark:text-emerald-400">
                    {fmtMoney(f.montantTtc)}{" "}
                    <span className="font-semibold text-gray-400">({f.count})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Activité : histogramme + top jours (plus lisible qu’une grille) */}
      <div className={cardShell}>
        <h3 className="mb-2 text-base font-[1000] tracking-tight text-[#1C2434] dark:text-white">
          Activité sur les 8 dernières semaines
        </h3>
        <p className="mb-6 text-sm leading-snug text-gray-600 dark:text-gray-300">
          Chaque barre = <strong>une journée</strong>, dans l&apos;ordre du calendrier (de gauche à droite). La hauteur
          indique combien d&apos;entrées et sorties de stock ont été enregistrées ce jour-là. Surveillez la couronne du
          graphique ou faites défiler horizontalement sur mobile pour voir tous les jours.
        </p>

        {loading ? (
          <div className="h-[300px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <div className="min-w-0 flex-1">
              <div className="-mx-1 overflow-x-auto pb-2 sm:mx-0">
                <div className="min-h-[280px] min-w-[min(100%,720px)]">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={activity56}
                      margin={{ top: 8, right: 4, left: 0, bottom: 4 }}
                      barCategoryGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
                      <XAxis
                        dataKey="labelShort"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        interval={6}
                        angle={-40}
                        textAnchor="end"
                        height={52}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        allowDecimals={false}
                        width={36}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0, 160, 157, 0.07)" }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0].payload as BiActivityDay;
                          return (
                            <div className="max-w-[260px] rounded-xl border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
                              <p className="font-semibold capitalize leading-snug text-[#1C2434] dark:text-gray-100">
                                {p.labelLong}
                              </p>
                              <p className="mt-1 font-bold text-[#00A09D]">
                                {p.count} opération{p.count !== 1 ? "s" : ""}
                              </p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="count" fill="#00A09D" radius={[2, 2, 0, 0]} maxBarSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-[280px]">
              <div className="rounded-2xl border border-[#00A09D]/20 bg-[#00A09D]/[0.06] p-4 dark:border-[#00A09D]/30 dark:bg-[#00A09D]/10">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
                  Jours les plus chargés
                </p>
                {busiestDays.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Aucune opération sur cette période (56 jours).
                  </p>
                ) : (
                  <ol className="mt-3 space-y-2.5">
                    {busiestDays.map((d, i) => (
                      <li
                        key={d.dateYmd}
                        className="flex items-baseline justify-between gap-2 border-b border-[#00A09D]/10 pb-2 text-sm last:border-0 last:pb-0 dark:border-[#00A09D]/20"
                      >
                        <span className="font-bold text-gray-400 tabular-nums">{i + 1}.</span>
                        <span className="min-w-0 flex-1 capitalize leading-snug text-[#1C2434] dark:text-gray-100">
                          {d.labelLong}
                        </span>
                        <span className="shrink-0 font-black tabular-nums text-[#00A09D]">{fmt(d.count)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard(props: {
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: React.ReactNode;
  secondaryHint?: React.ReactNode;
  tint: string;
  className?: string;
}) {
  const { loading, icon: Icon, label, value, hint, secondaryHint, tint, className } =
    props;
  return (
    <div
      className={`rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className ?? ""}`}
    >
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-8 w-full rounded bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : (
        <>
          <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${tint}`}>
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-[1000] tracking-tight text-[#1C2434] dark:text-white">
            {value}
          </p>
          {hint && <div className="mt-2">{hint}</div>}
          {secondaryHint && <div className="mt-1">{secondaryHint}</div>}
        </>
      )}
    </div>
  );
}
