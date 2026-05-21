"use client";

import { AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { AppConfirmState } from "@/hooks/useAppFeedback";

export function AppConfirmModal({
  confirm,
  onClose,
}: {
  confirm: AppConfirmState;
  onClose: () => void;
}) {
  if (!confirm) return null;

  const variant = confirm.variant ?? "danger";
  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const iconWrap = isDanger
    ? "bg-red-50 text-red-600"
    : isWarning
      ? "bg-amber-50 text-amber-600"
      : "bg-[#1C2434]/10 text-[#1C2434]";

  const confirmBtn = isDanger
    ? "bg-red-600 hover:bg-red-700"
    : isWarning
      ? "bg-amber-600 hover:bg-amber-700"
      : "bg-[#00A09D] hover:bg-[#008f8c]";

  return (
    <Modal
      isOpen
      onClose={onClose}
      className="max-w-md rounded-[32px] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${iconWrap}`}
        >
          {isDanger ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
        </div>
        <h3 className="mb-2 text-xl font-black tracking-tight text-[#1C2434]">{confirm.title}</h3>
        {confirm.detail ? (
          <p className="text-sm font-medium text-gray-500">
            <span className="font-black text-[#1C2434]">{confirm.detail}</span>
          </p>
        ) : null}
        {confirm.description ? (
          <p className="mt-4 text-sm leading-relaxed text-gray-400">{confirm.description}</p>
        ) : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={confirm.loading}
            className="h-12 rounded-full border border-gray-200 px-8 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          >
            {confirm.cancelLabel ?? "Annuler"}
          </button>
          <button
            type="button"
            onClick={() => void confirm.onConfirm()}
            disabled={confirm.loading}
            className={`h-12 rounded-full px-8 text-[11px] font-black uppercase tracking-widest text-white transition-colors disabled:opacity-40 ${confirmBtn}`}
          >
            {confirm.loading
              ? "Traitement…"
              : confirm.confirmLabel ?? (isDanger ? "Supprimer" : "Confirmer")}
          </button>
        </div>
      </div>
    </Modal>
  );
}
