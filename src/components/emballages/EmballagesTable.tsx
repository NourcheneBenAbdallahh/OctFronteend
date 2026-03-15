"use client";

import { useState, useMemo, useEffect } from "react";
import { EmballagesHeader } from "./EmballagesHeader";
import { EmballagesListView } from "./EmballagesListView";
import EmballagesFormModal from "./EmballagesFormModal";
import Pagination from "@/components/tables/Pagination";
import { TableEmballages } from "@/types/emballage";
import { deleteEmballages } from "@/lib/emballages.api";

interface Props {
  data: TableEmballages[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}
export default function EmballagesTable({ 
  data, 
  total, 
  page, 
  limit, 
  onPageChange 
}: Props) {
  const [rows, setRows] = useState<TableEmballages[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableEmballages | null>(null);
  const [query, setQuery] = useState("");

  // Mettre à jour les données quand les props changent
  useEffect(() => {
    setRows(data);
  }, [data]);

  const filteredRows = useMemo(() => {
    return rows.filter(r => 
      r.name.toLowerCase().includes(query.toLowerCase()) || 
      r.code.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  // Afficher les données filtrées ou toutes les données
  const displayRows = query ? filteredRows : rows;

  // Pagination globale basée sur le total
  const totalPages = Math.ceil(total / limit);

  const handlePageChange = (newPage: number) => {
    onPageChange(newPage);
  };

  async function handleDelete(id: string | number) {
    if (!confirm("Supprimer cet emballage ?")) return;
    try {
      await deleteEmballages(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch { alert("Erreur lors de la suppression"); }
  }

  return (
    <div className="flex flex-col">
      <EmballagesHeader 
        query={query} setQuery={setQuery} 
        onOpenNew={() => { setEditing(null); setIsOpen(true); }} 
      />

      <div className="overflow-x-auto">
        <EmballagesListView 
          rows={displayRows} 
          onEdit={(item) => { setEditing(item); setIsOpen(true); }} 
          onDelete={handleDelete} 
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center py-4 border-t">
          <Pagination 
            currentPage={page} 
            totalPages={totalPages} 
            onPageChange={handlePageChange} 
          />
        </div>
      )}

      {isOpen && (
        <EmballagesFormModal
          editing={editing}
          setRows={setRows}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
