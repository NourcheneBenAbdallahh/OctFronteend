"use client";

import { X, Package, CalendarDays, User2, MessageSquareText, Hash } from "lucide-react";
import type { Lot } from "@/types/lot";

interface Props {
  lot: Lot | null;
  open: boolean;
  onClose: () => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR");
}

function getEmballageLabel(lot: Lot | null) {
  if (!lot) return "-";
  return (
    lot.emballage?.name ||
    lot.emballage?.code ||
    `Emballage #${lot.emballage_id}`
  );
}

export default function LotDetailsDrawer({ lot, open, onClose }: Props) {
  if (!open || !lot) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-[12px] uppercase font-bold tracking-wide text-gray-400">
              Détail du lot
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              {lot.code_lot}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Consultation de la traçabilité et des métadonnées du lot
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Hash size={16} />
                <span>Code lot</span>
              </div>
              <div className="mt-2 text-xl font-bold text-[#00A09D]">
                {lot.code_lot}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Package size={16} />
                <span>Emballage</span>
              </div>
              <div className="mt-2 text-base font-semibold text-gray-800">
                {getEmballageLabel(lot)}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Package size={16} />
                <span>Quantité</span>
              </div>
              <div className="mt-2 text-2xl font-bold text-gray-800">
                {Number(lot.quantite).toLocaleString("fr-FR", {
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <CalendarDays size={16} />
                <span>Date mouvement</span>
              </div>
              <div className="mt-2 text-base font-semibold text-gray-800">
                {formatDate(lot.date_mvt)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-sm border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <User2 size={16} />
              <span>Utilisateur</span>
            </div>
            <div className="mt-2 text-base font-medium text-gray-800">
              {lot.user?.name || lot.user?.email || "Non renseigné"}
            </div>
          </div>

          <div className="p-4 rounded-sm border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <MessageSquareText size={16} />
              <span>Commentaire</span>
            </div>
            <div className="mt-2 text-sm leading-6 text-gray-700 whitespace-pre-line">
              {lot.commentaire?.trim() || "Aucun commentaire"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-sm border border-gray-200 bg-white">
              <div className="text-[11px] uppercase font-bold text-gray-400">
                ID Lot
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {lot.id}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-white">
              <div className="text-[11px] uppercase font-bold text-gray-400">
                ID Emballage
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {lot.emballage_id}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-white">
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Créé le
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {formatDate(lot.created_at)}
              </div>
            </div>

            <div className="p-4 rounded-sm border border-gray-200 bg-white">
              <div className="text-[11px] uppercase font-bold text-gray-400">
                Mis à jour le
              </div>
              <div className="mt-2 text-sm font-semibold text-gray-800">
                {formatDate(lot.updated_at)}
              </div>
            </div>
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