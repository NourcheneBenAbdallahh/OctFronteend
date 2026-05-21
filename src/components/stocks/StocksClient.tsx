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
import { deleteStock, updateStock } from "@/lib/stock.api";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

interface Props {
  initialStocks: Stock[];
}

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
  const itemsPerPage = viewMode === "grid" ? 6 : 8;

  const filteredRows = useMemo(() => {
    let data = [...rows];
    const q = filters.search.trim().toLowerCase();

    if (q) {
      data = data.filter((stock) => {
        const entrepot = stock.entrepot?.nom || stock.entrepot?.name || "";
        const emballage = stock.emballage?.name || stock.emballage?.code || "";
        const user = stock.user?.name || stock.user?.email || "";
        const lot = stock.lot?.code_lot || "";

        return (
          entrepot.toLowerCase().includes(q) ||
          emballage.toLowerCase().includes(q) ||
          user.toLowerCase().includes(q) ||
          lot.toLowerCase().includes(q) ||
          String(stock.id).includes(q)
        );
      });
    }

    if (filters.entrepot) {
      data = data.filter((stock) => {
        const entrepot = stock.entrepot?.nom || stock.entrepot?.name || "";
        return entrepot === filters.entrepot;
      });
    }

    if (filters.emballage) {
      data = data.filter((stock) => {
        const emballage = stock.emballage?.name || stock.emballage?.code || "";
        return emballage === filters.emballage;
      });
    }

    if (filters.user) {
      data = data.filter((stock) => {
        const user = stock.user?.name || stock.user?.email || "";
        return user === filters.user;
      });
    }

    if (filters.sens) {
      data = data.filter((stock) => stock.sens === filters.sens);
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      data = data.filter((stock) => {
        if (!stock.date_stock) return false;
        return new Date(stock.date_stock) >= from;
      });
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      data = data.filter((stock) => {
        if (!stock.date_stock) return false;
        return new Date(stock.date_stock) <= to;
      });
    }

if (filters.sort === "recent") {
  data.sort(
    (a, b) =>
      new Date(b.date_stock || 0).getTime() -
      new Date(a.date_stock || 0).getTime()
  );
}

if (filters.sort === "oldest") {
  data.sort(
    (a, b) =>
      new Date(a.date_stock || 0).getTime() -
      new Date(b.date_stock || 0).getTime()
  );
}

if (filters.sort === "quantite_desc") {
  data.sort((a, b) => Number(b.quantite || 0) - Number(a.quantite || 0));
}

if (filters.sort === "quantite_asc") {
  data.sort((a, b) => Number(a.quantite || 0) - Number(b.quantite || 0));
}

    return data;
  }, [rows, filters]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage, itemsPerPage]);

  useEffect(() => {
    if (!focusId) return;
    setViewMode("table");
  }, [focusId]);

  useEffect(() => {
    if (!focusId || viewMode !== "table") return;
    const targetIndex = filteredRows.findIndex((row) => String(row.id) === String(focusId));
    if (targetIndex === -1) return;

    const targetPage = Math.floor(targetIndex / itemsPerPage) + 1;
    if (targetPage !== currentPage) {
      setCurrentPage(targetPage);
      return;
    }

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`stock-row-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusId, filteredRows, currentPage, itemsPerPage, viewMode]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, viewMode]);

  const stats: StocksStatsType = useMemo(() => {
    return {
      totalMouvements: rows.length,
      totalEntrees: rows
        .filter((r) => r.sens === "entree")
        .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      totalSorties: rows
        .filter((r) => r.sens === "sortie")
        .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      mouvementsToday: rows.filter((r) => {
        if (!r.date_stock) return false;
        const d = new Date(r.date_stock);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      }).length,
    };
  }, [rows]);

  const handleView = (stock: Stock) => {
    setSelectedStock(stock);
    setDrawerOpen(true);
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

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <StocksFilters rows={rows} filters={filters} onChange={setFilters} />
        </div>

        <div className="flex bg-white border-2 border-gray-100 p-1.5 rounded-[20px] shadow-[8px_8px_0px_rgba(0,160,157,0.2)] self-start gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${
              viewMode === "grid"
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
              viewMode === "table"
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
        {viewMode === "grid" ? (
          <StocksCardsView
            rows={paginatedRows}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <StocksTableView
            rows={paginatedRows}
            focusedId={focusId}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm">
          <LocalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
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
    </div>
  );
}