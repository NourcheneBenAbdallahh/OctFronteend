"use client";

import { useEffect, useState } from "react";
import { X, Save, Package, Hash, CalendarDays, MessageSquareText } from "lucide-react";
import type { Lot } from "@/types/lot";

interface Props {
  lot: Lot | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    code_lot: string;
    emballage_id: string | number;
    quantite: number;
    date_mvt: string;
    commentaire: string;
    user_id?: string | number | null;
  }) => Promise<void>;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function LotEditDrawer({ lot, open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    code_lot: "",
    emballage_id: "",
    quantite: 0,
    date_mvt: "",
    commentaire: "",
    user_id: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lot) {
      setForm({
        code_lot: lot.code_lot || "",
        emballage_id: String(lot.emballage_id ?? ""),
        quantite: Number(lot.quantite ?? 0),
        date_mvt: toDateTimeLocal(lot.date_mvt),
        commentaire: lot.commentaire || "",
        user_id: lot.user_id ? String(lot.user_id) : "",
      });
    }
  }, [lot]);

  if (!open || !lot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        code_lot: form.code_lot,
        emballage_id: form.emballage_id,
        quantite: Number(form.quantite),
        date_mvt: form.date_mvt,
        commentaire: form.commentaire,
        user_id: form.user_id || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-[12px] uppercase font-bold tracking-wide text-gray-400">
              Modifier le lot
            </p>
            <h2 className="text-2xl font-bold text-gray-800 mt-1">
              {lot.code_lot}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Mise à jour des informations métier du lot
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Code lot
            </label>
            <div className="relative">
              <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.code_lot}
                onChange={(e) => setForm((p) => ({ ...p, code_lot: e.target.value }))}
                className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Emballage ID
            </label>
            <div className="relative">
              <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={form.emballage_id}
                onChange={(e) => setForm((p) => ({ ...p, emballage_id: e.target.value }))}
                className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quantité
            </label>
            <input
              type="number"
              step="0.01"
              value={form.quantite}
              onChange={(e) => setForm((p) => ({ ...p, quantite: Number(e.target.value) }))}
              className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date mouvement
            </label>
            <div className="relative">
              <CalendarDays size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="datetime-local"
                value={form.date_mvt}
                onChange={(e) => setForm((p) => ({ ...p, date_mvt: e.target.value }))}
                className="w-full h-11 rounded-sm border border-gray-200 pl-10 pr-3 text-sm outline-none focus:border-[#00A09D]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Commentaire
            </label>
            <div className="relative">
              <MessageSquareText size={16} className="absolute left-3 top-4 text-gray-400" />
              <textarea
                rows={5}
                value={form.commentaire}
                onChange={(e) => setForm((p) => ({ ...p, commentaire: e.target.value }))}
                className="w-full rounded-sm border border-gray-200 pl-10 pr-3 py-3 text-sm outline-none focus:border-[#00A09D] resize-none"
                placeholder="Commentaire du lot..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User ID
            </label>
            <input
              value={form.user_id}
              onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
              className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
            />
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>

          <button
            type="submit"
            onClick={(e) => {
              const formEl = (e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement | null);
              formEl?.requestSubmit();
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#00A09D] text-white hover:opacity-95 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}