"use client";

import React, { useState, useMemo } from "react";
import { TableInventaire } from "@/types/inventaire";
import Pagination from "@/components/tables/Pagination";

interface Props {
  data: TableInventaire[];
  onEdit?: (item: TableInventaire) => void;
  onDelete?: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export default function InventaireTable({ data, onEdit, onDelete }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  }, [data, currentPage]);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (data.length === 0) return <p className="text-gray-400 italic">Aucun inventaire disponible.</p>;

  return (
    <div className="space-y-4">
      <table className="min-w-full border border-gray-200 rounded-sm overflow-hidden">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="px-4 py-2">Date</th>
            <th className="px-4 py-2">Produit</th>
            <th className="px-4 py-2">Entrepôt</th>
            <th className="px-4 py-2 text-right">Théorique</th>
            <th className="px-4 py-2 text-right">Physique</th>
            <th className="px-4 py-2 text-right">Écart</th>
            {(onEdit || onDelete) && <th className="px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50 border-b">
              <td className="px-4 py-2">{new Date(row.date_inventaire).toLocaleDateString()}</td>
              <td className="px-4 py-2">{row.emballage_name}</td>
              <td className="px-4 py-2">{row.entrepot_name}</td>
              <td className="px-4 py-2 text-right">{row.stock_theorique}</td>
              <td className="px-4 py-2 text-right">{row.stock_physique}</td>
              <td className={`px-4 py-2 text-right ${row.ecart < 0 ? "text-red-600" : row.ecart > 0 ? "text-green-600" : "text-gray-400"}`}>
                {row.ecart > 0 ? `+${row.ecart}` : row.ecart}
              </td>
              {(onEdit || onDelete) && (
                <td className="px-4 py-2 space-x-2">
                  {onEdit && <button className="text-blue-500" onClick={() => onEdit(row)}>Edit</button>}
                  {onDelete && <button className="text-red-500" onClick={() => onDelete(row.id)}>Delete</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}

