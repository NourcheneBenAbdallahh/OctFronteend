import { Edit3, Trash2, Box, Layers, Weight } from "lucide-react";
import { TableEmballages } from "@/types/emballage";

interface Props {
  rows: TableEmballages[];
  onEdit: (item: TableEmballages) => void;
  onDelete: (id: string | number) => void;
}

export const EmballagesListView = ({ rows, onEdit, onDelete }: Props) => (
  <div className="flex-1 overflow-auto p-4">
    <div className="bg-white shadow-md border border-gray-200 rounded-sm overflow-hidden">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-gray-300 text-gray-800 uppercase text-[11px] font-bold">
            <th className="px-4 py-3">Code</th>
            <th className="px-4 py-3">Nom / Désignation</th>
            <th className="px-4 py-3">Type & Matière</th>
            <th className="px-4 py-3 text-right">Capacité</th>
            <th className="px-4 py-3 text-center">Statut</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-[#F2F7F7] group transition-colors">
              <td className="px-4 py-3 font-mono font-bold text-gray-600">{row.code}</td>
              <td className="px-4 py-3 font-bold text-[#00A09D] uppercase tracking-tight">
                {row.name}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-gray-700 flex items-center gap-1"><Layers size={12}/> {row.type}</span>
                  <span className="text-[11px] text-gray-400">{row.material || "Matière non spécifiée"}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right font-medium">
                <div className="flex items-center justify-end gap-1">
                  <Weight size={12} className="text-gray-400"/>
                  {row.capacity_value} <span className="text-gray-400 text-[11px]">{row.capacity_unit}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                  ${row.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(row)} className="p-1.5 text-gray-600 hover:text-[#00A09D] hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(row.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);