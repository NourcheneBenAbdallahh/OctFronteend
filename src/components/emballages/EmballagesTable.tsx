"use client";

import { useState, useMemo, useEffect } from "react";
import { EmballagesHeader } from "./EmballagesHeader";
import { EmballagesListView } from "./EmballagesListView";
import { EmballagesGridView } from "./EmballagesGridView";
import EmballagesFormModal from "./EmballagesFormModal";
import EmballagesDetailsDrawer from "./EmballagesDetailsDrawer";
import { TableEmballages } from "@/types/emballage";
import { deleteEmballages } from "@/lib/emballages.api";
import { BoxSelect } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { canManageEmballagesCatalog } from "@/lib/access";

interface Props {
  data: TableEmballages[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
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
      disabled={currentPage === totalPages}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Suivant
    </button>
  </div>
);

export default function EmballagesTable({
  data,
  total,
  page,
  limit,
  onPageChange,
}: Props) {
  const [rows, setRows] = useState<TableEmballages[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableEmballages | null>(null);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [detailItem, setDetailItem] = useState<TableEmballages | null>(null);
  const userRole = useAuthStore((s) => s.user?.role);
  const canManage = canManageEmballagesCatalog(userRole);

  useEffect(() => {
    setRows(data);
  }, [data]);

  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.code.toLowerCase().includes(query.toLowerCase()) ||
        r.material?.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  const totalPages = Math.ceil(total / limit);

  async function handleDelete(id: string | number) {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle d'emballage ?"))
      return;

    try {
      await deleteEmballages(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (detailItem != null && String(detailItem.id) === String(id)) {
        setDetailItem(null);
      }
    } catch {
      alert(
        "Erreur lors de la suppression. L'emballage est peut-être lié à un contrat."
      );
    }
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      <EmballagesHeader
        query={query}
        setQuery={setQuery}
        total={total}
        canManage={canManage}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenNew={() => {
          setDetailItem(null);
          setEditing(null);
          setIsOpen(true);
        }}
      />

      <div className="flex-1">
        {filteredRows.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {viewMode === "list" ? (
              <EmballagesListView
                rows={filteredRows}
                canManage={canManage}
                onOpenDetail={setDetailItem}
                onEdit={(item: TableEmballages) => {
                  setDetailItem(null);
                  setEditing(item);
                  setIsOpen(true);
                }}
                onDelete={handleDelete}
              />
            ) : (
              <EmballagesGridView
                rows={filteredRows}
                canManage={canManage}
                onOpenDetail={setDetailItem}
                onEdit={(item: TableEmballages) => {
                  setDetailItem(null);
                  setEditing(item);
                  setIsOpen(true);
                }}
                onDelete={handleDelete}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <BoxSelect size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">
              Aucun emballage trouvé
            </h3>
            <p className="text-sm text-gray-400 font-medium">
              {canManage
                ? "Essayez de modifier votre recherche ou créez un nouveau modèle."
                : "Essayez de modifier votre recherche."}
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && !query && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <LocalPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <EmballagesDetailsDrawer
        emballage={detailItem}
        open={detailItem != null}
        onClose={() => setDetailItem(null)}
        canManage={canManage}
        onRequestEdit={
          canManage
            ? (item) => {
                setEditing(item);
                setIsOpen(true);
              }
            : undefined
        }
      />

      {canManage && isOpen && (
        <EmballagesFormModal
          editing={editing}
          setRows={setRows}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}