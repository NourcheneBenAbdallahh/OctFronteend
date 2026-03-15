"use client";

import { X } from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

interface Props {
  item: TableInventaire | null;
  open: boolean;
  onClose: () => void;
}

export default function InventaireDetailDrawer({ item, open, onClose }: Props) {
  if (!open || !item) return null;

  const negative = item.ecart < 0;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-start">
          <div>
            <p className="text-[12px] uppercase font-black text-gray-400 tracking-wider">
              Détail inventaire
            </p>
            <h2 className="text-2xl font-black text-gray-800 mt-1">
              {item.emballage_name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{item.entrepot_name}</p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Block label="Stock théorique" value={String(item.stock_theorique)} />
          <Block label="Stock physique" value={String(item.stock_physique)} />
          <Block
            label="Écart"
            value={`${item.ecart > 0 ? "+" : ""}${item.ecart}`}
            color={
              item.ecart === 0
                ? "text-gray-700"
                : negative
                ? "text-red-600"
                : "text-blue-600"
            }
          />
          <Block
            label="Date inventaire"
            value={new Date(item.date_inventaire).toLocaleString("fr-FR")}
          />
          <Block
            label="Période"
            value={
              item.periode_debut && item.periode_fin
                ? `${new Date(item.periode_debut).toLocaleDateString("fr-FR")} → ${new Date(
                    item.periode_fin
                  ).toLocaleDateString("fr-FR")}`
                : "Non définie"
            }
          />
          <Block label="Entrepôt" value={item.entrepot_name} />
          <Block label="Emballage" value={item.emballage_name} />
        </div>
      </div>
    </div>
  );
}

function Block({
  label,
  value,
  color = "text-gray-800",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
      <div className="text-[11px] uppercase font-black text-gray-400">{label}</div>
      <div className={`mt-2 text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}