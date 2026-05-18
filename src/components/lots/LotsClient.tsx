"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type {
  Lot,
  LotFiltersState,
  LotsGroupedByDate,
  LotsStats as LotsStatsType,
} from "@/types/lot";
import LotsHeader from "./LotsHeader";
import LotsStats from "./LotsStats";
import LotsFilters from "./LotsFilters";
import LotsTimelineView from "./LotsTimelineView";
import LotsCardsView from "./LotsCardsView";
import LotDetailsDrawer from "./LotDetailsDrawer";
import LotEditDrawer from "./LotEditDrawer";
import { deleteLot, updateLot, getLots } from "@/lib/lot.api";

interface Props {
  initialLots: Lot[];
  initialPagination: {
    currentPage: number;
    lastPage: number;
  };
}

// Utilitaires de date (Gardés de ton code original)
const isToday = (dateStr?: string | null) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const formatGroupLabel = (dateKey: string) => {
  const date = new Date(dateKey);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Aujourd’hui";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function LotsClient({ initialLots, initialPagination }: Props) {
  // --- ÉTATS ---
  const [rows, setRows] = useState<Lot[]>(initialLots);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");
  
  // UI States
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [filters, setFilters] = useState<LotFiltersState>({
    search: "",
    emballage: "",
    user: "",
    commentOnly: false,
    sort: "recent",
    dateFrom: "",
    dateTo: "",
  });

  // --- LOGIQUE DE PAGINATION & CHARGEMENT ---
  const handlePageChange = async (page: number) => {
    setLoading(true);
    try {
      const response = await getLots(page, 12); 
      setRows(response.data);
      setPagination({
        currentPage: response.currentPage,
        lastPage: response.lastPage
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error("Erreur pagination:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- STATISTIQUES (Basées sur les lignes affichées) ---
  const stats: LotsStatsType = useMemo(() => ({
    totalLots: rows.length,
    totalQuantite: rows.reduce((acc, row) => acc + Number(row.quantite || 0), 0),
    lotsToday: rows.filter(r => isToday(r.date_mvt)).length,
    commentedLots: rows.filter(r => Boolean(r.commentaire?.trim())).length,
  }), [rows]);
const grouped: LotsGroupedByDate[] = useMemo(() => {
  const map = new Map<string, Lot[]>();

  // FORCE LE TRI DES LIGNES REÇUES (Au cas où le serveur a envoyé du désordre)
  const sortedRows = [...rows].sort((a, b) => 
    new Date(b.date_mvt).getTime() - new Date(a.date_mvt).getTime()
  );

  sortedRows.forEach((lot) => {
    const d = new Date(lot.date_mvt);
    const dateKey = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
    
    if (!map.has(dateKey)) map.set(dateKey, []);
    map.get(dateKey)!.push(lot);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateKey, items]) => ({
      dateKey,
      label: formatGroupLabel(dateKey),
      items,
    }));
}, [rows]);
  // --- ACTIONS CALLBACKS ---
  const handleView = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((lot: Lot) => {
    setDrawerOpen(false);
    setEditingLot(lot);
    setEditOpen(true);
  }, []);

  const handleDelete = async (lot: Lot) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le lot ${lot.code_lot} ?`)) return;
    try {
      await deleteLot(lot.id);
      setRows(prev => prev.filter(r => r.id !== lot.id));
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitEdit = async (payload: any) => {
    if (!editingLot) return;
    try {
      const updated = await updateLot(editingLot.id, payload);
      setRows(prev => prev.map(row => (row.id === updated.id ? updated : row)));
      setEditOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`max-w-[1600px] mx-auto space-y-8 pb-20 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
      
      {/* 1. TON HEADER ORIGINAL */}
      <LotsHeader viewMode={viewMode} onChangeView={setViewMode} count={rows.length} />

      {/* 2. TES STATS */}
      <LotsStats stats={stats} />

      {/* 3. TES FILTRES STICKY */}
      <div className="sticky top-4 z-30">
        <LotsFilters rows={rows} filters={filters} onChange={setFilters} />
      </div>

      {/* 4. LE CONTENU (TIMELINE OU CARDS) */}
      <main className="min-h-[400px]">
        {viewMode === "timeline" ? (
          <LotsTimelineView
            groups={grouped}
            pagination={pagination}
            onPageChange={handlePageChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <LotsCardsView
            rows={rows}
            pagination={pagination}
            onPageChange={handlePageChange}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* 5. TES DRAWERS */}
      <LotDetailsDrawer
        lot={selectedLot}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <LotEditDrawer
        lot={editingLot}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
}