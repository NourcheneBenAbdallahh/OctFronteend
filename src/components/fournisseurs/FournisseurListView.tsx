import { Edit3, Trash2, Phone, MapPin, Hash } from "lucide-react";
import { TableFournisseur } from "@/lib/fournisseurs.api";

interface Props {
  rows: TableFournisseur[];
  onEdit: (f: TableFournisseur) => void;
  onDelete: (id: string | number) => void;
}

export const FournisseurListView = ({ rows, onEdit, onDelete }: Props) => (
  <div className="flex-1 overflow-auto p-4">
    <div className="bg-white shadow-md border border-gray-200 rounded-sm overflow-hidden">
      <table className="w-full text-left border-collapse text-[13px]">
        <thead>
          <tr className="bg-[#F8F9FA] border-b border-gray-300 text-gray-800 uppercase text-[11px] font-bold">
            <th className="px-4 py-3">Raison Sociale</th>
            <th className="px-4 py-3">Matricule Fiscale</th>
            <th className="px-4 py-3">Contact</th>
            <th className="px-4 py-3">Adresse</th>
            <th className="px-4 py-3 text-center">Statut</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((f) => (
            <tr key={f.id} className="hover:bg-[#F2F7F7] group transition-colors">
              <td className="px-4 py-3 font-bold text-[#00A09D] uppercase tracking-tight">
                {f.raison_sociale}
              </td>
              <td className="px-4 py-3 font-mono text-gray-600">
                <div className="flex items-center gap-2">
                  <Hash size={12} className="text-gray-400" />
                  {f.matricule_fiscale}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-700">
                <div className="flex items-center gap-2">
                  <Phone size={12} className="text-gray-400" />
                  {f.telephone || "—"}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-500 italic max-w-xs truncate">
                <div className="flex items-center gap-2">
                  <MapPin size={12} className="text-gray-400" />
                  {f.adresse || "—"}
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border
                  ${f.statut === 'ACTIF' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {f.statut}
                </span>
              </td>
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(f)} className="p-1.5 text-gray-600 hover:text-[#00A09D] hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => onDelete(f.id)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-all">
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