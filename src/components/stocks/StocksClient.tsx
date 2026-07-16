"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List, Loader2 } from "lucide-react";
import type {
  Stock,
  StockFiltersState,
  StocksStats as StocksStatsType,
} from "@/types/stock";
import type { UniteMesure } from "@/types/unite-mesure";
import StocksHeader from "./StocksHeader";
import StocksStats from "./StocksStats";
import StocksFilters from "./StocksFilters";
import StocksCardsView from "./StocksCardsView";
import StocksTableView from "./StocksTableView";
import StockDetailsDrawer from "./StockDetailsDrawer";
import StockEditDrawer from "./StockEditDrawer";
import LotDetailsDrawer from "@/components/lots/LotDetailsDrawer";
import {
  fetchStockDashboardStats,
  fetchStocksPage,
  updateStock,
} from "@/lib/stock.api";
import { getLotById } from "@/lib/lot.api";
import { listEmballages } from "@/lib/emballages.api";
import { fetchEntrepots } from "@/lib/entrepot.api";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import { useAuthStore } from "@/store/useAuthStore";
import type { Lot } from "@/types/lot";
import {
  mapDashboardStats,
  toStocksServerFilters,
} from "@/lib/stock.filters";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

const SERVER_PAGE_SIZE = 50;

const EMPTY_STATS: StocksStatsType = {
  totalMouvements: 0,
  totalEntrees: 0,
  totalSorties: 0,
  mouvementsToday: 0,
};

const STOCK_SORT_COLUMNS: Record<string, SortColumn<Stock>> = {
  sens: { accessor: (s) => s.sens, type: "string" },
  lot: { accessor: (s) => s.lot?.code_lot, type: "string" },
  entrepot: { accessor: (s) => s.entrepot?.nom ?? s.entrepot?.name, type: "string" },
  quantite: { accessor: (s) => s.quantite, type: "number" },
  date: { accessor: (s) => s.date_stock, type: "date" },
};

