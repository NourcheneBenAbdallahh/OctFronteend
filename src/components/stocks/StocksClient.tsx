"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import type {
  Stock,
  StockFiltersState,
  StocksStats as StocksStatsType,
} from "@/types/stock";
import StocksHeader from "./StocksHeader";
import StocksStats from "./StocksStats";
import StocksFilters from "./StocksFilters";
import StocksCardsView from "./StocksCardsView";
import StocksTableView from "./StocksTableView";
import StockDetailsDrawer from "./StockDetailsDrawer";
import StockEditDrawer from "./StockEditDrawer";
import LotDetailsDrawer from "@/components/lots/LotDetailsDrawer";
import { deleteStock, updateStock } from "@/lib/stock.api";
import { getLotById } from "@/lib/lot.api";
import type { Lot } from "@/types/lot";
import {
  applyStockFilters,
  computeStocksStats,
  paginateRows,
  stockTotalPages,
} from "@/lib/stock.filters";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

interface Props {
  initialStocks: Stock[];
}

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
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
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
);

export default function StocksClient({ initialStocks }: Props) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [rows, setRows] = useState<Stock[]>(initialStocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [lotDrawerOpen, setLotDrawerOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const {
    feedback,
    confirm,
    showSuccess,
    showError,
    clearFeedback,
    openConfirm,
    closeConfirm,
    runConfirmedAction,
  } = useAppFeedback();

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [focusPinned, setFocusPinned] = useState(Boolean(focusId));
  const [prevFocusId, setPrevFocusId] = useState(focusId);

  if (focusId !== prevFocusId) {
    setPrevFocusId(focusId);
    setFocusPinned(Boolean(focusId));
  }

  const displayViewMode = focusId ? "table" : viewMode;
  const itemsPerPage = displayViewMode === "grid" ? 6 : 8;

  const handleFiltersChange = (next: StockFiltersState) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    setCurrentPage(1);
  };

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(STOCK_SORT_COLUMNS);

  const filteredRows = useMemo(
    () => applyStockFilters(rows, filters),
    [rows, filters]
  );

  const sortedRows = useMemo(() => {
    if (sortKey) return sortRows(filteredRows);
    return filteredRows;
  }, [filteredRows, sortKey, sortRows]);

  const focusTargetPage = useMemo(() => {
    if (!focusId || displayViewMode !== "table") return null;
    const targetIndex = sortedRows.findIndex(
      (row) => String(row.id) === String(focusId)
    );
    if (targetIndex === -1) return null;
    return Math.floor(targetIndex / itemsPerPage) + 1;
  }, [focusId, sortedRows, itemsPerPage, displayViewMode]);

  const activePage =
    focusPinned && focusTargetPage !== null ? focusTargetPage : currentPage;
  const totalPages = stockTotalPages(sortedRows.length, itemsPerPage);

  const paginatedRows = useMemo(
    () => paginateRows(sortedRows, activePage, itemsPerPage),
    [sortedRows, activePage, itemsPerPage]
  );

  useEffect(() => {
    if (!focusId || focusTargetPage === null) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`stock-row-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusId, focusTargetPage, sortedRows]);

  const stats: StocksStatsType = useMemo(
    () => computeStocksStats(rows),
    [rows]
  );

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

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setEditOpen(true);
  };

  const handleDelete = (stock: Stock) => {
    clearFeedback();
    openConfirm({
      title: "Supprimer ce mouvement ?",
      detail: `Mouvement #${stock.id}`,
      description: "Cette action est définitive.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await deleteStock(stock.id);
          setRows((prev) => prev.filter((r) => r.id !== stock.id));
          showSuccess("Mouvement supprimé.");
        }),
    });
  };

  const handleSubmitEdit = async (payload: any) => {
    if (!editingStock) return;
    clearFeedback();
    try {
      const updated = await updateStock(editingStock.id, payload);
      setRows((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );
      setEditOpen(false);
      showSuccess("Mouvement modifié.");
    } catch (error) {
      showError(getActionErrorMessage(error));
    }
  };

  return (
    <div className="space-y-5 pb-20">
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
      <StocksHeader />
      <StocksStats stats={stats} />

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <StocksFilters rows={rows} filters={filters} onChange={handleFiltersChange} />
        </div>

        <div className="flex bg-white border-2 border-gray-100 p-1.5 rounded-[20px] shadow-[8px_8px_0px_rgba(0,160,157,0.2)] self-start gap-1">
          <button
            onClick={() => handleViewModeChange("grid")}
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
            onClick={() => handleViewModeChange("table")}
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

      <div className="mt-6">
        {displayViewMode === "grid" ? (
          <StocksCardsView
            rows={paginatedRows}
            onView={handleView}
            onViewLot={handleViewLot}
          />
        ) : (
          <StocksTableView
            rows={paginatedRows}
            focusedId={focusId}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={toggleSort}
            onView={handleView}
            onViewLot={handleViewLot}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm">
          <LocalPagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setFocusPinned(false);
              setCurrentPage(page);
            }}
          />
        </div>
      )}

      <StockDetailsDrawer
        stock={selectedStock}
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