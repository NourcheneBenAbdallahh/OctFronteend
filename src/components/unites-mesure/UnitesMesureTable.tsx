"use client";

import { useState, useMemo, useEffect } from "react";
import { Ruler } from "lucide-react";
import type { UniteMesure } from "@/types/unite-mesure";
import { deleteUniteMesure } from "@/lib/unites-mesure.api";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { TablePagination } from "@/components/ui/TablePagination";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";
import { UnitesMesureHeader } from "./UnitesMesureHeader";
import { UnitesMesureListView } from "./UnitesMesureListView";
import UnitesMesureFormModal from "./UnitesMesureFormModal";
import { EMPTY_UNITES_FILTERS, type UnitesMesureFiltersState } from "./unitesMesureFilters";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import { isAdminUser } from "@/lib/access";
import { useAuthStore } from "@/store/useAuthStore";

const PAGE_SIZE = 10;

const UNITE_SORT_COLUMNS: Record<string, SortColumn<UniteMesure>> = {
  code: { accessor: (r) => r.code, type: "string" },
  label: { accessor: (r) => r.label, type: "string" },
  dimension: { accessor: (r) => r.dimension, type: "string" },
  facteur_kg: { accessor: (r) => r.facteur_vers_kg, type: "number" },
  facteur_l: { accessor: (r) => r.facteur_vers_l, type: "number" },
};

interface Props {
  data: UniteMesure[];
  onRefresh: () => void | Promise<void>;
}

export default function UnitesMesureTable({ data, onRefresh }: Props) {
  const [rows, setRows] = useState<UniteMesure[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<UniteMesure | null>(null);
  const [filters, setFilters] = useState<UnitesMesureFiltersState>(EMPTY_UNITES_FILTERS);
  const [page, setPage] = useState(1);
  const userRole = useAuthStore((s) => s.user?.role);
  const canManage = isAdminUser(userRole);
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

  useEffect(() => {
    setRows(data);
  }, [data]);

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(UNITE_SORT_COLUMNS);

  useEffect(() => {
    setPage(1);
  }, [filters, sortKey, sortDirection]);

  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filters.dimension && r.dimension.toLowerCase() !== filters.dimension) {
        return false;
      }
      if (!q) return true;
      return (
        r.code.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.dimension.toLowerCase().includes(q)
      );
    });
  }, [rows, filters]);

  const sortedRows = useMemo(() => sortRows(filteredRows), [filteredRows, sortRows]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, page]);

  const requestDelete = (id: string | number) => {
    const item = rows.find((r) => String(r.id) === String(id));
    if (item) {
      clearFeedback();
      openConfirm({
        title: "Supprimer cette unité ?",
        detail: `${item.code} — ${item.label}`,
        description: "Cette action est définitive.",
        variant: "danger",
        onConfirm: () =>
          void runConfirmedAction(async () => {
            await deleteUniteMesure(id);
            await onRefresh();
            showSuccess("Unité de mesure supprimée.");
          }),
      });
    }
  };

  return (
    <div className="flex flex-col min-h-[600px]">
      <UnitesMesureHeader
        filters={filters}
        onFiltersChange={setFilters}
        total={rows.length}
        filteredCount={filteredRows.length}
        canManage={canManage}
        onOpenNew={() => {
          setEditing(null);
          setIsOpen(true);
        }}
      />

      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />

      <div className="flex-1">
        {filteredRows.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <UnitesMesureListView
              rows={paginatedRows}
              sortKey={sortKey}
              sortDirection={sortDirection}
              onSort={toggleSort}
              canManage={canManage}
              onEdit={(item) => {
                setEditing(item);
                setIsOpen(true);
              }}
              onDelete={requestDelete}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <Ruler size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Aucune unité</h3>
            <p className="text-sm text-gray-400 font-medium">
              {filters.search || filters.dimension
                ? "Modifiez les filtres ou ajoutez une unité."
                : "Ajoutez une première unité de mesure."}
            </p>
          </div>
        )}
      </div>

      {filteredRows.length > 0 && totalPages > 1 && (
        <div className="mt-4 flex justify-center rounded-[2rem] border border-gray-50 bg-white py-6 shadow-sm">
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />

      {isOpen && (
        <UnitesMesureFormModal
          editing={editing}
          onClose={() => setIsOpen(false)}
          onSaved={async () => {
            await onRefresh();
          }}
          onSuccess={(message) => showSuccess(message)}
          onError={(message) => showError(message)}
        />
      )}
    </div>
  );
}
