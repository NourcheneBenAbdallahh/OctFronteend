"use client";

import {
  Package,
  MapPin,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

interface Props {
  data: TableInventaire[];
  onAdjust: (id: string, newVal: number) => void;
  onView: (item: TableInventaire) => void;
  onEdit: (item: TableInventaire) => void;
  onDelete: (id: string) => void;
}

export default function InventaireAuditCards({
  data,
  onAdjust,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (!data.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-gray-500">
        Aucun inventaire trouvé selon les filtres appliqués.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((row) => {
        const isLoss = row.ecart < 0;
        const isPerfect = row.ecart === 0;
        const progress =
          row.stock_theorique > 0
            ? Math.min((row.stock_physique / row.stock_theorique) * 100, 140)
            : 0;

        return (
          <div
            key={row.id}
            className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr_1fr_220px] gap-0">
              <div className="p-5 border-r border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-sm bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400">
                    <Package size={18} />
                  </div>
                  <div>
                    <div className="font-black text-gray-800 text-lg">
                      {row.emballage_name}
                    </div>
                    <div className="text-[11px] text-gray-400 uppercase font-bold flex items-center gap-1 mt-1">
                      <MapPin size={12} />
                      {row.entrepot_name}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-[11px] uppercase font-bold text-gray-400 mb-1">
                    <span>Projection audit</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-100">
                    <div
                      className={`h-full ${
                        isLoss
                          ? "bg-red-500"
                          : isPerfect
                          ? "bg-[#00A09D]"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 text-[12px] text-gray-500">
                  Inventaire saisi le{" "}
                  <strong>
                    {new Date(row.date_inventaire).toLocaleDateString("fr-FR")}
                  </strong>
                </div>
              </div>

              <div className="p-5 border-r border-gray-100">
                <div className="text-[10px] font-black uppercase text-gray-400 mb-2">
                  Référence système
                </div>
                <div className="text-3xl font-black text-gray-800">
                  {row.stock_theorique}
                </div>
                <div className="text-[12px] text-gray-500 mt-1">
                  Stock théorique
                </div>
              </div>

              <div className="p-5 border-r border-gray-100">
                <div className="text-[10px] font-black uppercase text-gray-400 mb-2">
                  Comptage physique
                </div>
                <input
                  type="number"
                  defaultValue={row.stock_physique}
                  onBlur={(e) => onAdjust(row.id, parseFloat(e.target.value))}
                  className="w-full text-3xl font-black text-gray-800 outline-none bg-transparent border-b-2 border-gray-200 focus:border-[#00A09D] pb-1"
                />
                <div className="text-[12px] text-gray-500 mt-1">
                  Valeur ajustable
                </div>
              </div>

              <div className="p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase text-gray-400 mb-2">
                    Résultat audit
                  </div>

                  {isPerfect ? (
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-green-50 text-green-600 border border-green-200 text-sm font-bold">
                      <CheckCircle2 size={16} />
                      Conforme
                    </div>
                  ) : (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-bold border ${
                        isLoss
                          ? "bg-red-50 text-red-600 border-red-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                      }`}
                    >
                      {isLoss ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                      {row.ecart > 0 ? `+${row.ecart}` : row.ecart}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                  <button
                    onClick={() => onView(row)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    <Eye size={14} />
                    Voir
                  </button>
                  <button
                    onClick={() => onEdit(row)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    <Pencil size={14} />
                    Éditer
                  </button>
                  <button
                    onClick={() => onDelete(row.id)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 text-sm"
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}