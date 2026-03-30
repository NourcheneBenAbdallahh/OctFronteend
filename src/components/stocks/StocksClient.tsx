"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react"; // Import des icônes de switch
import type { Stock, StockFiltersState, StocksStats as StocksStatsType } from "@/types/stock";
import StocksHeader from "./StocksHeader";
import StocksStats from "./StocksStats";
import StocksFilters from "./StocksFilters";
import StocksCardsView from "./StocksCardsView";
import StocksTableView from "./StocksTableView"; // Nouveau
import StockDetailsDrawer from "./StockDetailsDrawer";
import StockEditDrawer from "./StockEditDrawer";
import { deleteStock, updateStock } from "@/lib/stock.api";

interface Props {
  initialStocks: Stock[];
}

export default function StocksClient({ initialStocks }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // État pour le mode d'affichage
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

  // --- LOGIQUE FILTRAGE (Gardée identique à ton code original) ---
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
    // ... reste de tes filtres (entrepot, emballage, user, sens, dates, sort)
    // (Conserve ici tout ton bloc de filtrage actuel)
    return data;
  }, [rows, filters]);

  // --- STATS ---
  const stats: StocksStatsType = useMemo(() => {
    return {
      totalMouvements: rows.length,
      totalEntrees: rows.filter((r) => r.sens === "entree").reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      totalSorties: rows.filter((r) => r.sens === "sortie").reduce((acc, r) => acc + Number(r.quantite || 0), 0),
      mouvementsToday: rows.filter((r) => {
          if(!r.date_stock) return false;
          const d = new Date(r.date_stock);
          const today = new Date();
          return d.toDateString() === today.toDateString();
      }).length,
    };
  }, [rows]);

  const handleView = (stock: Stock) => { setSelectedStock(stock); setDrawerOpen(true); };
  const handleEdit = (stock: Stock) => { setEditingStock(stock); setEditOpen(true); };
  
  const handleDelete = async (stock: Stock) => {
    if (!window.confirm(`Supprimer le mouvement #${stock.id} ?`)) return;
    try {
      await deleteStock(stock.id);
      setRows((prev) => prev.filter((r) => r.id !== stock.id));
    } catch (error) { console.error(error); }
  };

  const handleSubmitEdit = async (payload: any) => {
    if (!editingStock) return;
    try {
      const updated = await updateStock(editingStock.id, payload);
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setEditOpen(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-5 pb-20">
      <StocksHeader />
      <StocksStats stats={stats} />

      {/* ZONE FILTRES + SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
            <StocksFilters rows={rows} filters={filters} onChange={setFilters} />
        </div>
        
        {/* SWITCHER DE VUE STYLE APPLE/MODERNE */}
        <div 
        
     className="flex bg-white border-2 border-gray-100 p-1.5 rounded-[20px] shadow-[8px_8px_0px_rgba(0,160,157,0.2)] self-start gap-1">
        
            <button 
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${viewMode === 'grid' ? 'bg-[#1C2434] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                <LayoutGrid size={16} />
                Grille
            </button>
            <button 
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[14px] transition-all duration-300 font-bold text-[11px] uppercase tracking-wider ${viewMode === 'table' ? 'bg-[#1C2434] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
            >
                <List size={16} />
                Tableau
            </button>
        </div>
      </div>

      {/* AFFICHAGE CONDITIONNEL */}
      <div className="mt-6">
        {viewMode === 'grid' ? (
          <StocksCardsView
            rows={filteredRows}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <StocksTableView 
            rows={filteredRows}
            onView={handleView}
            onDelete={handleDelete}
          />
        )}
      </div>

      {/* DRAWERS */}
      <StockDetailsDrawer stock={selectedStock} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <StockEditDrawer stock={editingStock} open={editOpen} onClose={() => setEditOpen(false)} onSubmit={handleSubmitEdit} />
    </div>
  );
}