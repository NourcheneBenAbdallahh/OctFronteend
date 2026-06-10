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
import { getAllLots } from "@/lib/lot.api";
import {
  applyLotFilters,
  EMPTY_LOT_FILTERS,
  lotTotalPages,
  paginateLotRows,
} from "@/lib/lot.filters";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { useAppFeedback } from "@/hooks/useAppFeedback";

interface Props {
  initialLots: Lot[];
  initialPagination: {
    currentPage: number;
    lastPage: number;
  };
}

const ITEMS_PER_PAGE = 12;

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
  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function LotsClient({ initialLots }: Props) {
  const [rows, setRows] = useState<Lot[]>(initialLots);
  const [loading, setLoading] = useState(initialLots.length === 0);
  const [viewMode, setViewMode] = useState<"timeline" | "cards">("timeline");
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { feedback, clearFeedback } = useAppFeedback();

  const [filters, setFilters] = useState<LotFiltersState>(EMPTY_LOT_FILTERS);

  useEffect(() => {
    let cancelled = false;
    void getAllLots()
      .then((all) => {
        if (!cancelled && all.length > 0) setRows(all);
      })
      .catch((error) => console.error("Erreur chargement lots:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFiltersChange = (next: LotFiltersState) => {
    setFilters(next);
    setCurrentPage(1);
  };

  const filteredRows = useMemo(
    () => applyLotFilters(rows, filters),
    [rows, filters]
  );

  const totalPages = lotTotalPages(filteredRows.length, ITEMS_PER_PAGE);

  const paginatedRows = useMemo(
    () => paginateLotRows(filteredRows, currentPage, ITEMS_PER_PAGE),
    [filteredRows, currentPage]
  );

  const stats: LotsStatsType = useMemo(
    () => ({
      totalLots: filteredRows.length,
      totalQuantite: filteredRows.reduce(
        (acc, row) => acc + Number(row.quantite || 0),
        0
      ),
      lotsToday: filteredRows.filter((r) => isToday(r.date_mvt)).length,
      commentedLots: filteredRows.filter((r) =>
        Boolean(r.commentaire?.trim())
      ).length,
    }),
    [filteredRows]
  );

  const grouped: LotsGroupedByDate[] = useMemo(() => {
    const map = new Map<string, Lot[]>();

    paginatedRows.forEach((lot) => {
      const d = new Date(lot.date_mvt);
      const dateKey = new Date(
        d.getFullYear(),
        d.getMonth(),
        d.getDate()
      ).toISOString();

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
  }, [paginatedRows]);

  const handleView = useCallback((lot: Lot) => {
    setSelectedLot(lot);
    setDrawerOpen(true);
  }, []);

  const pagination = {
    currentPage,
    lastPage: totalPages,
  };

  return (
    <div
      className={`max-w-[1600px] mx-auto space-y-8 pb-20 transition-opacity duration-300 ${loading ? "opacity-50" : "opacity-100"}`}
    >
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />

      <LotsHeader
        viewMode={viewMode}
        onChangeView={setViewMode}
        count={filteredRows.length}
      />

      <LotsStats stats={stats} />

      <div className="sticky top-4 z-30 min-w-0">
        <LotsFilters rows={rows} filters={filters} onChange={handleFiltersChange} />
      </div>

      <main className="min-h-[400px]">
        {viewMode === "timeline" ? (
          <LotsTimelineView
            groups={grouped}
            pagination={pagination}
            onPageChange={setCurrentPage}
            onView={handleView}
          />
        ) : (
          <LotsCardsView
            rows={paginatedRows}
            pagination={pagination}
            onPageChange={setCurrentPage}
            onView={handleView}
          />
        )}
      </main>

      <LotDetailsDrawer
        lot={selectedLot}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
