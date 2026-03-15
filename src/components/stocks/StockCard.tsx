"use client";

import {
  CalendarDays,
  Package,
  User2,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  stock: Stock;
  onView?: (stock: Stock) => void;
  onEdit?: (stock: Stock) => void;
  onDelete?: (stock: Stock) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR");
}

function getEntrepotLabel(stock: Stock) {
  return stock.entrepot?.nom || stock.entrepot?.name || `Entrepôt #${stock.entrepot_id}`;
}

function getEmballageLabel(stock: Stock) {
  return stock.emballage?.name || stock.emballage?.code || `Emballage #${stock.emballage_id}`;
}

export default function StockCard({ stock, onView, onEdit, onDelete }: Props) {
  const isEntree = stock.sens === "entree";

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${
                isEntree
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {isEntree ? <ArrowDownToLine size={13} /> : <ArrowUpFromLine size={13} />}
              {stock.sens}
            </span>

            <div className="mt-4">
              <h3 className="text-[30px] leading-none font-bold text-gray-800">
                {Number(stock.quantite).toLocaleString("fr-FR", {
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-sm text-gray-500 mt-2">Quantité du mouvement</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] uppercase font-bold text-gray-400">
              Stock final
            </div>
            <div className="text-[26px] font-bold text-[#00A09D] mt-1">
              {Number(stock.quantite_finale).toLocaleString("fr-FR", {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <Warehouse size={16} className="text-gray-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Entrepôt
              </div>
              <div className="text-sm font-medium text-gray-700">
                {getEntrepotLabel(stock)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <Package size={16} className="text-gray-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Emballage
              </div>
              <div className="text-sm font-medium text-gray-700">
                {getEmballageLabel(stock)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <CalendarDays size={16} className="text-gray-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Date mouvement
              </div>
              <div className="text-sm font-medium text-gray-700">
                {formatDate(stock.date_stock)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <User2 size={16} className="text-gray-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Utilisateur
              </div>
              <div className="text-sm font-medium text-gray-700">
                {stock.user?.name || stock.user?.email || "Non renseigné"}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="p-3 rounded-sm border border-gray-200">
            <div className="text-[11px] uppercase font-bold text-gray-400">
              Stock initial
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-800">
              {Number(stock.quantite_init).toLocaleString("fr-FR", {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="p-3 rounded-sm border border-gray-200">
            <div className="text-[11px] uppercase font-bold text-gray-400">
              Lot
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-800">
              {stock.lot?.code_lot || "—"}
            </div>
          </div>

          <div className="p-3 rounded-sm border border-gray-200">
            <div className="text-[11px] uppercase font-bold text-gray-400">
              ID mouvement
            </div>
            <div className="mt-2 text-sm font-semibold text-gray-800">
              {stock.id}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => onView?.(stock)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            <Eye size={15} />
            Voir
          </button>

          <button
            onClick={() => onEdit?.(stock)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm"
          >
            <Pencil size={15} />
            Modifier
          </button>

          <button
            onClick={() => onDelete?.(stock)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 transition text-sm"
          >
            <Trash2 size={15} />
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}