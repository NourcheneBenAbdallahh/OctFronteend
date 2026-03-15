"use client";

import { useMemo, useState } from "react";
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

function formatGroupLabel(dateKey: string) {
  const date = new Date(dateKey);
  const today = new Date();

  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (sameDay) return "Aujourd’hui";

  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normalizeDateStart(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`);
}

function normalizeDateEnd(dateStr: string) {
  return new Date(`${dateStr}T23:59:59`);
}

export default function LotsClient({ initialLots }: Props) {
  const [rows, setRows] = useState<Lot[]>(initialLots);
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");

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
      data = data.filter(
        (lot) =>
          String(lot.emballage?.id || lot.emballage_id) === filters.emballage
      );
    }

    if (filters.user) {
      data = data.filter(
        (lot) => String(lot.user?.id || lot.user_id) === filters.user
      );
    }

    if (filters.commentOnly) {
      data = data.filter((lot) => Boolean(lot.commentaire?.trim()));
    }

    if (filters.dateFrom) {
      const from = normalizeDateStart(filters.dateFrom);
      data = data.filter((lot) => new Date(lot.date_mvt) >= from);
    }

    if (filters.dateTo) {
      const to = normalizeDateEnd(filters.dateTo);
      data = data.filter((lot) => new Date(lot.date_mvt) <= to);
    }

    data.sort((a, b) => {
      if (filters.sort === "recent") {
        return new Date(b.date_mvt).getTime() - new Date(a.date_mvt).getTime();
      }

      if (filters.sort === "oldest") {
        return new Date(a.date_mvt).getTime() - new Date(b.date_mvt).getTime();
      }

      if (filters.sort === "qty_desc") {
        return Number(b.quantite) - Number(a.quantite);
      }

      return Number(a.quantite) - Number(b.quantite);
    });

    return data;
  }, [rows, filters]);

  const stats: LotsStatsType = useMemo(() => {
    return {
      totalLots: rows.length,
      totalQuantite: rows.reduce(
        (acc, row) => acc + Number(row.quantite || 0),
        0
      ),
      lotsToday: rows.filter((r) => isToday(r.date_mvt)).length,
      commentedLots: rows.filter((r) => Boolean(r.commentaire?.trim())).length,
    };
  }, [rows]);

  const grouped: LotsGroupedByDate[] = useMemo(() => {
    const map = new Map<string, Lot[]>();

    filteredRows.forEach((lot) => {
      const d = new Date(lot.date_mvt);
      const dateKey = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).toISOString();

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }

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

  const handleSubmitEdit = async (payload: {
    code_lot: string;
    emballage_id: string | number;
    quantite: number;
    date_mvt: string;
    commentaire: string;
    user_id?: string | number | null;
  }) => {
    if (!editingLot) return;

    try {
      const updated = await updateLot(editingLot.id, {
        code_lot: payload.code_lot,
        emballage_id: payload.emballage_id,
        quantite: payload.quantite,
        date_mvt: payload.date_mvt,
        commentaire: payload.commentaire,
        user_id: payload.user_id ?? null,
      });

      setRows((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row))
      );

      if (selectedLot?.id === updated.id) {
        setSelectedLot(updated);
      }

      setEditOpen(false);
      setEditingLot(null);
    } catch (error) {
      console.error(error);
      window.alert("Erreur lors de la mise à jour du lot.");
    }
  };

  const handleDelete = async (lot: Lot) => {
    const ok = window.confirm(`Supprimer le lot ${lot.code_lot} ?`);
    if (!ok) return;

    try {
      await deleteLot(lot.id);

      setRows((prev) => prev.filter((r) => r.id !== lot.id));

      if (selectedLot?.id === lot.id) {
        setDrawerOpen(false);
        setSelectedLot(null);
      }

      if (editingLot?.id === lot.id) {
        setEditOpen(false);
        setEditingLot(null);
      }
    } catch (error) {
      console.error(error);
      window.alert("Erreur lors de la suppression du lot.");
    }
  };

  const handleView = (lot: Lot) => {
    setSelectedLot(lot);
    setDrawerOpen(true);
  };

  const handleEdit = (lot: Lot) => {
    setDrawerOpen(false);
    setSelectedLot(null);
    setEditingLot(lot);
    setEditOpen(true);
  };

  return (
    <div className="space-y-5">
      <LotsHeader viewMode={viewMode} onChangeView={setViewMode} />

      <LotsStats stats={stats} />

      <LotsFilters rows={rows} filters={filters} onChange={setFilters} />

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