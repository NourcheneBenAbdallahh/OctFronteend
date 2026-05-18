import React from "react";
import { Edit3, Trash2, Box } from "lucide-react";
import { TableEmballages } from "@/types/emballage";

interface EmballagesGridViewProps {
  rows: TableEmballages[];
  onEdit: (item: TableEmballages) => void;
  onDelete: (id: string | number) => void;
  canManage?: boolean;
  onOpenDetail?: (item: TableEmballages) => void;
}

export function EmballagesGridView({
  rows,
  onEdit,
  onDelete,
  canManage = true,
  onOpenDetail,
}: EmballagesGridViewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => (
        <article
          key={row.id}
          onClick={() => onOpenDetail?.(row)}
          className={`group flex flex-col rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-indigo-100 hover:shadow-md ${
            onOpenDetail ? "cursor-pointer" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Box size={20} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black uppercase tracking-tight text-gray-900">
                  {row.code}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{row.type}</p>
              </div>
            </div>
            <span
              className={`shrink-0 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                row.status === "ACTIVE"
                  ? "border-green-100 bg-green-50 text-green-600"
                  : "border-red-100 bg-red-50 text-red-600"
              }`}
            >
              {row.status}
            </span>
          </div>

          <h3 className="mt-4 line-clamp-2 text-base font-black uppercase leading-snug tracking-tight text-gray-800">
            {row.name}
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
            {row.material || "Matériau non défini"}
          </p>

          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-50 pt-4 text-[10px] font-bold uppercase tracking-wide text-gray-500">
            <div>
              <dt className="text-[8px] text-gray-400">Poids</dt>
              <dd className="mt-0.5 font-black text-gray-900">{row.poids ?? 0} kg</dd>
            </div>
            <div>
              <dt className="text-[8px] text-gray-400">Largeur</dt>
              <dd className="mt-0.5 font-black text-gray-900">{row.largeur ?? 0} cm</dd>
            </div>
            <div>
              <dt className="text-[8px] text-gray-400">Épaiss.</dt>
              <dd className="mt-0.5 font-black text-gray-900">{row.epaisseur_pp ?? 0} μ</dd>
            </div>
          </dl>

          {canManage ? (
            <div
              className="mt-4 flex justify-end gap-2 border-t border-gray-50 pt-4 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => onEdit(row)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-all hover:text-indigo-600"
                aria-label="Modifier"
              >
                <Edit3 size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(row.id)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-all hover:text-red-600"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
