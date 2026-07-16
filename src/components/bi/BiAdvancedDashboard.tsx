"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText,
  Layers,
  Package,
  RefreshCw,
  Search,
  ShoppingCart,
  Wallet,
  Warehouse,
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
import {
  biDataScopeForRole,
  canViewFournisseursMap,
  canViewPredictiveStockAlerts,
  filterCommandesForCalendarUser,
  filterStocksForDashboardUser,
  isAdminUser,
  roleDisplayLabel,
} from "@/lib/access";
import { getAllStocks, getStocksSince } from "@/lib/stock.api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Stock } from "@/types/stock";
import type { Commande } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import {
  type BiActivityDay,
  type BiPeriodKey,
  aggregateFacturesByFournisseur,
  biStockFetchFrom,
  buildFacturesDailyTtcSeries,
  computeBiModel,
  facturesAvecRetardSurPeriode,
  facturesEncoursSurPeriode,
  facturesMontantHtSurPeriode,
  facturesPenalitesSurPeriode,
  fetchAllCommandes,
  fetchAllFactures,
  filterStocksByEntrepot,
  formatDelta,
  topBusyDays,
  uniqueEntrepotNames,
} from "@/lib/bi.data";

const FournisseursMapCard = dynamic(
  () => import("@/components/fournisseurs/FournisseursMapCard"),
  { ssr: false }
);

const StockPredictionCard = dynamic(
  () => import("@/components/dashboard/StockPredictionCard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 animate-pulse rounded-[28px] border border-gray-100 bg-gray-50" />
    ),
  }
);

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

const SCOPE_SUBTITLE: Record<
  ReturnType<typeof biDataScopeForRole>,
  string
> = {
  full: "Stocks, commandes et factures en un coup d'œil.",
  stock: "Entrées, sorties et alertes de stock.",
  logistique: "Suivi de vos commandes.",
  finance: "Montants facturés et factures à payer.",
};

