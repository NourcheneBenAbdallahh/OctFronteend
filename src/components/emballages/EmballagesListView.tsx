import React from "react";
import { Edit3, Trash2, Maximize2, Weight, Layers } from "lucide-react";
import { TableEmballages } from "@/types/emballage";

interface EmballagesListViewProps {
  rows: TableEmballages[];
  onEdit: (item: TableEmballages) => void;
  onDelete: (id: string | number) => void;
  canManage?: boolean;
  onOpenDetail?: (item: TableEmballages) => void;
}

export const EmballagesListView = ({
  rows,
  onEdit,
  onDelete,
  canManage = true,
  onOpenDetail,
}: EmballagesListViewProps) => (
  <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left border-collapse">
      <thead>
        <tr className="border-b border-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <th className="px-8 py-6">Code</th>
          <th className="px-8 py-6">Désignation & Matière</th>
          <th className="px-8 py-6">Specs Techniques</th>
          <th className="px-8 py-6 text-center">Statut</th>
          {canManage ? <th className="px-8 py-6 text-center">Actions</th> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {rows.map((row: TableEmballages) => (
          <tr
            key={row.id}
            onClick={() => onOpenDetail?.(row)}
            className={`group transition-all hover:bg-gray-50/50 ${onOpenDetail ? "cursor-pointer" : ""}`}
          >
            <td className="px-8 py-6">
              <span className="text-sm font-black text-gray-900 tracking-tighter uppercase">{row.code}</span>
              <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase italic">{row.type}</div>
            </td>
            <td className="px-8 py-6">
              <div className="font-black text-gray-800 text-sm uppercase">{row.name}</div>
              <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                {row.material || "MATÉRIAU NON DÉFINI"}
              </div>
            </td>
            <td className="px-8 py-6">
              <div className="flex gap-4">
                <SpecItem icon={<Weight size={10}/>} value={`${row.poids ?? 0}kg`} label="Poids" />
                <SpecItem icon={<Maximize2 size={10}/>} value={`${row.largeur ?? 0}cm`} label="Largeur" />
                <SpecItem icon={<Layers size={10}/>} value={`${row.epaisseur_pp ?? 0}μ`} label="Épaisseur" />
              </div>
            </td>
            <td className="px-8 py-6 text-center">
              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border
                ${row.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                {row.status}
              </span>
            </td>
            {canManage ? (
              <td
                className="px-8 py-6 text-center"
                onClick={(e) => e.stopPropagation()}
              >
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
    </div>
  </div>
);

const SpecItem = ({ icon, value, label }: any) => (
  <div>
    <div className="flex items-center gap-1 text-gray-900 font-black text-[11px]">{icon} {value}</div>
    <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{label}</div>
  </div>
);