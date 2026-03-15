"use client";

import { useMemo, useState } from "react";
import type { Stock, StockFiltersState, StocksStats as StocksStatsType } from "@/types/stock";
import StocksHeader from "./StocksHeader";
import StocksStats from "./StocksStats";
import StocksFilters from "./StocksFilters";
import StocksCardsView from "./StocksCardsView";
import StockDetailsDrawer from "./StockDetailsDrawer";
import StockEditDrawer from "./StockEditDrawer";
import { deleteStock, updateStock } from "@/lib/stock.api";

interface Props {
  initialStocks: Stock[];
}

function isToday(dateStr?: string | null) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function normalizeDateStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function normalizeDateEnd(dateStr: string) {
  return new Date(`${dateStr}T23:59:59`);
}

export default function StocksClient({ initialStocks }: Props) {
  const [rows, setRows] = useState<Stock[]>(initialStocks);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const filteredRows = useMemo(() => {
    let data = [...rows];
    const q = filters.search.trim().toLowerCase();

    if (q) {
      data = data.filter((stock) => {
        const entrepot =
          stock.entrepot?.nom || stock.entrepot?.name || "";
        const emballage =
          stock.emballage?.name || stock.emballage?.code || "";
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
      data = data.filter(
        (stock) => String(stock.entrepot?.id || stock.entrepot_id) === filters.entrepot
      );
    }

    if (filters.emballage) {
      data = data.filter(
        (stock) => String(stock.emballage?.id || stock.emballage_id) === filters.emballage
      );
    }

    if (filters.user) {
      data = data.filter(
        (stock) => String(stock.user?.id || stock.user_id) === filters.user
      );
    }

    if (filters.sens) {
      data = data.filter((stock) => stock.sens === filters.sens);
    }

    if (filters.dateFrom) {
      const from = normalizeDateStart(filters.dateFrom);
      data = data.filter((stock) => new Date(stock.date_stock) >= from);
    }

    if (filters.dateTo) {
      const to = normalizeDateEnd(filters.dateTo);
      data = data.filter((stock) => new Date(stock.date_stock) <= to);
    }

    data.sort((a, b) => {
      if (filters.sort === "recent") {
        return new Date(b.date_stock).getTime() - new Date(a.date_stock).getTime();
      }

      if (filters.sort === "oldest") {
        return new Date(a.date_stock).getTime() - new Date(b.date_stock).getTime();
      }

      if (filters.sort === "quantite_desc") {
        return Number(b.quantite) - Number(a.quantite);
      }

      return Number(a.quantite) - Number(b.quantite);
    });

    return data;
  }, [rows, filters]);

  const stats: StocksStatsType = useMemo(() => {
    return {
      totalMouvements: rows.length,
      totalEntrees: rows
        .filter((r) => r.sens === "entree")
        .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      totalSorties: rows
        .filter((r) => r.sens === "sortie")
        .reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      mouvementsToday: rows.filter((r) => isToday(r.date_stock)).length,
    };
  }, [rows]);

  const handleView = (stock: Stock) => {
    setSelectedStock(stock);
    setDrawerOpen(true);
  };

  const handleEdit = (stock: Stock) => {
    setDrawerOpen(false);
    setSelectedStock(null);
    setEditingStock(stock);
    setEditOpen(true);
  };

  const handleDelete = async (stock: Stock) => {
    const ok = window.confirm(`Supprimer le mouvement #${stock.id} ?`);
    if (!ok) return;

    try {
      await deleteStock(stock.id);
      setRows((prev) => prev.filter((r) => r.id !== stock.id));

      if (selectedStock?.id === stock.id) {
        setDrawerOpen(false);
        setSelectedStock(null);
      }

      if (editingStock?.id === stock.id) {
        setEditOpen(false);
        setEditingStock(null);
      }
    } catch (error) {
      console.error(error);
      window.alert("Erreur lors de la suppression du mouvement.");
    }
  };

  const handleSubmitEdit = async (payload: {
    entrepot_id: string | number;
    emballage_id: string | number;
    lot_id?: string | number | null;
    date_stock: string;
    quantite: number;
    sens: "entree" | "sortie";
    user_id?: string | number | null;
  }) => {
    if (!editingStock) return;

    try {
      const updated = await updateStock(editingStock.id, payload);

      setRows((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );

      if (selectedStock?.id === updated.id) {
        setSelectedStock(updated);
      }

      setEditOpen(false);
      setEditingStock(null);
    } catch (error) {
      console.error(error);
      window.alert("Erreur lors de la mise à jour du mouvement.");
    }
  };

  return (
    <div className="space-y-5">
      <StocksHeader />
      <StocksStats stats={stats} />
      <StocksFilters rows={rows} filters={filters} onChange={setFilters} />

      <StocksCardsView
        rows={filteredRows}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <StockDetailsDrawer
        stock={selectedStock}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedStock(null);
        }}
      />

      <StockEditDrawer
        stock={editingStock}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingStock(null);
        }}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
}