export default function BiAdvancedDashboard() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const scope = useMemo(() => biDataScopeForRole(user?.role), [user?.role]);
  const showStock = scope === "full" || scope === "stock";
  const showCmd = scope === "full" || scope === "logistique";
  const showFac = scope === "full" || scope === "finance";
  const showPredictiveAlerts = canViewPredictiveStockAlerts(user?.role);
  const showFournisseursMap = canViewFournisseursMap(user?.role);

  // 90 j par défaut : la démo d’avril est hors fenêtre « 7 j » en juillet.
  const [period, setPeriod] = useState<BiPeriodKey>("90d");
  const [entrepot, setEntrepot] = useState<string | "all">("all");
  const [entrepotMenuOpen, setEntrepotMenuOpen] = useState(false);
  const [entrepotQuery, setEntrepotQuery] = useState("");
  const entrepotMenuRef = useRef<HTMLDivElement>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [predictionStocks, setPredictionStocks] = useState<Stock[]>([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const requestOpts = token ? { token } : undefined;
    const anchor = new Date();

    try {
      const stockFrom = biStockFetchFrom(period, anchor);
      const [allStocksRaw, cmdRaw, facRaw] = await Promise.all([
        showStock
          ? stockFrom
            ? getStocksSince(stockFrom, undefined, requestOpts, 300, 40, true)
            : getAllStocks(250, 80, requestOpts)
          : Promise.resolve([] as Stock[]),
        showCmd
          ? fetchAllCommandes(token).catch((): Commande[] => [])
          : Promise.resolve([] as Commande[]),
        showFac
          ? fetchAllFactures(token).catch((): Facture[] => [])
          : Promise.resolve([] as Facture[]),
      ]);

      setStocks(
        filterStocksForDashboardUser(
          allStocksRaw,
          user?.id ?? null,
          user?.role ?? null
        )
      );
      setCommandes(
        filterCommandesForCalendarUser(
          cmdRaw,
          user?.id ?? null,
          user?.role ?? null
        )
      );
      setFactures(facRaw);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "Impossible de charger les données."
      );
      setStocks([]);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, user?.role, showStock, showCmd, showFac, period]);

  React.useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showPredictiveAlerts || loading) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoadingPrediction(true);
      try {
        const from = new Date();
        from.setDate(from.getDate() - 30);
        const rows = await getStocksSince(
          from,
          undefined,
          token ? { token } : undefined,
          200,
          15,
          true
        );
        if (!cancelled) {
          setPredictionStocks(rows);
        }
      } catch {
        if (!cancelled) {
          setPredictionStocks([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPrediction(false);
        }
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showPredictiveAlerts, loading, token]);

  const stocksScoped = useMemo(
    () => filterStocksByEntrepot(stocks, entrepot),
    [stocks, entrepot]
  );

  const model = useMemo(
    () => computeBiModel(stocksScoped, commandes, factures, period, new Date()),
    [stocksScoped, commandes, factures, period]
  );

  const entrepotsOptions = useMemo(() => uniqueEntrepotNames(stocks), [stocks]);

  const entrepotsFiltered = useMemo(() => {
    const q = entrepotQuery.trim().toLowerCase();
    if (!q) return entrepotsOptions;
    return entrepotsOptions.filter((n) => n.toLowerCase().includes(q));
  }, [entrepotsOptions, entrepotQuery]);

  useEffect(() => {
    if (!entrepotMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        entrepotMenuRef.current &&
        !entrepotMenuRef.current.contains(e.target as Node)
      ) {
        setEntrepotMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEntrepotMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [entrepotMenuOpen]);

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

  const facturesCountPeriod = useMemo(
    () => facturesStat.reduce((a, f) => a + f.count, 0),
    [facturesStat]
  );

  const financeView = useMemo(() => {
    if (!showFac) return null;
    const { start, end } = model.range;
    const encours = facturesEncoursSurPeriode(factures, start, end);
    const retard = facturesAvecRetardSurPeriode(factures, start, end);
    return {
      encours,
      ht: facturesMontantHtSurPeriode(factures, start, end),
      penalites: facturesPenalitesSurPeriode(factures, start, end),
      retard,
      dailyTtc: buildFacturesDailyTtcSeries(factures, start, end),
      parFn: aggregateFacturesByFournisseur(factures, start, end, 10),
    };
  }, [showFac, factures, model.range]);

  const roleUi = roleDisplayLabel(user?.role);

  const biSectionEmpty =
    !loading &&
    !isAdminUser(user?.role) &&
    ((showStock && kpis.mouvements === 0 && kpis.alertesSeuil === 0) ||
      (showCmd && kpis.commandesCreees === 0 && kpis.commandesPipeline === 0) ||
      (showFac && kpis.chiffreFacturesTtc === 0));

  const handleExportPdf = useCallback(async () => {
    if (loading) return;
    setExporting(true);
    try {
      const periodLabel =
        PERIOD_OPTIONS.find((o) => o.key === period)?.label ?? period;
      const entrepotLabel =
        entrepot === "all" ? "Tous les entrepots" : String(entrepot);
      const { exportBiSummaryPdf } = await import("@/lib/bi.pdf");
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
        {d !== "—" ? `${d} vs avant` : "—"} ({label})
      </span>
    );
  };

  const deltaSimple = (cur: number, prev: number | undefined) => {
    if (prev === undefined || !prevKpis) return null;
    const diff = cur - prev;
    if (diff === 0) {
      return (
        <span className="text-[10px] font-semibold text-gray-400">
          Identique à la période précédente
        </span>
      );
    }
    const bad = diff < 0;
    const Icon = bad ? ArrowDownRight : ArrowUpRight;
    const sign = diff > 0 ? "+" : "";
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${bad ? "text-red-500" : "text-emerald-600"}`}
      >
        <Icon className="w-3 h-3" />
        {sign}
        {fmt(diff)} vs période précédente
      </span>
    );
  };

  const mouvementsLabel = (n: number) =>
    `${fmt(n)} mouvement${n > 1 ? "s" : ""}`;
  const produitsConcernesLabel = (n: number) =>
    `${fmt(n)} produit${n > 1 ? "s" : ""} concerné${n > 1 ? "s" : ""}`;

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
      {user ? (
        <div className="rounded-[28px] border border-teal-100 bg-gradient-to-r from-teal-50/90 to-white px-6 py-5 shadow-sm dark:border-teal-900/40 dark:from-teal-950/40 dark:to-gray-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600/80 dark:text-teal-300/80">
            Bienvenue
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-[1000] tracking-tight text-[#1C2434] dark:text-white">
              Bonjour {user.name?.split(" ")[0] ?? user.email}
            </h2>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {roleUi}
              {!isAdminUser(user.role)
                ? " · vos données seulement"
                : " · toutes les données"}
            </span>
          </div>
          {biSectionEmpty ? (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
              Pas encore de données pour votre service.
            </p>
          ) : null}
        </div>
      ) : null}

      <header className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00A09D]">
            Résumé
          </p>
       
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            Tableau de bord
            <span className="text-[#00A09D]">.</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {SCOPE_SUBTITLE[scope]} Choisissez une période ci-dessus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex flex-wrap rounded-full border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800"
          >
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

          {showStock ? (
            <div className="relative" ref={entrepotMenuRef}>
              <button
                type="button"
                aria-expanded={entrepotMenuOpen}
                aria-haspopup="listbox"
                onClick={() => {
                  setEntrepotMenuOpen((o) => {
                    const next = !o;
                    if (next) setEntrepotQuery("");
                    return next;
                  });
                }}
                className="inline-flex min-w-[11.5rem] max-w-[16rem] items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-2 text-left text-xs font-bold text-[#1C2434] shadow-sm transition hover:border-[#00A09D]/40 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:border-[#00A09D]/50"
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <Warehouse className="h-4 w-4 shrink-0 text-[#00A09D]" />
                  <span className="truncate">
                    {entrepot === "all"
                      ? "Tous les entrepôts"
                      : entrepot}
                  </span>
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                    entrepotMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {entrepotMenuOpen ? (
                <div
                  role="listbox"
                  className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),20rem)] overflow-hidden rounded-2xl border border-gray-200/95 bg-white shadow-[0_18px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-black/[0.04] dark:border-gray-700 dark:bg-gray-900 dark:ring-white/10"
                >
                  <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-2 py-2 dark:border-gray-800 dark:from-gray-800/90 dark:to-gray-900">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        autoComplete="off"
                        value={entrepotQuery}
                        onChange={(e) => setEntrepotQuery(e.target.value)}
                        placeholder="Rechercher un entrepôt…"
                        className="w-full rounded-xl border border-gray-200/90 bg-white py-2 pl-9 pr-3 text-xs font-semibold text-[#1C2434] outline-none transition placeholder:text-gray-400 focus:border-[#00A09D] focus:ring-2 focus:ring-[#00A09D]/20 dark:border-gray-600 dark:bg-gray-950 dark:text-white dark:focus:border-[#00A09D]"
                      />
                    </div>
                  </div>

                  <div
                    className="max-h-[min(16rem,calc(100vh-12rem))] overflow-y-auto overscroll-y-contain py-1.5 [scrollbar-color:#cbd5e1_#f1f5f9] [scrollbar-width:thin] dark:[scrollbar-color:#475569_#1e293b] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-gray-100 dark:[&::-webkit-scrollbar-track]:bg-gray-800 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-500"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={entrepot === "all"}
                      onClick={() => {
                        setEntrepot("all");
                        setEntrepotMenuOpen(false);
                        setEntrepotQuery("");
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold transition ${
                        entrepot === "all"
                          ? "bg-[#00A09D]/10 text-[#00A09D]"
                          : "text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
                      }`}
                    >
                      <Warehouse className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="truncate">Tous les entrepôts</span>
                    </button>

                    {entrepotsFiltered.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {entrepotQuery.trim() ? (
                          <>
                            Aucun entrepôt ne correspond à « {entrepotQuery.trim()} »
                          </>
                        ) : (
                          "Aucun entrepôt disponible."
                        )}
                      </p>
                    ) : (
                      entrepotsFiltered.map((n) => (
                        <button
                          key={n}
                          type="button"
                          role="option"
                          aria-selected={entrepot === n}
                          onClick={() => {
                            setEntrepot(n);
                            setEntrepotMenuOpen(false);
                            setEntrepotQuery("");
                          }}
                          className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-semibold transition ${
                            entrepot === n
                              ? "bg-[#00A09D]/10 font-bold text-[#00A09D]"
                              : "text-gray-800 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-800/80"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00A09D]/60" />
                          <span className="truncate">{n}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

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

      <div className="flex flex-col gap-6">
      {scope === "full" ? (
      <>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          loading={loading}
          icon={Package}
          label="Entrées"
          value={`${fmt(kpis.volumeEntrees)} u.`}
          hint={prevKpis ? delta(kpis.volumeEntrees, prevKpis.volumeEntrees) : null}
          tint="bg-teal-50 text-[#00A09D]"
        />
        <KpiCard
          loading={loading}
          icon={Activity}
          label="Sorties"
          value={`${fmt(kpis.volumeSorties)} u.`}
          hint={prevKpis ? delta(kpis.volumeSorties, prevKpis.volumeSorties) : null}
          tint="bg-orange-50 text-orange-600"
        />
        <KpiCard
          loading={loading}
          icon={Layers}
          label="Mouvements de stock"
          value={mouvementsLabel(kpis.mouvements)}
          subValue={produitsConcernesLabel(kpis.skusActifs)}
          hint={
            prevKpis ? deltaSimple(kpis.mouvements, prevKpis.mouvements) : null
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
              En cours : {fmt(kpis.commandesPipeline)}
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
          label="Montant facturé"
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
            En bref
          </p>
          <p className="mt-2 text-sm font-semibold text-[#1C2434] dark:text-gray-100">
            Solde (entrées − sorties) :{" "}
            <span className={kpis.netFlux >= 0 ? "text-emerald-600" : "text-orange-600"}>
              {kpis.netFlux >= 0 ? "+" : ""}
              {fmt(kpis.netFlux)} unités
            </span>
            . Produits en alerte stock bas :{" "}
            <span className="font-[1000]">{fmt(kpis.alertesSeuil)}</span>.
          </p>
        </div>
      </section>
      </>
      ) : scope === "stock" ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              loading={loading}
              icon={Package}
              label="Entrées"
              value={`${fmt(kpis.volumeEntrees)} u.`}
              hint={prevKpis ? delta(kpis.volumeEntrees, prevKpis.volumeEntrees) : null}
              tint="bg-teal-50 text-[#00A09D]"
            />
            <KpiCard
              loading={loading}
              icon={Activity}
              label="Sorties"
              value={`${fmt(kpis.volumeSorties)} u.`}
              hint={prevKpis ? delta(kpis.volumeSorties, prevKpis.volumeSorties) : null}
              tint="bg-orange-50 text-orange-600"
            />
            <KpiCard
              loading={loading}
              icon={Layers}
              label="Mouvements de stock"
              value={mouvementsLabel(kpis.mouvements)}
              subValue={produitsConcernesLabel(kpis.skusActifs)}
              hint={
                prevKpis ? deltaSimple(kpis.mouvements, prevKpis.mouvements) : null
              }
              tint="bg-indigo-50 text-indigo-600"
            />
            <KpiCard
              loading={loading}
              icon={AlertTriangle}
              label="Alertes stock bas"
              value={`${fmt(kpis.alertesSeuil)} produit${kpis.alertesSeuil > 1 ? "s" : ""}`}
              tint="bg-amber-50 text-amber-700"
            />
          </section>
          <section className={cardShell}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              En bref
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1C2434] dark:text-gray-100">
              Solde (entrées − sorties) :{" "}
              <span className={kpis.netFlux >= 0 ? "text-emerald-600" : "text-orange-600"}>
                {kpis.netFlux >= 0 ? "+" : ""}
                {fmt(kpis.netFlux)} unités
              </span>
              .
            </p>
          </section>
        </>
      ) : scope === "logistique" ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard
            loading={loading}
            icon={ShoppingCart}
            label="Nouvelles commandes"
            value={fmt(kpis.commandesCreees)}
            hint={
              prevKpis ? delta(kpis.commandesCreees, prevKpis.commandesCreees) : null
            }
            tint="bg-sky-50 text-sky-600"
          />
          <KpiCard
            loading={loading}
            icon={ShoppingCart}
            label="Commandes en cours"
            value={fmt(kpis.commandesPipeline)}
            hint={
              <span className="text-[10px] font-bold text-gray-400">
                Pas encore livrées ni annulées
              </span>
            }
            tint="bg-indigo-50 text-indigo-600"
          />
        </section>
      ) : scope === "finance" ? (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              loading={loading}
              icon={Wallet}
              label="Total facturé (TTC)"
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
            />
            <KpiCard
              loading={loading}
              icon={FileText}
              label="Nombre de factures"
              value={fmt(facturesCountPeriod)}
              tint="bg-teal-50 text-[#00A09D]"
            />
            <KpiCard
              loading={loading}
              icon={Wallet}
              label="Reste à payer"
              value={
                financeView
                  ? fmtMoney(financeView.encours.encoursTtc)
                  : fmtMoney(0)
              }
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  {financeView ? `${fmt(financeView.encours.encoursCount)} facture(s)` : "—"}{" "}
                  non réglées
                </span>
              }
              tint="bg-amber-50 text-amber-800"
            />
            <KpiCard
              loading={loading}
              icon={Package}
              label="Montant hors taxes"
              value={financeView ? fmtMoney(financeView.ht) : fmtMoney(0)}
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  Sans les factures annulées
                </span>
              }
              tint="bg-sky-50 text-sky-700"
            />
            <KpiCard
              loading={loading}
              icon={AlertTriangle}
              label="Pénalités"
              value={financeView ? fmtMoney(financeView.penalites) : fmtMoney(0)}
              tint="bg-rose-50 text-rose-700"
            />
            <KpiCard
              loading={loading}
              icon={AlertTriangle}
              label="Factures en retard"
              value={
                financeView
                  ? `${fmt(financeView.retard.count)} · ${fmtMoney(financeView.retard.ttc)}`
                  : "—"
              }
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  Montant TTC des factures en retard
                </span>
              }
              tint="bg-orange-50 text-orange-800"
            />
          </section>

          <div className="rounded-[28px] border border-dashed border-teal-200/80 bg-teal-50/40 p-4 text-sm text-[#1C2434] dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-gray-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
              En bref
            </p>
            <p className="mt-2 font-medium leading-relaxed">
              Le <strong>total facturé</strong> montre ce qui a été émis. Le{" "}
              <strong>reste à payer</strong> indique ce qui n&apos;est pas encore réglé. Les{" "}
              <strong>pénalités</strong> et les <strong>retards</strong> signalent les problèmes à traiter.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={`${cardShell} min-h-[320px]`}>
              <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
                Factures par jour
              </h3>
              {loading ? (
                <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
              ) : !financeView || financeView.dailyTtc.every((d) => d.ttc === 0) ? (
                <p className="text-sm text-gray-400">Aucun montant sur la période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={financeView.dailyTtc}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(v, name) =>
                        String(name) === "ttc"
                          ? [fmtMoney(Number(v ?? 0)), "TTC"]
                          : [fmt(Number(v ?? 0)), "Factures"]
                      }
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="ttc"
                      name="TTC"
                      fill="#00A09D"
                      stroke="#00A09D"
                      fillOpacity={0.2}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Nombre"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className={`${cardShell} min-h-[320px]`}>
              <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
                Principaux fournisseurs
              </h3>
              {loading ? (
                <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
              ) : !financeView || financeView.parFn.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune donnée fournisseur.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={financeView.parFn} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 9 }} />
                    <Tooltip
                      formatter={(v, _n, item) => {
                        const c = (item?.payload as { count?: number })?.count;
                        return [
                          `${fmtMoney(Number(v ?? 0))} (${fmt(Number(c ?? 0))} fact.)`,
                          "TTC",
                        ];
                      }}
                    />
                    <Bar dataKey="montantTtc" name="TTC" fill="#00A09D" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className={`${cardShell} min-h-[300px]`}>
            <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
              Factures par statut
            </h3>
            {loading ? (
              <div className="h-[260px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
            ) : facturesStat.length === 0 ? (
              <p className="text-sm text-gray-400">Aucune facture sur la période.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={facturesStat as unknown as Record<string, unknown>[]}
                    dataKey="count"
                    nameKey="statut"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={100}
                    paddingAngle={2}
                    label={false}
                  >
                    {facturesStat.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, _name, item) => {
                      const statut =
                        item?.payload &&
                        typeof item.payload === "object" &&
                        "statut" in item.payload
                          ? String((item.payload as { statut: string }).statut)
                          : "";
                      return [
                        fmt(Number(value ?? 0)),
                        FACTURE_FR[statut] ?? statut,
                      ];
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      FACTURE_FR[String(value)] ?? String(value)
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      ) : null}

      {showPredictiveAlerts ? (
        <section className="w-full rounded-[40px] border border-[#DDF2F1] bg-[#F8FAFA] p-8 dark:border-teal-900/30 dark:bg-gray-900/40">
          <div className="mb-8">
            <h3 className="text-xl font-[1000] uppercase tracking-tighter text-[#1C2434] dark:text-white">
              Alertes stock
            </h3>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
              Produits qui risquent de manquer bientôt
              {entrepot !== "all" ? ` · ${entrepot}` : ""}
            </p>
          </div>
          {loading || loadingPrediction ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="min-h-[220px] animate-pulse rounded-[35px] border-2 border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : predictionStocks.length === 0 ? (
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pas de données stock pour afficher les alertes.
            </p>
          ) : (
            <StockPredictionCard stocks={predictionStocks} />
          )}
        </section>
      ) : null}

      {showFournisseursMap ? (
        <section className="w-full">
          <FournisseursMapCard enabled={showFournisseursMap} />
        </section>
      ) : null}

      {/* Charts row 1 */}
      {(showStock || showCmd) && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {showStock ? (
        <div
          className={`${cardShell} min-h-[380px] ${
            showCmd ? "xl:col-span-8" : "xl:col-span-12"
          }`}
        >
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Entrées et sorties par jour
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
        ) : null}

        {showCmd ? (
        <div
          className={`${cardShell} min-h-[380px] ${
            showStock ? "xl:col-span-4" : "xl:col-span-12"
          }`}
        >
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            État des commandes
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
        ) : null}
      </div>
      )}

      {/* Row 2 — entrepôts & top SKU */}
      {showStock ? (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className={`${cardShell} min-h-[360px]`}>
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Mouvements par entrepôt
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
            Produits les plus actifs
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
      ) : null}

      {/* Pareto & factures */}
      {(showStock || showFac) && (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {showStock ? (
        <div
          className={`${cardShell} min-h-[260px] ${
            showFac ? "xl:col-span-7" : "xl:col-span-12"
          }`}
        >
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Articles les plus utilisés
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
        ) : null}

        {showFac ? (
        <div
          className={`${cardShell} min-h-[260px] ${
            showStock ? "xl:col-span-5" : "xl:col-span-12"
          }`}
        >
          <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
            Montants par statut de facture
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
        ) : null}
      </div>
      )}

      {/* Activité : histogramme + top jours (plus lisible qu’une grille) */}
      {showStock ? (
      <div className={cardShell}>
        <h3 className="mb-2 text-base font-[1000] tracking-tight text-[#1C2434] dark:text-white">
          Activité sur les 8 dernières semaines
        </h3>
        <p className="mb-6 text-sm leading-snug text-gray-600 dark:text-gray-300">
          Nombre d&apos;opérations stock par jour. Plus la barre est haute, plus la journée a été chargée.
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
                  Jours les plus actifs
                </p>
                {busiestDays.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                    Aucune opération sur les 8 dernières semaines.
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
      ) : null}
      </div>
    </div>
  );
}

function KpiCard(props: {
  loading?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  hint?: React.ReactNode;
  secondaryHint?: React.ReactNode;
  tint: string;
  className?: string;
}) {
  const { loading, icon: Icon, label, value, subValue, hint, secondaryHint, tint, className } =
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
          {subValue ? (
            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
              {subValue}
            </p>
          ) : null}
          {hint && <div className="mt-2">{hint}</div>}
          {secondaryHint && <div className="mt-1">{secondaryHint}</div>}
        </>
      )}
    </div>
  );
}
