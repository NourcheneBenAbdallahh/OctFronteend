"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import type { Stock, StockSens } from "@/types/stock";

interface Props {
  stock: Stock | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    entrepot_id: string | number;
    emballage_id: string | number;
    lot_id?: string | number | null;
    date_stock: string;
    quantite: number;
    sens: StockSens;
    user_id?: string | number | null;
  }) => Promise<void>;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function StockEditDrawer({ stock, open, onClose, onSubmit }: Props) {
  const [form, setForm] = useState({
    entrepot_id: "",
    emballage_id: "",
    lot_id: "",
    date_stock: "",
    quantite: 0,
    sens: "entree" as StockSens,
    user_id: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stock) {
      setForm({
        entrepot_id: String(stock.entrepot_id ?? ""),
        emballage_id: String(stock.emballage_id ?? ""),
        lot_id: stock.lot_id ? String(stock.lot_id) : "",
        date_stock: toDateTimeLocal(stock.date_stock),
        quantite: Number(stock.quantite ?? 0),
        sens: stock.sens,
        user_id: stock.user_id ? String(stock.user_id) : "",
      });
    }
  }, [stock]);

  if (!open || !stock) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await onSubmit({
        entrepot_id: form.entrepot_id,
        emballage_id: form.emballage_id,
        lot_id: form.lot_id || null,
        date_stock: form.date_stock,
        quantite: Number(form.quantite),
        sens: form.sens,
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
              Modifier le mouvement
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Input label="Entrepôt ID" value={form.entrepot_id} onChange={(v) => setForm((p) => ({ ...p, entrepot_id: v }))} />
          <Input label="Emballage ID" value={form.emballage_id} onChange={(v) => setForm((p) => ({ ...p, emballage_id: v }))} />
          <Input label="Lot ID" value={form.lot_id} onChange={(v) => setForm((p) => ({ ...p, lot_id: v }))} />
          <Input label="User ID" value={form.user_id} onChange={(v) => setForm((p) => ({ ...p, user_id: v }))} />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date stock
            </label>
            <input
              type="datetime-local"
              value={form.date_stock}
              onChange={(e) => setForm((p) => ({ ...p, date_stock: e.target.value }))}
              className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
              required
            />
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
              Sens
            </label>
            <select
              value={form.sens}
              onChange={(e) => setForm((p) => ({ ...p, sens: e.target.value as StockSens }))}
              className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
            >
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie</option>
            </select>
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

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-sm border border-gray-200 px-3 text-sm outline-none focus:border-[#00A09D]"
      />
    </div>
  );
}