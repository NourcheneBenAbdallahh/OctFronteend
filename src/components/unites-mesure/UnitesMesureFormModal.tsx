"use client";

import React, { useState } from "react";
import { X, Save, Settings2 } from "lucide-react";
import type { UniteMesure } from "@/types/unite-mesure";
import { createUniteMesure, updateUniteMesure } from "@/lib/unites-mesure.api";

const DIMENSIONS = [
  { value: "masse", label: "Masse" },
  { value: "volume", label: "Volume" },
  { value: "nombre", label: "Nombre (pièce, palette…)" },
  { value: "surface", label: "Surface" },
];

export default function UnitesMesureFormModal({
  editing,
  onClose,
  onSaved,
  onSuccess,
  onError,
}: {
  editing: UniteMesure | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(() =>
    editing
      ? {
          code: editing.code,
          label: editing.label,
          dimension: editing.dimension,
          facteur_vers_kg: editing.facteur_vers_kg ?? "",
          facteur_vers_l: editing.facteur_vers_l ?? "",
          sort_order: editing.sort_order ?? 0,
        }
      : {
          code: "",
          label: "",
          dimension: "masse",
          facteur_vers_kg: "",
          facteur_vers_l: "",
          sort_order: 0,
        }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sortOrder = Number(form.sort_order) || 0;
      const fKg =
        form.facteur_vers_kg === "" || form.facteur_vers_kg === null || form.facteur_vers_kg === undefined
          ? null
          : Number(form.facteur_vers_kg);
      const fL =
        form.facteur_vers_l === "" || form.facteur_vers_l === null || form.facteur_vers_l === undefined
          ? null
          : Number(form.facteur_vers_l);

      if (editing) {
        await updateUniteMesure(editing.id, {
          label: form.label.trim(),
          dimension: form.dimension,
          facteur_vers_kg: fKg,
          facteur_vers_l: fL,
          sort_order: sortOrder,
        });
      } else {
        await createUniteMesure({
          code: form.code.trim().toUpperCase(),
          label: form.label.trim(),
          dimension: form.dimension,
          facteur_vers_kg: fKg ?? undefined,
          facteur_vers_l: fL ?? undefined,
          sort_order: sortOrder,
        });
      }
      await onSaved();
      onSuccess?.(editing ? "Unité de mesure modifiée." : "Unité de mesure créée.");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de sauvegarde";
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-2xl flex-col bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] rounded-l-[3rem]">
        <div className="p-12 pb-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">
              Référentiel
            </span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {editing ? "Modifier l’unité" : "Nouvelle unité"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-12 bg-gray-50 hover:bg-gray-100 rounded-[1.2rem] flex items-center justify-center text-gray-400 transition-colors"
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-12 py-6 space-y-10">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Code</label>
              <input
                required
                disabled={!!editing}
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all disabled:opacity-50"
                placeholder="Ex: QUINTAL"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Ordre d’affichage</label>
              <input
                type="number"
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="border-b-4 border-gray-50 focus-within:border-indigo-500 pb-4 transition-all">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
              Libellé
            </label>
            <input
              required
              className="w-full text-2xl font-black text-gray-900 placeholder:text-gray-100 bg-transparent outline-none tracking-tight"
              placeholder="Ex: Quintal métrique"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Dimension</label>
            <select
              className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:bg-white"
              value={form.dimension}
              onChange={(e) => setForm({ ...form, dimension: e.target.value })}
            >
              {DIMENSIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50/80 p-10 rounded-[2.5rem] space-y-8 border border-gray-100">
            <div className="flex items-center gap-3 text-indigo-600">
              <Settings2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conversion (optionnel)</span>
            </div>
            <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
              Multiplicateur pour convertir une quantité dans cette unité vers des kilogrammes ou des litres (référence
              interne, ex. 1 T → 1000 kg).
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Facteur → kg</label>
                <input
                  type="number"
                  step="any"
                  className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-xl font-black outline-none focus:border-indigo-500 transition-all"
                  value={form.facteur_vers_kg === null || form.facteur_vers_kg === undefined ? "" : form.facteur_vers_kg}
                  onChange={(e) => setForm({ ...form, facteur_vers_kg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Facteur → L</label>
                <input
                  type="number"
                  step="any"
                  className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-xl font-black outline-none focus:border-indigo-500 transition-all"
                  value={form.facteur_vers_l === null || form.facteur_vers_l === undefined ? "" : form.facteur_vers_l}
                  onChange={(e) => setForm({ ...form, facteur_vers_l: e.target.value })}
                />
              </div>
            </div>
          </div>
          </div>

          <div className="p-12 border-t border-gray-50 bg-white flex items-center gap-6 shrink-0">
            <button type="button" onClick={onClose} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900">
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl transition-all flex justify-center items-center gap-2"
            >
              {loading ? "Enregistrement…" : (
                <>
                  <Save size={18} /> Valider
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
