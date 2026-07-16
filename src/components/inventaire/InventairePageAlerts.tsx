"use client";

import { CheckCheck, Trash2, TrendingDown, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import type { AppFeedback } from "@/hooks/useAppFeedback";
import { getRegulariserLineCopy } from "@/lib/inventaire.errors";
import type { TableInventaire } from "@/types/inventaire";

export type InventaireFeedback = AppFeedback;

interface ConfirmDeleteProps {
  items: TableInventaire[];
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
  items,
  open,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDeleteProps) {
  if (!items.length) return null;

  const regulariseCount = items.filter((i) => i.statut === "REGULARISEE").length;
  const canDelete = regulariseCount === 0;
  const isBulk = items.length > 1;

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
            canDelete ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-400"
          }`}
        >
          <Trash2 size={28} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight mb-2">
          {isBulk
            ? `Supprimer ${items.length} ligne(s) d'inventaire ?`
            : "Supprimer cet inventaire ?"}
        </h3>
        {isBulk ? (
          <div className="text-left mt-4 max-h-40 overflow-y-auto filter-picker-scroll rounded-2xl border border-gray-100 bg-gray-50/50 p-4 space-y-2">
            {items.slice(0, 8).map((item) => (
              <p key={item.id} className="text-sm font-medium text-gray-500">
                <span className="font-black text-[#1C2434]">{item.emballage_name}</span>
                {" — "}
                {item.entrepot_name}
              </p>
            ))}
            {items.length > 8 && (
              <p className="text-xs font-bold text-gray-400">
                … et {items.length - 8} autre(s) ligne(s)
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm font-medium text-gray-500 mb-1">
            <span className="font-black text-[#1C2434]">{items[0].emballage_name}</span>
            {" — "}
            {items[0].entrepot_name}
          </p>
        )}
        {!canDelete ? (
          <p className="text-sm font-bold text-red-600 mt-4">
            {regulariseCount === 1
              ? "Une ligne sélectionnée est régularisée : la suppression n'est pas autorisée."
              : `${regulariseCount} ligne(s) régularisée(s) : la suppression n'est pas autorisée.`}
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
            disabled={loading || !canDelete}
            className="h-12 px-8 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {loading
              ? "Suppression…"
              : isBulk
                ? `Supprimer ${items.length} ligne(s)`
                : "Supprimer"}
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
  const canRun = !!codeSession && eligibleCount > 0;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-lg rounded-[32px] p-8"
      showCloseButton
    >
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C2434]/10 text-[#1C2434]">
          <CheckCheck size={28} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight mb-2">
          Régulariser toute la session ?
        </h3>
        {codeSession ? (
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
              Session sélectionnée
            </p>
            <p className="text-[12px] font-black uppercase tracking-widest text-[#00A09D]">
              {codeSession}
            </p>
          </div>
        ) : null}

        <div className="text-left rounded-2xl border border-gray-100 bg-gray-50/60 p-5 space-y-4 text-sm text-gray-600 leading-relaxed">
          <p className="font-bold text-[#1C2434]">
            Cette action aligne le stock système sur les comptages réels de la session, ligne par ligne.
          </p>
          <ul className="space-y-2.5 text-[13px]">
            <li className="flex gap-2">
              <span className="text-[#00A09D] font-black shrink-0">•</span>
              <span>
                <strong className="text-[#1C2434]">Écart positif (surplus)</strong> : création d&apos;un
                mouvement <strong>SPL</strong> (entrée en stock + nouveau lot).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-[#00A09D] font-black shrink-0">•</span>
              <span>
                <strong className="text-[#1C2434]">Écart négatif (perte)</strong> : création d&apos;un
                mouvement <strong>PTE</strong> (sortie de stock sur le lot concerné).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-gray-400 font-black shrink-0">•</span>
              <span>
                Les lignes déjà <strong>régularisées</strong> et les brouillons <strong>sans
                comptage</strong> (stock physique à 0) sont ignorés.
              </span>
            </li>
          </ul>
        </div>

        {codeSession && eligibleCount > 0 ? (
          <div className="mt-5 rounded-2xl bg-[#00A09D]/10 border border-[#00A09D]/20 px-5 py-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#00A09D] mb-1">
              Lignes à traiter
            </p>
            <p className="text-2xl font-[1000] text-[#1C2434] tracking-tight">
              {eligibleCount}
              <span className="ml-2 text-sm font-bold text-gray-500">
                ligne{eligibleCount > 1 ? "s" : ""} éligible{eligibleCount > 1 ? "s" : ""}
              </span>
            </p>
          </div>
        ) : null}

        {codeSession && eligibleCount === 0 ? (
          <p className="text-sm font-bold text-amber-700 mt-5 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            Aucune ligne éligible dans cette session : tout est déjà régularisé ou encore en brouillon
            sans comptage.
          </p>
        ) : null}

        {!codeSession ? (
          <p className="text-sm font-bold text-amber-700 mt-5 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
            Aucune session sélectionnée. Choisissez une session ou générez d&apos;abord une campagne
            d&apos;inventaire.
          </p>
        ) : null}

        <p className="text-xs text-gray-400 mt-4 leading-relaxed">
          Les mouvements créés sont tracés et mettent à jour le stock. Cette opération ne peut pas être
          annulée automatiquement.
        </p>

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
            {loading ? "Régularisation…" : `Confirmer (${eligibleCount})`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
