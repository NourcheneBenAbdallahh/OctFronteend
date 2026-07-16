"use client";

import React, { useState } from "react";
import { X, Save, Settings2 } from "lucide-react";
import type { UniteMesure } from "@/types/unite-mesure";
import { createUniteMesure, updateUniteMesure } from "@/lib/unites-mesure.api";
import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";
import { Modal } from "@/components/ui/modal";
import {
  emptyUniteMesureForm,
  parseOptionalPositiveFactor,
  validateUniteMesureForm,
  type UniteMesureFieldErrors,
  type UniteMesureFormState,
} from "./uniteMesureForm";

const DIMENSIONS = [
  { id: "masse", label: "Masse" },
  { id: "volume", label: "Volume" },
  { id: "nombre", label: "Nombre (pièce, palette…)" },
  { id: "surface", label: "Surface" },
];

function formFromEditing(editing: UniteMesure): UniteMesureFormState {
  return {
    code: editing.code,
    label: editing.label,
    dimension: editing.dimension,
    facteur_vers_kg: editing.facteur_vers_kg != null ? String(editing.facteur_vers_kg) : "",
    facteur_vers_l: editing.facteur_vers_l != null ? String(editing.facteur_vers_l) : "",
  };
}

const inputClass =
  "w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-indigo-500/30 focus:bg-white";
const inputErrorClass = "border-red-200 bg-red-50/50 focus:border-red-400";

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
  const [form, setForm] = useState<UniteMesureFormState>(() =>
    editing ? formFromEditing(editing) : emptyUniteMesureForm()
  );
  const [fieldErrors, setFieldErrors] = useState<UniteMesureFieldErrors>({});

  const clearError = (key: keyof UniteMesureFormState) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const showMassFactor = form.dimension === "masse";
  const showVolumeFactor = form.dimension === "volume";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateUniteMesureForm(form, !!editing);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      onError?.("Corrigez les champs signalés avant d’enregistrer.");
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const fKg = parseOptionalPositiveFactor(form.facteur_vers_kg);
      const fL = parseOptionalPositiveFactor(form.facteur_vers_l);

      if (editing) {
        await updateUniteMesure(editing.id, {
          label: form.label.trim(),
          dimension: form.dimension,
          facteur_vers_kg: fKg,
          facteur_vers_l: fL,
        });
      } else {
        await createUniteMesure({
          code: form.code.trim(),
          label: form.label.trim(),
          dimension: form.dimension,
          facteur_vers_kg: fKg ?? undefined,
          facteur_vers_l: fL ?? undefined,
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
    <Modal
      isOpen
      onClose={onClose}
      position="right"
      showCloseButton={false}
      className="w-full max-w-2xl rounded-l-[3rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)]"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 items-start justify-between p-12 pb-6">
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="form-scroll min-h-0 flex-1 space-y-8 px-12 py-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Code
              </label>
              <input
                required={!editing}
                disabled={!!editing}
                className={`${inputClass} font-mono tracking-tight disabled:opacity-50 ${fieldErrors.code ? inputErrorClass : ""}`}
                placeholder="Ex. Kg, L, m3"
                value={form.code}
                onChange={(e) => {
                  setForm({ ...form, code: e.target.value });
                  clearError("code");
                }}
              />
              {fieldErrors.code ? (
                <p className="text-[10px] font-bold text-red-600 ml-1">{fieldErrors.code}</p>
              ) : (
                <p className="text-[10px] font-medium text-gray-400 ml-1">
                  Respectez la casse souhaitée (ex. Kg, pas KG).
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                Libellé
              </label>
              <input
                required
                className={`${inputClass} text-base ${fieldErrors.label ? inputErrorClass : ""}`}
                placeholder="Ex. Kilogramme, Litre, Pièce…"
                value={form.label}
                onChange={(e) => {
                  setForm({ ...form, label: e.target.value });
                  clearError("label");
                }}
              />
              {fieldErrors.label ? (
                <p className="text-[10px] font-bold text-red-600 ml-1">{fieldErrors.label}</p>
              ) : (
                <p className="text-[10px] font-medium text-gray-400 ml-1">
                  Nom complet affiché dans les listes et sélecteurs.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                Dimension
              </label>
              <OptionSearchablePicker
                value={form.dimension}
                onChange={(dimension) => {
                  setForm({ ...form, dimension });
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.facteur_vers_kg;
                    delete next.facteur_vers_l;
                    return next;
                  });
                }}
                options={DIMENSIONS}
                placeholder="Choisir une dimension…"
                searchPlaceholder="Rechercher (Masse, Volume…)"
                noResultsText="Aucune dimension"
              />
            </div>

            {(showMassFactor || showVolumeFactor) && (
              <div className="bg-gray-50/80 p-10 rounded-[2.5rem] space-y-8 border border-gray-100">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Settings2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Conversion</span>
                </div>
                <p className="text-[11px] font-medium text-gray-500 leading-relaxed">
                  {showMassFactor
                    ? "Quantité dans cette unité × facteur = équivalent en kilogrammes (ex. 1 T → facteur 1000)."
                    : "Quantité dans cette unité × facteur = équivalent en litres (ex. 1 m³ → facteur 1000)."}
                </p>
                <div className="grid grid-cols-1 gap-6">
                  {showMassFactor && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                        Facteur → kg
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-full bg-transparent border-b-2 py-2 text-xl font-black outline-none transition-all ${
                          fieldErrors.facteur_vers_kg
                            ? "border-red-400 text-red-900"
                            : "border-gray-200 focus:border-indigo-500"
                        }`}
                        placeholder="1"
                        value={form.facteur_vers_kg}
                        onChange={(e) => {
                          setForm({ ...form, facteur_vers_kg: e.target.value });
                          clearError("facteur_vers_kg");
                        }}
                      />
                      {fieldErrors.facteur_vers_kg ? (
                        <p className="text-[10px] font-bold text-red-600">{fieldErrors.facteur_vers_kg}</p>
                      ) : null}
                    </div>
                  )}
                  {showVolumeFactor && (
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">
                        Facteur → L
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-full bg-transparent border-b-2 py-2 text-xl font-black outline-none transition-all ${
                          fieldErrors.facteur_vers_l
                            ? "border-red-400 text-red-900"
                            : "border-gray-200 focus:border-indigo-500"
                        }`}
                        placeholder="1"
                        value={form.facteur_vers_l}
                        onChange={(e) => {
                          setForm({ ...form, facteur_vers_l: e.target.value });
                          clearError("facteur_vers_l");
                        }}
                      />
                      {fieldErrors.facteur_vers_l ? (
                        <p className="text-[10px] font-bold text-red-600">{fieldErrors.facteur_vers_l}</p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-12 border-t border-gray-50 bg-white flex items-center gap-6 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl transition-all flex justify-center items-center gap-2 disabled:opacity-60"
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
    </Modal>
  );
}
