"use client";

import { useMemo, useState, useCallback } from "react";
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
import { deleteLot, updateLot } from "@/lib/lot.api";

interface Props {
  initialLots: Lot[];
}

// Utilitaires de date déplacés à l'extérieur pour éviter la recréation
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
  const sameDay = date.toDateString() === today.toDateString();

  if (sameDay) return "Aujourd’hui";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function LotsClient({ initialLots }: Props) {
  // --- ÉTATS ---
  const [rows, setRows] = useState<Lot[]>(initialLots);
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

  // --- LOGIQUE DE FILTRAGE ---
  const filteredRows = useMemo(() => {
    let data = [...rows];
    const q = filters.search.trim().toLowerCase();

    if (q) {
      data = data.filter((lot) => {
        const emb = lot.emballage?.name || lot.emballage?.code || "";
        const usr = lot.user?.name || lot.user?.email || "";
        return (
          lot.code_lot.toLowerCase().includes(q) ||
          emb.toLowerCase().includes(q) ||
          usr.toLowerCase().includes(q) ||
          (lot.commentaire || "").toLowerCase().includes(q)
        );
      });
    }

    if (filters.emballage) {
      data = data.filter(l => String(l.emballage?.id || l.emballage_id) === filters.emballage);
    }

    if (filters.user) {
      data = data.filter(l => String(l.user?.id || l.user_id) === filters.user);
    }

    if (filters.commentOnly) {
      data = data.filter(l => Boolean(l.commentaire?.trim()));
    }

    if (filters.dateFrom) {
      const from = new Date(`${filters.dateFrom}T00:00:00`);
      data = data.filter(l => new Date(l.date_mvt) >= from);
    }

    if (filters.dateTo) {
      const to = new Date(`${filters.dateTo}T23:59:59`);
      data = data.filter(l => new Date(l.date_mvt) <= to);
    }

    // Tri
    data.sort((a, b) => {
      const dateA = new Date(a.date_mvt).getTime();
      const dateB = new Date(b.date_mvt).getTime();
      if (filters.sort === "recent") return dateB - dateA;
      if (filters.sort === "oldest") return dateA - dateB;
      if (filters.sort === "qty_desc") return Number(b.quantite) - Number(a.quantite);
      return Number(a.quantite) - Number(b.quantite);
    });

    return data;
  }, [rows, filters]);

  // --- STATISTIQUES ---
  const stats: LotsStatsType = useMemo(() => ({
    totalLots: rows.length,
    totalQuantite: rows.reduce((acc, row) => acc + Number(row.quantite || 0), 0),
    lotsToday: rows.filter(r => isToday(r.date_mvt)).length,
    commentedLots: rows.filter(r => Boolean(r.commentaire?.trim())).length,
  }), [rows]);

  // --- GROUPEMENT POUR LA TIMELINE ---
  const grouped: LotsGroupedByDate[] = useMemo(() => {
    const map = new Map<string, Lot[]>();
    filteredRows.forEach((lot) => {
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
  }, [filteredRows]);

  // --- ACTIONS (CALLBACKS) ---
  const handleView = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    setDrawerOpen(true);
  }, []);

  const handleEdit = useCallback((lot: Lot) => {
    setDrawerOpen(false); // Ferme le détail si on passe en édition
    setEditingLot(lot);
    setEditOpen(true);
  }, []);

  const handleSubmitEdit = async (payload: any) => {
    if (!editingLot) return;
    try {
      const updated = await updateLot(editingLot.id, payload);
      
      // Mise à jour optimiste de l'UI
      setRows(prev => prev.map(row => (row.id === updated.id ? updated : row)));
      
      // Si le lot était aussi sélectionné dans le drawer de détails
      if (selectedLot?.id === updated.id) setSelectedLot(updated);
      
      setEditOpen(false);
      setEditingLot(null);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleDelete = async (lot: Lot) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer le lot ${lot.code_lot} ?`)) return;
    try {
      await deleteLot(lot.id);
      setRows(prev => prev.filter(r => r.id !== lot.id));
      if (selectedLot?.id === lot.id) setDrawerOpen(false);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* En-tête avec switch de vue */}
      <LotsHeader viewMode={viewMode} onChangeView={setViewMode} count={filteredRows.length} />

      {/* Cartes de statistiques en haut */}
      <LotsStats stats={stats} />

      {/* Barre de recherche et filtres avancés */}
      <div className="sticky top-4 z-30 transition-all duration-300">
        <LotsFilters rows={rows} filters={filters} onChange={setFilters} />
      </div>

      {/* Rendu de la vue sélectionnée */}
      <main className="min-h-[400px]">
        {viewMode === "timeline" ? (
          <LotsTimelineView
            groups={grouped}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <LotsCardsView
            rows={filteredRows}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        
        {/* État vide */}
        {filteredRows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200">
             <p className="text-[#1C2434] font-black uppercase tracking-widest opacity-30">Aucun lot ne correspond à votre recherche</p>
          </div>
        )}
      </main>

      {/* Drawers (Modaux latéraux) */}
      <LotDetailsDrawer
        lot={selectedLot}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedLot(null);
        }}
      />

      <LotEditDrawer
        lot={editingLot}
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingLot(null);
        }}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
}