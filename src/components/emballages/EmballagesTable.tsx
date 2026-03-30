"use client";

import { useState, useMemo, useEffect } from "react";
import { EmballagesHeader } from "./EmballagesHeader";
import { EmballagesListView } from "./EmballagesListView";
import EmballagesFormModal from "./EmballagesFormModal";
import Pagination from "@/components/tables/Pagination";
import { TableEmballages } from "@/types/emballage";
import { deleteEmballages } from "@/lib/emballages.api";
import { BoxSelect } from "lucide-react";

interface Props {
  data: TableEmballages[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function EmballagesTable({ data, total, page, limit, onPageChange }: Props) {
  const [rows, setRows] = useState<TableEmballages[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableEmballages | null>(null);
  const [query, setQuery] = useState("");

  // Synchronisation avec les données serveur (quand on change de page)
  useEffect(() => {
    setRows(data);
  }, [data]);

  // Filtrage local pour une recherche instantanée
  const filteredRows = useMemo(() => {
    return rows.filter(r =>
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.code.toLowerCase().includes(query.toLowerCase()) ||
      r.material?.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  const totalPages = Math.ceil(total / limit);

  async function handleDelete(id: string | number) {
    if (!confirm("Voulez-vous vraiment supprimer ce modèle d'emballage ?")) return;
    try {
      await deleteEmballages(id);
      setRows(prev => prev.filter(r => r.id !== id));
    } catch {
      alert("Erreur lors de la suppression. L'emballage est peut-être lié à un contrat.");
    }
  }

  return (
    <div className="flex flex-col min-h-[600px]">
      {/* HEADER : Titre, Stats et Barre de recherche */}
      <EmballagesHeader
        query={query} 
        setQuery={setQuery}
        total={total}
        onOpenNew={() => { 
          setEditing(null); 
          setIsOpen(true); 
        }}
      />

      {/* LISTE : Table stylisée ou état vide */}
      <div className="flex-1">
        {filteredRows.length > 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <EmballagesListView
              rows={filteredRows}
              onEdit={(item: TableEmballages) => { 
                setEditing(item); 
                setIsOpen(true); 
              }}
              onDelete={handleDelete}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200">
            <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
              <BoxSelect size={32} />
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Aucun emballage trouvé</h3>
            <p className="text-sm text-gray-400 font-medium">Essayez de modifier votre recherche ou créez un nouveau modèle.</p>
          </div>
        )}
      </div>

      {/* PAGINATION : Design épuré */}
{totalPages > 1 && !query && (
  <div className="mt-10 flex justify-center items-center gap-8 py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm">
    <Pagination
      currentPage={page}
      totalPages={totalPages}
      onPageChange={onPageChange}
    />
    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l pl-8 border-gray-100">
      {/* Traduction ici */}
      Page {page} sur {totalPages}
    </div>
  </div>
)}

      {/* FORMULAIRE : Le Drawer latéral */}
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