import React from "react";
import { Edit3, Trash2 } from "lucide-react";
import type { UniteMesure } from "@/types/unite-mesure";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh, type TableSortHeaderProps } from "@/components/ui/SortableTableHeader";

const DIMENSION_LABELS: Record<string, string> = {
  masse: "Masse",
  volume: "Volume",
  nombre: "Nombre",
  surface: "Surface",
};

function dimClass(d: string) {
  const x = d.toLowerCase();
  if (x === "masse") return "bg-amber-50 text-amber-700 border-amber-100";
  if (x === "volume") return "bg-sky-50 text-sky-700 border-sky-100";
  if (x === "surface") return "bg-violet-50 text-violet-700 border-violet-100";
  return "bg-gray-50 text-gray-700 border-gray-100";
}

function dimensionLabel(d: string) {
  return DIMENSION_LABELS[d.toLowerCase()] ?? d;
}

function fmtFactor(v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  return String(v);
}

export const UnitesMesureListView = ({
  rows,
  onEdit,
  onDelete,
  canManage = true,
  sortKey,
  sortDirection,
  onSort,
}: {
  rows: UniteMesure[];
  onEdit: (row: UniteMesure) => void;
  onDelete: (id: string | number) => void;
  canManage?: boolean;
} & TableSortHeaderProps) => (
  <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
    <ResponsiveTableWrap>
    <table className="w-full min-w-[680px] text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <SortableTh columnKey="code" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Code</SortableTh>
          <SortableTh columnKey="label" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Libellé</SortableTh>
          <SortableTh columnKey="dimension" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Dimension</SortableTh>
          <SortableTh columnKey="facteur_kg" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Facteur → kg</SortableTh>
          <SortableTh columnKey="facteur_l" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort} className="px-8 py-6">Facteur → L</SortableTh>
          {canManage ? <th className="px-8 py-6 text-center">Actions</th> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-gray-50/50 group transition-all">
            <td className="px-8 py-6">
              <span className="text-sm font-black text-gray-900 tracking-tight font-mono">{row.code}</span>
            </td>
            <td className="px-8 py-6">
              <div className="font-black text-gray-800 text-sm">{row.label}</div>
            </td>
            <td className="px-8 py-6">
              <span
                className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${dimClass(
                  row.dimension
                )}`}
              >
                {dimensionLabel(row.dimension)}
              </span>
            </td>
            <td className="px-8 py-6 text-sm font-bold text-gray-800">{fmtFactor(row.facteur_vers_kg)}</td>
            <td className="px-8 py-6 text-sm font-bold text-gray-800">{fmtFactor(row.facteur_vers_l)}</td>
            {canManage ? (
              <td className="px-8 py-6 text-center">
                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    type="button"
                    onClick={() => onEdit(row)}
                    className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(row.id)}
                    className="h-9 w-9 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-red-600 rounded-xl transition-all shadow-sm"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            ) : null}
          </tr>
        ))}
      </tbody>
    </table>
    </ResponsiveTableWrap>
  </div>
);
