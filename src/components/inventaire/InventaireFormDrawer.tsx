"use client";

import { useEffect, useState } from "react";
import { X, Save, Warehouse, Package, Hash, Calendar, ArrowRight, Monitor } from "lucide-react";
import { CreateInventaireInput, TableInventaire } from "@/types/inventaire";
import { fetchStockTheoriqueAt } from "@/lib/inventaire.api";
import { useAuthStore } from "@/store/useAuthStore";

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

function formatForBackend(dateStr: string | null | undefined): string | undefined {
  if (!dateStr) return undefined;
  let formatted = dateStr.replace("T", " ");
  if (formatted.length === 16) formatted = `${formatted}:00`;
  return formatted;
}

export default function InventaireFormDrawer({
  open,
  item,
  entrepots,
  emballages,
  onClose,
  onSubmit,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<CreateInventaireInput>({
    entrepot_id: "",
    emballage_id: "",
    stock_physique: 0,
    date_inventaire: new Date().toISOString().slice(0, 16),
    periode_debut: "",
    periode_fin: "",
    motif_ecart: "",
  });
  const [theoriquePreview, setTheoriquePreview] = useState<number | null>(null);
  const [loadingTheorique, setLoadingTheorique] = useState(false);
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
        motif_ecart: item.motif_ecart || "",
        user_id: item.user_id || user?.id,
      });
      setTheoriquePreview(item.stock_theorique_fige ?? item.stock_theorique);
    } else {
      setForm({
        entrepot_id: "",
        emballage_id: "",
        stock_physique: 0,
        date_inventaire: new Date().toISOString().slice(0, 16),
        periode_debut: "",
        periode_fin: "",
        motif_ecart: "",
        user_id: user?.id,
      });
      setTheoriquePreview(null);
    }
  }, [item, open, user?.id]);

  useEffect(() => {
    if (!open || item || !form.entrepot_id || !form.emballage_id || !form.date_inventaire) {
      return;
    }
    const at = formatForBackend(form.date_inventaire);
    if (!at) return;

    let cancelled = false;
    setLoadingTheorique(true);
    fetchStockTheoriqueAt(form.entrepot_id, form.emballage_id, at)
      .then((v) => {
        if (!cancelled) setTheoriquePreview(v);
      })
      .catch(() => {
        if (!cancelled) setTheoriquePreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingTheorique(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.entrepot_id, form.emballage_id, form.date_inventaire, open, item]);

  if (!open) return null;

  const theoriqueRef = item
    ? (item.stock_theorique_fige ?? item.stock_theorique)
    : theoriquePreview;
  const ecartPreview =
    theoriqueRef != null ? Number(form.stock_physique) - Number(theoriqueRef) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date_inventaire) {
      alert("La date d'inventaire est obligatoire.");
      return;
    }

    setSaving(true);
    const payload: CreateInventaireInput = {
      ...form,
      date_inventaire: formatForBackend(form.date_inventaire) as string,
      periode_debut: formatForBackend(form.periode_debut),
      periode_fin: formatForBackend(form.periode_fin),
      entrepot_id: String(form.entrepot_id),
      emballage_id: String(form.emballage_id),
      user_id: user?.id ? String(user.id) : form.user_id,
      stock_physique: Number(form.stock_physique),
      motif_ecart: form.motif_ecart || undefined,
    };

    try {
      await onSubmit(payload);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const isLocked = item?.statut === "REGULARISEE";

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-[#1C2434]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="px-8 pt-10 pb-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#00A09D]/10 text-[#00A09D] text-[10px] font-[1000] uppercase tracking-widest mb-2">
              Audit stock
            </span>
            <h2 className="text-3xl font-[1000] text-[#1C2434] tracking-tighter">
              {item ? "Modifier la ligne" : "Nouvel inventaire"}
            </h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {theoriqueRef != null && (
            <div className="p-5 rounded-[24px] bg-gray-50 border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Monitor size={20} className="text-[#00A09D]" />
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Stock système (figé à la saisie)</p>
                  <p className="text-2xl font-[1000] text-[#1C2434]">
                    {loadingTheorique ? "…" : theoriqueRef}
                  </p>
                </div>
              </div>
              {ecartPreview != null && (
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400">Écart prévu</p>
                  <p className={`text-xl font-[1000] ${ecartPreview < 0 ? "text-red-500" : ecartPreview > 0 ? "text-blue-500" : "text-emerald-600"}`}>
                    {ecartPreview > 0 ? `+${ecartPreview}` : ecartPreview}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Warehouse size={14} /> Localisation
            </label>
            <select
              value={form.entrepot_id}
              disabled={!!item || isLocked}
              onChange={(e) => setForm({ ...form, entrepot_id: e.target.value })}
              className="w-full h-14 px-4 rounded-[20px] bg-gray-50 font-bold disabled:opacity-60"
              required
            >
              <option value="">Entrepôt</option>
              {entrepots.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
            <select
              value={form.emballage_id}
              disabled={!!item || isLocked}
              onChange={(e) => setForm({ ...form, emballage_id: e.target.value })}
              className="w-full h-14 px-4 rounded-[20px] bg-gray-50 font-bold disabled:opacity-60"
              required
            >
              <option value="">Emballage</option>
              {emballages.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-[#00A09D] flex items-center gap-2">
              <Hash size={14} /> Comptage réel
            </label>
            <input
              type="number"
              disabled={isLocked}
              value={form.stock_physique}
              onChange={(e) => setForm({ ...form, stock_physique: parseFloat(e.target.value) || 0 })}
              className="w-full h-24 text-5xl font-[1000] text-center rounded-[28px] bg-[#1C2434] text-white disabled:opacity-60"
              required
            />
          </div>

          <div>
            <span className="text-[10px] font-bold text-gray-400 ml-4 mb-1 block">Motif d&apos;écart (optionnel)</span>
            <input
              value={form.motif_ecart || ""}
              disabled={isLocked}
              onChange={(e) => setForm({ ...form, motif_ecart: e.target.value })}
              className="w-full h-12 px-6 rounded-full bg-gray-50 font-bold disabled:opacity-60"
              placeholder="Casse, erreur saisie…"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Calendar size={14} /> Date
            </label>
            <input
              type="datetime-local"
              disabled={isLocked}
              value={form.date_inventaire}
              onChange={(e) => setForm({ ...form, date_inventaire: e.target.value })}
              className="w-full h-12 px-6 rounded-full bg-gray-50 font-bold disabled:opacity-60"
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                disabled={isLocked}
                value={form.periode_debut || ""}
                onChange={(e) => setForm({ ...form, periode_debut: e.target.value })}
                className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 text-[12px] font-bold disabled:opacity-60"
              />
              <ArrowRight size={20} className="text-gray-300" />
              <input
                type="datetime-local"
                disabled={isLocked}
                value={form.periode_fin || ""}
                onChange={(e) => setForm({ ...form, periode_fin: e.target.value })}
                className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 text-[12px] font-bold disabled:opacity-60"
              />
            </div>
          </div>
        </form>

        <div className="px-8 py-8 border-t border-gray-100 flex flex-col gap-3">
          {!isLocked && (
            <button
              onClick={handleSubmit}
              disabled={saving}
              type="submit"
              className="w-full h-16 rounded-[24px] bg-[#1C2434] text-white flex items-center justify-center gap-3 hover:bg-[#00A09D] disabled:opacity-50"
            >
              {saving ? (
                <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  <span className="text-[13px] font-[1000] uppercase tracking-[0.2em]">Enregistrer</span>
                </>
              )}
            </button>
          )}
          <button onClick={onClose} className="w-full py-4 text-[11px] font-black uppercase text-gray-400">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