const LocalPagination = ({
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
      {totalItems.toLocaleString("fr-FR")} mouvement{totalItems > 1 ? "s" : ""} au total
    </p>
    <div className="flex items-center gap-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
      >
        Précédent
      </button>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-x px-6 border-gray-100">
        Page {currentPage} sur {totalPages}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
        className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
      >
        Suivant
      </button>
    </div>
  </div>
);

export default function StocksClient() {
  const token = useAuthStore((s) => s.token);
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [rows, setRows] = useState<Stock[]>([]);
  const [unitesMesure, setUnitesMesure] = useState<UniteMesure[]>([]);
  const [stats, setStats] = useState<StocksStatsType>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [serverPage, setServerPage] = useState(1);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [serverTotalItems, setServerTotalItems] = useState(0);
  const [filterOptions, setFilterOptions] = useState({
    entrepots: [] as { value: string; label: string }[],
    emballages: [] as { value: string; label: string }[],
    users: [] as { value: string; label: string }[],
  });
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [lotDrawerOpen, setLotDrawerOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [filters, setFilters] = useState<StockFiltersState>({
    search: "",
    entrepot: "",
    emballage: "",
    sens: "",
    user: "",
    sort: "recent",
    dateFrom: "",
    dateTo: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const {
    feedback,
    confirm,
    showSuccess,
    showError,
    clearFeedback,
    closeConfirm,
  } = useAppFeedback();

  const displayViewMode = focusId ? "table" : viewMode;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  const serverFilters = useMemo(
    () => toStocksServerFilters({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch]
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadRefs = async () => {
      try {
        const [entrepots, emballagesRes, unitesRes] = await Promise.all([
          fetchEntrepots({ token }),
          listEmballages(1, 200, { token }),
          listUnitesMesure({ token }),
        ]);
        if (cancelled) return;
        setUnitesMesure(unitesRes.unitesMesure ?? []);
        setFilterOptions({
          entrepots: entrepots.map((e) => ({
            value: String(e.id),
            label: e.nom || `Entrepôt #${e.id}`,
          })),
          emballages: (emballagesRes.emballages.data ?? []).map((e) => ({
            value: String(e.id),
            label: e.name || e.code || `Emballage #${e.id}`,
          })),
          users: [],
        });
      } catch {
        // Les filtres restent utilisables via la recherche texte.
      }
    };

    void loadRefs();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const reloadStocks = useCallback(async () => {
    if (!token) {
      setLoading(false);
      setStatsLoading(false);
      return;
    }

    setLoading(true);
    setStatsLoading(true);
    setLoadError(null);

    try {
      const [pageRes, statsRes] = await Promise.all([
        fetchStocksPage(serverPage, SERVER_PAGE_SIZE, serverFilters, { token }),
        fetchStockDashboardStats(serverFilters, { token }),
      ]);

      setRows(pageRes.data);
      setServerTotalPages(Math.max(1, pageRes.paginatorInfo.lastPage));
      setServerTotalItems(pageRes.paginatorInfo.total);
      setStats(mapDashboardStats(statsRes));

      setFilterOptions((prev) => {
        const users = new Map(prev.users.map((u) => [u.value, u]));
        for (const row of pageRes.data) {
          if (!row.user) continue;
          users.set(String(row.user.id), {
            value: String(row.user.id),
            label: row.user.name || row.user.email || `User #${row.user_id}`,
          });
        }
        return { ...prev, users: Array.from(users.values()) };
      });
    } catch (error) {
      setLoadError(
        getActionErrorMessage(error, "Impossible de charger les mouvements de stock.")
      );
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, [token, serverPage, serverFilters]);

  useEffect(() => {
    void reloadStocks();
  }, [reloadStocks]);

  const handleFiltersChange = (next: StockFiltersState) => {
    setFilters(next);
    setServerPage(1);
  };

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(STOCK_SORT_COLUMNS);

  const displayRows = useMemo(() => {
    if (sortKey) return sortRows(rows);
    return rows;
  }, [rows, sortKey, sortRows]);

  useEffect(() => {
    if (!focusId) return;
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`stock-row-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusId, displayRows]);

  const handleView = (stock: Stock) => {
    setSelectedStock(stock);
    setDrawerOpen(true);
  };

  const handleViewLot = async (stock: Stock) => {
    const lotId = stock.lot_id ?? stock.lot?.id;
    if (!lotId) return;
    clearFeedback();
    try {
      const lot = await getLotById(lotId);
      if (!lot) {
        showError("Lot introuvable.");
        return;
      }
      setSelectedLot(lot);
      setLotDrawerOpen(true);
    } catch (error) {
      showError(getActionErrorMessage(error, "Impossible de charger le lot."));
    }
  };

  const handleSubmitEdit = async (payload: Record<string, unknown>) => {
    if (!editingStock) return;
    clearFeedback();
    try {
      const updated = await updateStock(editingStock.id, payload);
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setEditOpen(false);
      showSuccess("Mouvement modifié.");
      void reloadStocks();
    } catch (error) {
      showError(getActionErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5 pb-20">
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
      <StocksHeader />

      <StocksStats stats={statsLoading ? EMPTY_STATS : stats} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <StocksFilters
            filterOptions={filterOptions}
            filters={filters}
            onChange={handleFiltersChange}
          />
        </div>

        <div className="flex bg-white border-2 border-gray-100 p-1.5 rounded-[20px] shadow-[8px_8px_0px_rgba(0,160,157,0.2)] self-start gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${
              displayViewMode === "grid"
                ? "bg-[#1C2434] text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid size={16} />
            Grille
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${
              displayViewMode === "table"
                ? "bg-[#1C2434] text-white shadow-lg"
                : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <List size={16} />
            Tableau
          </button>
        </div>
      </div>

      {loadError ? (
        <div className="rounded-[2rem] border border-red-100 bg-red-50 px-8 py-10 text-center">
          <p className="text-sm font-bold text-red-600">{loadError}</p>
        </div>
      ) : loading && rows.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-white px-8 py-16 text-center">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-[#00A09D]" />
          <p className="text-sm font-bold text-gray-500">Chargement des mouvements…</p>
        </div>
      ) : displayViewMode === "grid" ? (
        <StocksCardsView
          rows={displayRows}
          unitesMesure={unitesMesure}
          onView={handleView}
          onViewLot={handleViewLot}
        />
      ) : (
        <StocksTableView
          rows={displayRows}
          unitesMesure={unitesMesure}
          focusedId={focusId}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort}
          onView={handleView}
          onViewLot={handleViewLot}
        />
      )}

      {!loadError && (serverTotalPages > 1 || serverTotalItems > 0) && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm">
          <LocalPagination
            currentPage={serverPage}
            totalPages={serverTotalPages}
            totalItems={serverTotalItems}
            onPageChange={setServerPage}
          />
        </div>
      )}

      <StockDetailsDrawer
        stock={selectedStock}
        unitesMesure={unitesMesure}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      <StockEditDrawer
        stock={editingStock}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmitEdit}
      />
      <LotDetailsDrawer
        lot={selectedLot}
        open={lotDrawerOpen}
        onClose={() => setLotDrawerOpen(false)}
      />
    </div>
  );
}
