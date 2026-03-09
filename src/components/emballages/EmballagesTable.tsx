"use client";

import { useState, useEffect } from "react";
import EmballagesRow from "./EmballagesRow";
import EmballagesFilters from "./EmballagesFilters";
import EmballagesFormModal from "./EmballagesFormModal";
import Pagination from "@/components/tables/Pagination";
import {TableEmballages ,  Emballages as APIEmballages,normalizeEmballages
  } from "@/types/emballage";
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

  const totalPages = Math.ceil(total / limit);

  function openCreate() {
    setEditing(null);
    setIsOpen(true);
  }

  function openEdit(item: TableEmballages) {
    setEditing(item);
    setIsOpen(true);
  }

  return (
    <div className="space-y-4">
      <EmballagesFilters onCreate={openCreate} />

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <EmballagesRow
                key={row.id}
                row={row}
                onEdit={openEdit}
                setRows={setRows}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />

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