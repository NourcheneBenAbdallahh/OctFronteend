"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { CreateInventaireInput, TableInventaire } from "@/types/inventaire";

interface Option {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  item?: TableInventaire | null;
  entrepots: Option[];
  emballages: Option[];
  onClose: () => void;
  onSubmit: (payload: CreateInventaireInput) => Promise<void>;
}

export default function InventaireFormDrawer({
  open,
  item,
  entrepots,
  emballages,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CreateInventaireInput>({
    entrepot_id: "",
    emballage_id: "",
    stock_physique: 0,
    date_inventaire: new Date().toISOString().slice(0, 16),
    periode_debut: "",
    periode_fin: "",
    user_id: "1",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        entrepot_id: item.entrepot_id,
        emballage_id: item.emballage_id,
        stock_physique: item.stock_physique,
        date_inventaire: item.date_inventaire?.slice(0, 16),
        periode_debut: item.periode_debut?.slice(0, 16) || "",
        periode_fin: item.periode_fin?.slice(0, 16) || "",
        user_id: item.user_id || "1",
      });
    }
  }, [item]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl border-l border-gray-200 flex flex-col">
        <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-[12px] uppercase font-black tracking-wider text-gray-400">
              {item ? "Modifier inventaire" : "Nouvel inventaire"}
            </p>
            <h2 className="text-2xl font-black text-gray-800 mt-1">
              Audit stock
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
          <select
            value={form.entrepot_id}
            onChange={(e) => setForm({ ...form, entrepot_id: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            required
          >
            <option value="">Sélectionner un entrepôt</option>
            {entrepots.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>

          <select
            value={form.emballage_id}
            onChange={(e) => setForm({ ...form, emballage_id: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            required
          >
            <option value="">Sélectionner un emballage</option>
            {emballages.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={form.stock_physique}
            onChange={(e) =>
              setForm({ ...form, stock_physique: parseFloat(e.target.value) || 0 })
            }
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            placeholder="Stock physique"
            required
          />

          <input
            type="datetime-local"
            value={form.date_inventaire}
            onChange={(e) => setForm({ ...form, date_inventaire: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            required
          />

          <input
            type="datetime-local"
            value={form.periode_debut || ""}
            onChange={(e) => setForm({ ...form, periode_debut: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            placeholder="Période début"
          />

          <input
            type="datetime-local"
            value={form.periode_fin || ""}
            onChange={(e) => setForm({ ...form, periode_fin: e.target.value })}
            className="w-full h-11 rounded-sm border border-gray-200 px-3"
            placeholder="Période fin"
          />
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 rounded-sm border border-gray-200 text-gray-700"
          >
            Annuler
          </button>
          <button
            onClick={(e) => {
              const formEl = (e.currentTarget.closest("div")?.previousElementSibling as HTMLFormElement | null);
              formEl?.requestSubmit();
            }}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-[#00A09D] text-white disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}