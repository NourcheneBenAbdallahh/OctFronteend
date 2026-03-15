"use client";

import { X } from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  stock: Stock | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR");
}

export default function StockDetailsDrawer({ stock, open, onClose }: Props) {
  if (!open || !stock) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-[12px] uppercase font-bold tracking-wide text-gray-400">
              Détail mouvement stock
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              Mouvement #{stock.id}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Info label="Sens" value={stock.sens} />
            <Info label="Quantité" value={String(stock.quantite)} />
            <Info label="Date stock" value={formatDate(stock.date_stock)} />
            <Info label="Lot" value={stock.lot?.code_lot || "—"} />
            <Info
              label="Entrepôt"
              value={stock.entrepot?.nom || stock.entrepot?.name || String(stock.entrepot_id)}
            />
            <Info
              label="Emballage"
              value={stock.emballage?.name || stock.emballage?.code || String(stock.emballage_id)}
            />
            <Info
              label="Utilisateur"
              value={stock.user?.name || stock.user?.email || "Non renseigné"}
            />
            <Info label="Créé le" value={formatDate(stock.created_at)} />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
      <div className="text-[11px] uppercase font-bold text-gray-400">{label}</div>
      <div className="mt-2 text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}