"use client";

import { CheckCheck, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import type { AppFeedback } from "@/hooks/useAppFeedback";
import { getRegulariserLineCopy } from "@/lib/inventaire.errors";
import type { TableInventaire } from "@/types/inventaire";

export type InventaireFeedback = AppFeedback;

interface ConfirmDeleteProps {
  item: TableInventaire | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InventaireFeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: InventaireFeedback;
  onDismiss: () => void;
}) {
  return <AppFeedbackBanner feedback={feedback} onDismiss={onDismiss} />;
}

export function InventaireConfirmDeleteModal({
  item,
  open,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDeleteProps) {
  if (!item) return null;

  const isRegularise = item.statut === "REGULARISEE";

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md rounded-[32px] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            isRegularise ? "bg-gray-100 text-gray-400" : "bg-red-50 text-red-600"
          }`}
        >
          <Trash2 size={28} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight mb-2">
          Supprimer cet inventaire ?
        </h3>
        <p className="text-sm font-medium text-gray-500 mb-1">
          <span className="font-black text-[#1C2434]">{item.emballage_name}</span>
          {" — "}
          {item.entrepot_name}
        </p>
        {isRegularise ? (
          <p className="text-sm font-bold text-red-600 mt-4">
            Cette ligne est régularisée : la suppression n&apos;est pas autorisée.
          </p>
        ) : (
          <p className="text-sm text-gray-400 mt-4">
            Cette action est définitive. Les mouvements stock déjà créés ne seront pas supprimés.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 px-8 rounded-full border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || isRegularise}
            className="h-12 px-8 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmRegulariserProps {
  item: TableInventaire | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InventaireConfirmRegulariserModal({
  item,
  open,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmRegulariserProps) {
  if (!item) return null;

  const copy = getRegulariserLineCopy(item);
  const isSurplus = item.ecart > 0;
  const Icon = isSurplus ? TrendingUp : item.ecart < 0 ? TrendingDown : CheckCheck;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md rounded-[32px] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            copy.canRegularise
              ? isSurplus
                ? "bg-blue-50 text-blue-600"
                : "bg-amber-50 text-amber-600"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          <Icon size={28} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight mb-2">{copy.title}</h3>
        <p className="text-sm font-medium text-gray-500 mb-1">
          <span className="font-black text-[#1C2434]">{item.emballage_name}</span>
          {" — "}
          {item.entrepot_name}
        </p>
        <p className="text-xs font-black uppercase tracking-widest text-gray-400 mt-2">
          Écart : {item.ecart > 0 ? "+" : ""}
          {item.ecart}
        </p>
        {copy.movementBadge && (
          <span className="inline-block mt-3 px-4 py-1.5 rounded-full bg-[#1C2434] text-white text-[10px] font-black uppercase tracking-widest">
            {copy.movementBadge}
          </span>
        )}
        <p className="text-sm text-gray-500 mt-4 leading-relaxed">{copy.description}</p>
        {copy.blockReason && (
          <p className="text-sm font-bold text-amber-700 mt-3">{copy.blockReason}</p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 px-8 rounded-full border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !copy.canRegularise}
            className="h-12 px-8 rounded-full bg-[#00A09D] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#008f8c] disabled:opacity-40 transition-colors"
          >
            {loading ? "Régularisation…" : "Régulariser"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface ConfirmSessionProps {
  codeSession: string;
  eligibleCount: number;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InventaireConfirmRegulariserSessionModal({
  codeSession,
  eligibleCount,
  open,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmSessionProps) {
  const canRun = !!codeSession;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-md rounded-[32px] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C2434]/10 text-[#1C2434]">
          <CheckCheck size={28} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight mb-2">
          Régulariser la session ?
        </h3>
        {codeSession ? (
          <p className="text-[11px] font-black uppercase tracking-widest text-[#00A09D] mb-3">
            {codeSession}
          </p>
        ) : null}
        <p className="text-sm text-gray-500 leading-relaxed">
          Toutes les lignes non régularisées de cette session seront traitées (mouvements SPL ou PTE
          selon l&apos;écart de chaque ligne).
        </p>
        {eligibleCount > 0 && (
          <p className="text-sm font-bold text-[#1C2434] mt-4">
            {eligibleCount} ligne(s) concernée(s) dans la liste actuelle.
          </p>
        )}
        {!canRun && (
          <p className="text-sm font-bold text-amber-700 mt-4">
            Aucune session active. Générez d&apos;abord un inventaire entrepôt.
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 px-8 rounded-full border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !canRun}
            className="h-12 px-8 rounded-full bg-[#00A09D] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#008f8c] disabled:opacity-40 transition-colors"
          >
            {loading ? "Régularisation…" : "Régulariser la session"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
