"use client";

import { useEffect, useState } from "react";
import { X, Save, Package, Hash, CalendarDays, MessageSquareText, User2, Loader2 } from "lucide-react";
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
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      {/* Overlay Soft */}
      <div 
        className="absolute inset-0 bg-[#1C2434]/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="relative h-full w-full max-w-xl bg-white shadow-[-20px_0_80px_rgba(0,0,0,0.1)] flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER */}
        <div className="px-8 py-8 border-b border-gray-50 flex items-start justify-between">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-[1000] uppercase tracking-[0.2em] rounded-full border border-amber-100">
              Mode Édition
            </span>
            <h2 className="text-3xl font-[1000] text-[#1C2434] uppercase tracking-tighter mt-3">
              Modifier <span className="text-[#00A09D]">{lot.code_lot}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-[#1C2434] hover:rotate-90 transition-all duration-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULAIRE */}
        <form id="edit-lot-form" onSubmit={handleSubmit} className="form-scroll flex-1 space-y-8 px-8 py-8">
          
          {/* Grille Code & Emballage */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Code Lot</label>
              <div className="relative group">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
                <input
                  value={form.code_lot}
                  onChange={(e) => setForm((p) => ({ ...p, code_lot: e.target.value }))}
                  className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-[20px] pl-12 pr-4 text-[15px] font-bold text-[#1C2434] outline-none focus:bg-white focus:border-[#DDF2F1] transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">ID Emballage</label>
              <div className="relative group">
                <Package size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
                <input
                  value={form.emballage_id}
                  onChange={(e) => setForm((p) => ({ ...p, emballage_id: e.target.value }))}
                  className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-[20px] pl-12 pr-4 text-[15px] font-bold text-[#1C2434] outline-none focus:bg-white focus:border-[#DDF2F1] transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Quantité & Date */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Quantité (PCS)</label>
              <input
                type="number"
                step="0.01"
                value={form.quantite}
                onChange={(e) => setForm((p) => ({ ...p, quantite: Number(e.target.value) }))}
                className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-[20px] px-6 text-2xl font-[1000] text-[#00A09D] outline-none focus:bg-white focus:border-[#DDF2F1] transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Date du mouvement</label>
              <div className="relative group">
                <CalendarDays size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
                <input
                  type="datetime-local"
                  value={form.date_mvt}
                  onChange={(e) => setForm((p) => ({ ...p, date_mvt: e.target.value }))}
                  className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-[20px] pl-12 pr-4 text-[13px] font-bold text-[#1C2434] outline-none focus:bg-white focus:border-[#DDF2F1] transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Utilisateur */}
          <div className="space-y-2">
            <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">ID Utilisateur Responsable</label>
            <div className="relative group">
              <User2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
              <input
                value={form.user_id}
                onChange={(e) => setForm((p) => ({ ...p, user_id: e.target.value }))}
                className="w-full h-14 bg-gray-50 border-2 border-transparent rounded-[20px] pl-12 pr-4 text-[15px] font-bold text-[#1C2434] outline-none focus:bg-white focus:border-[#DDF2F1] transition-all"
                placeholder="Laissez vide pour 'Système'"
              />
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <label className="text-[11px] font-[1000] text-gray-400 uppercase tracking-widest ml-1">Observations & Notes</label>
            <div className="relative group">
              <MessageSquareText size={18} className="absolute left-4 top-5 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" />
              <textarea
                rows={4}
                value={form.commentaire}
                onChange={(e) => setForm((p) => ({ ...p, commentaire: e.target.value }))}
                className="w-full bg-gray-50 border-2 border-transparent rounded-[32px] pl-12 pr-6 py-4 text-[14px] font-medium text-gray-700 outline-none focus:bg-white focus:border-[#DDF2F1] transition-all resize-none"
                placeholder="Ajoutez une note interne sur ce lot..."
              />
            </div>
          </div>
        </form>

        {/* FOOTER ACTIONS */}
        <div className="px-8 py-6 border-t border-gray-50 bg-[#F8FAFA] flex items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-14 rounded-[20px] border-2 border-gray-100 text-[11px] font-[1000] text-gray-400 uppercase tracking-widest hover:bg-white hover:text-[#1C2434] transition-all"
          >
            Annuler
          </button>

          <button
            type="submit"
            form="edit-lot-form"
            disabled={saving}
            className="flex-[2] h-14 bg-[#1C2434] text-white rounded-[20px] flex items-center justify-center gap-3 hover:bg-[#00A09D] disabled:opacity-50 transition-all shadow-xl shadow-gray-200"
          >
            {saving ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span className="text-[11px] font-[1000] uppercase tracking-[0.2em]">
              {saving ? "Synchronisation..." : "Enregistrer les modifications"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}