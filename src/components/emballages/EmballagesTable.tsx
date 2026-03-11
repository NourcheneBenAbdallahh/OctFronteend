"use client";

import { useState, useMemo, useEffect } from "react";
import { EmballagesHeader } from "./EmballagesHeader";
import { EmballagesListView } from "./EmballagesListView";
import EmballagesFormModal from "./EmballagesFormModal";
import Pagination from "@/components/tables/Pagination";
import { TableEmballages } from "@/types/emballage";
import { deleteEmballages } from "@/lib/emballages.api";

const ITEMS_PER_PAGE = 10;
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
}: Props) {  const [rows, setRows] = useState<TableEmballages[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableEmballages | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredRows = useMemo(() => {
    return rows.filter(r => 
      r.name.toLowerCase().includes(query.toLowerCase()) || 
      r.code.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [query]);

  async function handleDelete(id: string | number) {
    if (!confirm("Supprimer cet emballage ?")) return;
    try {
      await deleteEmballages(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch { alert("Erreur lors de la suppression"); }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
      <EmballagesHeader 
        query={query} setQuery={setQuery} 
        onOpenNew={() => { setEditing(null); setIsOpen(true); }} 
      />

      <EmballagesListView 
        rows={paginatedRows} 
        onEdit={(item) => { setEditing(item); setIsOpen(true); }} 
        onDelete={handleDelete} 
      />

      {totalPages > 1 && (
        <div className="flex justify-center py-4 bg-white border-t">
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
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