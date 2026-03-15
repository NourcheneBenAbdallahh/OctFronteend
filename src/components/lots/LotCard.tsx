"use client";

import {
  CalendarDays,
  MessageSquareText,
  Package,
  User2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Lot } from "@/types/lot";

interface Props {
  lot: Lot;
  compact?: boolean;
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString();
}

function getEmballageLabel(lot: Lot) {
  return (
    lot.emballage?.name ||
    lot.emballage?.code ||
    `Emballage #${lot.emballage_id}`
  );
}

function getCommentBadge(comment?: string | null) {
  if (!comment) {
    return {
      label: "Sans commentaire",
      className: "bg-gray-100 text-gray-600 border-gray-200",
    };
  }

  if (comment.length > 35) {
    return {
      label: "Commentaire détaillé",
      className: "bg-orange-50 text-orange-700 border-orange-200",
    };
  }

  return {
    label: "Commenté",
    className: "bg-green-50 text-green-700 border-green-200",
  };
}

export default function LotCard({
  lot,
  compact = false,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const badge = getCommentBadge(lot.commentaire);

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-[#F2F7F7] border border-[#DDF2F1]">
                <Package size={18} className="text-[#00A09D]" />
              </span>
              <div>
                <h3 className="text-[28px] leading-none font-bold text-gray-800 tracking-tight">
                  {lot.code_lot}
                </h3>
                <p className="text-sm text-gray-500 mt-2">{getEmballageLabel(lot)}</p>
              </div>
            </div>
          </div>

          <button className="text-gray-400 hover:text-gray-700 transition">
            <MoreVertical size={18} />
          </button>
        </div>

        <div className={`grid ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4 mt-5`}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <Package size={16} className="text-gray-400" />
              <span className="text-sm">Quantité</span>
            </div>
            <div className="text-[34px] font-bold text-[#00A09D]">
              {Number(lot.quantite).toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <CalendarDays size={16} className="text-gray-400" />
              <span className="text-sm">Date mouvement</span>
            </div>
            <div className="text-[15px] font-semibold text-gray-800">
              {formatDate(lot.date_mvt)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <User2 size={16} className="text-gray-400" />
            <div>
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Utilisateur
              </div>
              <div className="text-sm font-medium text-gray-700">
                {lot.user?.name || lot.user?.email || "Non affecté"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-sm">
            <MessageSquareText size={16} className="text-gray-400" />
            <div className="min-w-0">
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Commentaire
              </div>
              <div className="text-sm font-medium text-gray-700 truncate">
                {lot.commentaire || "Aucun commentaire"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${badge.className}`}
          >
            {badge.label}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => onView?.(lot)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              <Eye size={15} />
              Voir
            </button>

            <button
              onClick={() => onEdit?.(lot)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              <Pencil size={15} />
              Modifier
            </button>

            <button
              onClick={() => onDelete?.(lot)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-sm border border-red-200 text-red-600 hover:bg-red-50 transition text-sm"
            >
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}