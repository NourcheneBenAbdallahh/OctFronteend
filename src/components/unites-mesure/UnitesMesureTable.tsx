"use client";

import { useState, useMemo, useEffect } from "react";
import { Ruler } from "lucide-react";
import type { UniteMesure } from "@/types/unite-mesure";
import { deleteUniteMesure } from "@/lib/unites-mesure.api";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";
import { UnitesMesureHeader } from "./UnitesMesureHeader";
import { UnitesMesureListView } from "./UnitesMesureListView";
import UnitesMesureFormModal from "./UnitesMesureFormModal";

interface Props {
  data: UniteMesure[];
  onRefresh: () => void | Promise<void>;
}

export default function UnitesMesureTable({ data, onRefresh }: Props) {
  const [rows, setRows] = useState<UniteMesure[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<UniteMesure | null>(null);
  const [query, setQuery] = useState("");
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

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.dimension.toLowerCase().includes(q)
    );
  }, [rows, query]);

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
        query={query}
        setQuery={setQuery}
        total={rows.length}
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
              rows={filteredRows}
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
              {query ? "Modifiez votre recherche ou ajoutez une unité." : "Ajoutez une première unité de mesure."}
            </p>
          </div>
        )}
      </div>

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
