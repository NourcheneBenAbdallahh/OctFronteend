"use client";

import { Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import type { AppFeedback } from "@/hooks/useAppFeedback";
import type { TableEmballages } from "@/types/emballage";

export type EmballageFeedback = AppFeedback;

export function EmballageFeedbackBanner({
  feedback,
  onDismiss,
}: {
  feedback: EmballageFeedback;
  onDismiss: () => void;
}) {
  return <AppFeedbackBanner feedback={feedback} onDismiss={onDismiss} />;
}

export function EmballageConfirmDeleteModal({
  item,
  open,
  loading = false,
  onClose,
  onConfirm,
}: {
  item: TableEmballages | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!item) return null;

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-md rounded-[32px] p-8" showCloseButton>
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={28} />
        </div>
        <h3 className="mb-2 text-xl font-black tracking-tight text-[#1C2434]">
          Supprimer cet emballage ?
        </h3>
        <p className="text-sm font-medium text-gray-500">
          <span className="font-black text-[#1C2434]">{item.name}</span>
          {" — "}
          <span className="uppercase">{item.code}</span>
        </p>
        <p className="mt-4 text-sm text-gray-400">
          Cette action est définitive. L&apos;emballage ne pourra pas être supprimé s&apos;il est lié à un contrat ou à du stock.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-12 rounded-full border border-gray-200 px-8 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="h-12 rounded-full bg-red-600 px-8 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700 disabled:opacity-40"
          >
            {loading ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
