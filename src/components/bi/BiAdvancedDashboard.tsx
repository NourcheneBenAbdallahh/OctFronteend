"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getAllStocks } from "@/lib/stock.api";
import {
  biDataScopeForRole,
  filterCommandesForCalendarUser,
  filterStocksForDashboardUser,
  isAdminUser,
} from "@/lib/access";
import { useAuthStore } from "@/store/useAuthStore";
import type { Stock } from "@/types/stock";
import type { Commande } from "@/types/commandes";
import type { Facture } from "@/types/facture";
import {
  type BiActivityDay,
  type BiPeriodKey,
  aggregateFacturesByFournisseur,
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

const ROLE_LABEL_FR: Record<string, string> = {
  ADMIN: "Administrateur",
  STOCK: "Stock",
  LOGISTIQUE: "Logistique",
  FINANCE: "Finance",
  CONTRAT: "Contrat",
};

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
  full: "Synthèse stocks, achats et facturation — vue administrateur.",
  stock: "Indicateurs et graphiques basés sur les mouvements de stock (vue métier stock).",
  logistique:
    "Pilotage des commandes et du pipeline (vue métier logistique / achats).",
  finance: "Chiffre d’affaires et répartition des factures (vue métier finance).",
};

export default function BiAdvancedDashboard() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const scope = useMemo(() => biDataScopeForRole(user?.role), [user?.role]);
  const showStock = scope === "full" || scope === "stock";
  const showCmd = scope === "full" || scope === "logistique";
  const showFac = scope === "full" || scope === "finance";

  const [period, setPeriod] = useState<BiPeriodKey>("90d");
  const [entrepot, setEntrepot] = useState<string | "all">("all");
  const [entrepotMenuOpen, setEntrepotMenuOpen] = useState(false);
  const [entrepotQuery, setEntrepotQuery] = useState("");
  const entrepotMenuRef = useRef<HTMLDivElement>(null);
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
      const [allStocksRaw, cmdRaw, facRaw] = await Promise.all([
        showStock
          ? getAllStocks().catch((): Stock[] => [])
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
        e instanceof Error ? e.message : "Impossible de charger les données BI."
      );
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, user?.role, showStock, showCmd, showFac]);

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

  const financeAgg = useMemo(() => {
    if (scope !== "finance") return null;
    const { start, end } = model.range;
    return {
      dailyTtc: buildFacturesDailyTtcSeries(factures, start, end),
      parFn: aggregateFacturesByFournisseur(factures, start, end, 10),
      encours: facturesEncoursSurPeriode(factures, start, end),
      penalites: facturesPenalitesSurPeriode(factures, start, end),
      ht: facturesMontantHtSurPeriode(factures, start, end),
      retard: facturesAvecRetardSurPeriode(factures, start, end),
    };
  }, [scope, model.range, factures]);

  const roleUi =
    ROLE_LABEL_FR[(user?.role ?? "").trim().toUpperCase()] ??
    user?.role ??
    "—";

  const biSectionEmpty =
    !loading &&
    !isAdminUser(user?.role) &&
    ((showStock && stocks.length === 0) ||
      (showCmd && commandes.length === 0) ||
      (showFac && factures.length === 0));

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
      {user ? (
        <div className="rounded-[28px] border border-teal-100 bg-gradient-to-r from-teal-50/90 to-white px-6 py-5 shadow-sm dark:border-teal-900/40 dark:from-teal-950/40 dark:to-gray-900">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-600/80 dark:text-teal-300/80">
            Tableau de bord personnel
          </p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-2xl font-[1000] tracking-tight text-[#1C2434] dark:text-white">
              Bonjour {user.name?.split(" ")[0] ?? user.email}
            </h2>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {roleUi}
              {!isAdminUser(user.role)
                ? " · données de votre section"
                : " · vue complète"}
            </span>
          </div>
          {biSectionEmpty ? (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-400">
              Aucune donnée disponible pour votre section sur ce périmètre BI pour
              le moment.
            </p>
          ) : null}
        </div>
      ) : null}

      <header className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00A09D]">
            Intelligence opérationnelle
          </p>
       
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            {scope === "full"
              ? "Tableau de bord BI"
              : scope === "stock"
                ? "BI — Stock"
                : scope === "logistique"
                  ? "BI — Logistique"
                  : "BI — Finance"}
            <span className="text-[#00A09D]">.</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            {SCOPE_SUBTITLE[scope]} Filtres multi-périodes et comparaison à la
            fenêtre précédente lorsque les données le permettent.
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
                          "Aucun entrepôt disponible dans les données."
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

      {scope === "full" ? (
      <>
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
      </>
      ) : scope === "stock" ? (
        <>
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
              icon={AlertTriangle}
              label="Alertes seuil"
              value={`${fmt(kpis.alertesSeuil)} SKU`}
              tint="bg-amber-50 text-amber-700"
            />
          </section>
          <section className={cardShell}>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Lecture rapide
            </p>
            <p className="mt-2 text-sm font-semibold text-[#1C2434] dark:text-gray-100">
              Flux net sur la période :{" "}
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
            label="Commandes créées (période)"
            value={fmt(kpis.commandesCreees)}
            hint={
              prevKpis ? delta(kpis.commandesCreees, prevKpis.commandesCreees) : null
            }
            tint="bg-sky-50 text-sky-600"
          />
          <KpiCard
            loading={loading}
            icon={ShoppingCart}
            label="Pipeline ouvert"
            value={fmt(kpis.commandesPipeline)}
            hint={
              <span className="text-[10px] font-bold text-gray-400">
                Hors statuts clôturés (réceptionnée / annulée)
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
              label="CA factures TTC (période)"
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
              label="Nombre de factures (période)"
              value={fmt(facturesCountPeriod)}
              tint="bg-teal-50 text-[#00A09D]"
            />
            <KpiCard
              loading={loading}
              icon={Wallet}
              label="Encours à payer (non payées)"
              value={
                financeAgg
                  ? fmtMoney(financeAgg.encours.encoursTtc)
                  : fmtMoney(0)
              }
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  {financeAgg ? `${fmt(financeAgg.encours.encoursCount)} facture(s)` : "—"}{" "}
                  hors annulées / payées
                </span>
              }
              tint="bg-amber-50 text-amber-800"
            />
            <KpiCard
              loading={loading}
              icon={Package}
              label="Montant HT facturé"
              value={financeAgg ? fmtMoney(financeAgg.ht) : fmtMoney(0)}
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  Hors factures annulées
                </span>
              }
              tint="bg-sky-50 text-sky-700"
            />
            <KpiCard
              loading={loading}
              icon={AlertTriangle}
              label="Pénalités (période)"
              value={financeAgg ? fmtMoney(financeAgg.penalites) : fmtMoney(0)}
              tint="bg-rose-50 text-rose-700"
            />
            <KpiCard
              loading={loading}
              icon={AlertTriangle}
              label="Factures avec retard"
              value={
                financeAgg
                  ? `${fmt(financeAgg.retard.count)} · ${fmtMoney(financeAgg.retard.ttc)}`
                  : "—"
              }
              hint={
                <span className="text-[10px] font-bold text-gray-400">
                  Jours de retard &gt; 0 (montant TTC)
                </span>
              }
              tint="bg-orange-50 text-orange-800"
            />
          </section>

          <div className="rounded-[28px] border border-dashed border-teal-200/80 bg-teal-50/40 p-4 text-sm text-[#1C2434] dark:border-teal-900/50 dark:bg-teal-950/30 dark:text-gray-200">
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-300">
              Lecture finance
            </p>
            <p className="mt-2 font-medium leading-relaxed">
              Comparez le <strong>CA TTC</strong> à l&apos;<strong>encours</strong> pour suivre
              l&apos;encaissement. Les <strong>pénalités</strong> et les factures avec{" "}
              <strong>retard</strong> isolent les risques fournisseurs. Les graphiques ci-dessous montrent la
              tendance journalière et le poids par <strong>fournisseur</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className={`${cardShell} min-h-[320px]`}>
              <h3 className="mb-4 text-sm font-[1000] uppercase tracking-tight text-[#1C2434] dark:text-white">
                CA TTC par jour (date d&apos;émission)
              </h3>
              {loading ? (
                <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
              ) : !financeAgg || financeAgg.dailyTtc.every((d) => d.ttc === 0) ? (
                <p className="text-sm text-gray-400">Aucun montant sur la période.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={financeAgg.dailyTtc}>
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
                Top fournisseurs (TTC période)
              </h3>
              {loading ? (
                <div className="h-[280px] animate-pulse rounded-2xl bg-gray-50 dark:bg-gray-800" />
              ) : !financeAgg || financeAgg.parFn.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune donnée fournisseur.</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={financeAgg.parFn} layout="vertical" margin={{ left: 8 }}>
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
              Répartition par statut (nombre)
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
        ) : null}

        {showCmd ? (
        <div
          className={`${cardShell} min-h-[380px] ${
            showStock ? "xl:col-span-4" : "xl:col-span-12"
          }`}
        >
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
        ) : null}
      </div>
      )}

      {/* Row 2 — entrepôts & top SKU */}
      {showStock ? (
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
        ) : null}

        {showFac ? (
        <div
          className={`${cardShell} min-h-[260px] ${
            showStock ? "xl:col-span-5" : "xl:col-span-12"
          }`}
        >
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
      ) : null}
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
