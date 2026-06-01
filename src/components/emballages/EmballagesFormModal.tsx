"use client";

import React, { useEffect, useState } from "react";
import { X, Save, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { updateEmballages, createEmballages } from "@/lib/emballages.api";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import { normalizeEmballages } from "@/types/emballage";
import type { UniteMesure } from "@/types/unite-mesure";
import type { Emballages, TableEmballages } from "@/types/emballage";
import { UniteMesureSearchablePicker } from "@/components/unites-mesure/UniteMesureSearchablePicker";
import { GraphqlRequestError, friendlyGraphqlMessage } from "@/lib/graphqlClient";

const UNIT_FALLBACK: UniteMesure[] = [
  { id: "fb-g", code: "G", label: "Gramme", dimension: "masse", sort_order: 10 },
  { id: "fb-kg", code: "KG", label: "Kilogramme", dimension: "masse", sort_order: 20 },
  { id: "fb-t", code: "T", label: "Tonne (métrique)", dimension: "masse", sort_order: 30 },
  { id: "fb-l", code: "L", label: "Litre", dimension: "volume", sort_order: 50 },
  { id: "fb-m3", code: "M3", label: "Mètre cube", dimension: "volume", sort_order: 60 },
  { id: "fb-u", code: "UNITE", label: "Unité (pièce)", dimension: "nombre", sort_order: 80 },
];

type FormState = {
  code: string;
  name: string;
  type: string;
  material: string;
  status: string;
  poids: string | number;
  largeur: string | number;
  epaisseur_pp: string | number;
  epaisseur_ppc: string | number;
  capacity_value: string | number;
  capacity_unit: string;
};

function initialForm(editing: TableEmballages | null): FormState {
  if (!editing) {
    return {
      code: "",
      name: "",
      type: "",
      material: "",
      status: "ACTIVE",
      poids: 0,
      largeur: 0,
      epaisseur_pp: 0,
      epaisseur_ppc: 0,
      capacity_value: 0,
      capacity_unit: "KG",
    };
  }
  return {
    code: editing.code ?? "",
    name: editing.name ?? "",
    type: editing.type ?? "",
    material: editing.material ?? "",
    status: editing.status ?? "ACTIVE",
    poids: editing.poids ?? 0,
    largeur: editing.largeur ?? 0,
    epaisseur_pp: editing.epaisseur_pp ?? 0,
    epaisseur_ppc: editing.epaisseur_ppc ?? 0,
    capacity_value: editing.capacity_value ?? 0,
    capacity_unit: editing.capacity_unit ?? "KG",
  };
}

function parseNonNegative(v: string | number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (Number.isNaN(n) || n < 0) return Number.NaN;
  return n;
}

function validateStep1(form: FormState, isEdit: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  const name = form.name.trim();
  if (name.length < 2) {
    e.name = "Indiquez un nom d’emballage (au moins 2 caractères).";
  } else if (name.length > 255) {
    e.name = "Le nom est trop long (255 caractères maximum).";
  }
  const type = form.type.trim();
  if (!type) {
    e.type = "Le type est obligatoire (ex. SAC, FILM).";
  } else if (type.length > 50) {
    e.type = "Le type est trop long (50 caractères maximum).";
  }
  if (!isEdit) {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      e.code = "Le code interne est obligatoire.";
    } else if (!/^[A-Z0-9_-]+$/i.test(code)) {
      e.code = "Le code ne peut contenir que des lettres, chiffres, tirets et underscores.";
    } else if (code.length > 50) {
      e.code = "Le code est trop long (50 caractères maximum).";
    }
  }
  return e;
}

function validateStep2(form: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  const poids = parseNonNegative(form.poids);
  const largeur = parseNonNegative(form.largeur);
  const epp = parseNonNegative(form.epaisseur_pp);
  const eppc = parseNonNegative(form.epaisseur_ppc);
  const cap = parseNonNegative(form.capacity_value);

  if (Number.isNaN(poids)) e.poids = "Indiquez un poids valide (nombre ≥ 0).";
  if (Number.isNaN(largeur)) e.largeur = "Indiquez une largeur valide (nombre ≥ 0).";
  if (Number.isNaN(epp)) e.epaisseur_pp = "Indiquez une épaisseur PP valide (nombre ≥ 0).";
  if (Number.isNaN(eppc)) e.epaisseur_ppc = "Indiquez une épaisseur PPC valide (nombre ≥ 0).";
  if (Number.isNaN(cap)) e.capacity_value = "Indiquez une capacité valide (nombre ≥ 0).";

  if (!Number.isNaN(cap) && cap > 0) {
    const u = (form.capacity_unit ?? "").trim();
    if (!u) {
      e.capacity_unit = "Choisissez une unité lorsque la capacité est renseignée.";
    }
  }
  return e;
}

function mapServerFieldErrors(validation: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [rawKey, msg] of Object.entries(validation)) {
    const key = rawKey.replace(/^input\./, "");
    out[key] = friendlyGraphqlMessage(msg);
  }
  return out;
}

export default function EmballagesFormModal({
  editing,
  setRows,
  onClose,
  onSuccess,
}: {
  editing: TableEmballages | null;
  setRows: React.Dispatch<React.SetStateAction<TableEmballages[]>>;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [unitesMesure, setUnitesMesure] = useState<UniteMesure[]>([]);
  const [form, setForm] = useState<FormState>(() => initialForm(editing));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialForm(editing));
    setStep(1);
    setFieldErrors({});
    setSubmitError(null);
  }, [editing]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await listUnitesMesure();
        if (!cancelled) setUnitesMesure(res.unitesMesure ?? []);
      } catch {
        if (!cancelled) setUnitesMesure([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goNext = () => {
    setSubmitError(null);
    const errs = validateStep1(form, !!editing);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setStep(2);
    setFieldErrors({});
  };

  const goBack = () => {
    setStep(1);
    setFieldErrors({});
    setSubmitError(null);
  };

  const persistEmballage = async () => {
    setSubmitError(null);
    const errs2 = validateStep2(form);
    setFieldErrors(errs2);
    if (Object.keys(errs2).length > 0) return;

    setLoading(true);
    try {
      const capVal = parseNonNegative(form.capacity_value);
      const payload = {
        ...form,
        name: form.name.trim(),
        type: form.type.trim(),
        material: form.material.trim() || null,
        code: editing ? form.code : String(form.code).trim().toUpperCase(),
        poids: parseNonNegative(form.poids),
        largeur: parseNonNegative(form.largeur),
        epaisseur_pp: parseNonNegative(form.epaisseur_pp),
        epaisseur_ppc: parseNonNegative(form.epaisseur_ppc),
        capacity_value: Number.isNaN(capVal) ? 0 : capVal,
        capacity_unit:
          !Number.isNaN(capVal) && capVal > 0 ? (form.capacity_unit || "").trim() || null : form.capacity_unit || null,
      };

      if (editing) {
        const res = await updateEmballages(editing.id, payload as Record<string, unknown>);
        const updated = normalizeEmballages(
          (res as { updateEmballage: Emballages }).updateEmballage
        );
        setRows((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)));
        onSuccess?.("Emballage modifié.");
      } else {
        const res = await createEmballages(payload as Parameters<typeof createEmballages>[0]);
        const created = normalizeEmballages(
          (res as { createEmballage: Emballages }).createEmballage
        );
        setRows((prev) => [created, ...prev]);
        onSuccess?.("Emballage créé.");
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof GraphqlRequestError) {
        setSubmitError(err.message);
        const mapped = mapServerFieldErrors(err.validationByField);
        if (Object.keys(mapped).length) {
          setFieldErrors(mapped);
          const hasIdentity = ["name", "code", "type", "material", "status"].some((k) => mapped[k]);
          if (hasIdentity) setStep(1);
          else setStep(2);
        }
      } else {
        const msg = err instanceof Error ? err.message : "";
        setSubmitError(friendlyGraphqlMessage(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const unites = unitesMesure.length ? unitesMesure : UNIT_FALLBACK;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[200]">
      <div
        className="fixed inset-0 z-0 bg-gray-900/40 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        aria-hidden
      />
      <div className="pointer-events-auto fixed inset-y-0 right-0 z-10 flex w-full max-w-2xl flex-col bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] rounded-l-[3rem]">
        <div className="shrink-0 p-12 pb-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">Configuration</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {editing ? "Modifier la fiche" : "Nouveau modèle"}
            </h2>
            <p className="mt-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400">
              Étape {step} sur 2 — {step === 1 ? "Identité" : "Fiche technique"}
            </p>
            <div className="mt-4 flex gap-2">
              <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#00A09D]" : "bg-gray-100"}`} />
              <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#00A09D]" : "bg-gray-100"}`} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-12 bg-gray-50 hover:bg-gray-100 rounded-[1.2rem] flex items-center justify-center text-gray-400 transition-colors"
          >
            <X />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="form-scroll min-h-0 flex-1 space-y-8 px-12 py-6">
            {submitError && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                {submitError}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div
                  className={`border-b-4 pb-4 transition-all ${
                    fieldErrors.name ? "border-red-400" : "border-gray-50 focus-within:border-indigo-500"
                  }`}
                >
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">
                    Désignation commerciale
                  </label>
                  <input
                    className="w-full text-3xl font-black text-gray-900 placeholder:text-gray-100 bg-transparent outline-none tracking-tighter uppercase"
                    placeholder="NOM DE L'EMBALLAGE…"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: "" }));
                    }}
                  />
                  {fieldErrors.name ? <p className="text-[10px] font-bold text-red-600 mt-2">{fieldErrors.name}</p> : null}
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <InputField
                    label="Code interne"
                    value={form.code}
                    onChange={(v) => {
                      setForm({ ...form, code: v });
                      if (fieldErrors.code) setFieldErrors((f) => ({ ...f, code: "" }));
                    }}
                    required={!editing}
                    disabled={!!editing}
                    error={fieldErrors.code}
                  />
                  <InputField
                    label="Type (ex. SAC, FILM)"
                    value={form.type}
                    onChange={(v) => {
                      setForm({ ...form, type: v });
                      if (fieldErrors.type) setFieldErrors((f) => ({ ...f, type: "" }));
                    }}
                    required
                    error={fieldErrors.type}
                  />
                </div>

                <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2 sm:gap-8">
                  <InputField
                    label="Matériau (optionnel)"
                    value={form.material}
                    onChange={(v) => setForm({ ...form, material: v })}
                    error={fieldErrors.material}
                  />
                  <div className="space-y-3">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Statut
                    </label>
                    <select
                      className={`w-full rounded-2xl border-2 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none transition-all focus:bg-white ${
                        fieldErrors.status
                          ? "border-red-200 bg-red-50/40"
                          : "border-gray-50 focus:border-indigo-500/20"
                      }`}
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="ACTIVE">Actif</option>
                      <option value="INACTIVE">Inactif</option>
                    </select>
                    {fieldErrors.status ? (
                      <p className="text-[10px] font-bold text-red-600">{fieldErrors.status}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 text-indigo-600">
                  <Settings2 size={18} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fiche technique</span>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <TechnicalInput
                    label="Poids (kg)"
                    value={form.poids}
                    onChange={(v) => {
                      setForm({ ...form, poids: v });
                      if (fieldErrors.poids) setFieldErrors((f) => ({ ...f, poids: "" }));
                    }}
                    error={fieldErrors.poids}
                  />
                  <TechnicalInput
                    label="Largeur (cm)"
                    value={form.largeur}
                    onChange={(v) => {
                      setForm({ ...form, largeur: v });
                      if (fieldErrors.largeur) setFieldErrors((f) => ({ ...f, largeur: "" }));
                    }}
                    error={fieldErrors.largeur}
                  />
                  <TechnicalInput
                    label="Épais. PP (μ)"
                    value={form.epaisseur_pp}
                    onChange={(v) => {
                      setForm({ ...form, epaisseur_pp: v });
                      if (fieldErrors.epaisseur_pp) setFieldErrors((f) => ({ ...f, epaisseur_pp: "" }));
                    }}
                    error={fieldErrors.epaisseur_pp}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <TechnicalInput
                    label="Épais. PPC (μ)"
                    value={form.epaisseur_ppc}
                    onChange={(v) => {
                      setForm({ ...form, epaisseur_ppc: v });
                      if (fieldErrors.epaisseur_ppc) setFieldErrors((f) => ({ ...f, epaisseur_ppc: "" }));
                    }}
                    error={fieldErrors.epaisseur_ppc}
                  />
                  <TechnicalInput
                    label="Capacité"
                    value={form.capacity_value}
                    onChange={(v) => {
                      setForm({ ...form, capacity_value: v });
                      if (fieldErrors.capacity_value) setFieldErrors((f) => ({ ...f, capacity_value: "" }));
                    }}
                    error={fieldErrors.capacity_value}
                  />
                  <div className="space-y-2 min-w-0">
                    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Unité de capacité</label>
                    <UniteMesureSearchablePicker
                      value={form.capacity_unit ?? ""}
                      onChange={(code) => {
                        setForm({ ...form, capacity_unit: code });
                        if (fieldErrors.capacity_unit) setFieldErrors((f) => ({ ...f, capacity_unit: "" }));
                      }}
                      unites={unites}
                      placeholder="Choisir une unité…"
                      allowEmpty={false}
                      listMaxHeightClassName="max-h-52"
                    />
                    {fieldErrors.capacity_unit ? (
                      <p className="text-[10px] font-bold text-red-600">{fieldErrors.capacity_unit}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 flex items-center gap-4 border-t border-gray-50 bg-white p-12 pt-8">
            <button type="button" onClick={onClose} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900">
              Annuler
            </button>
            {step === 2 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                className="flex items-center gap-2 rounded-2xl border-2 border-gray-200 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50"
              >
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            <div className="flex-1" />
            {step === 1 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={loading}
                className="flex min-w-[12rem] items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-indigo-600"
              >
                Suivant <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => void persistEmballage()}
                className="flex min-w-[12rem] items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-indigo-600"
              >
                {loading ? "Enregistrement…" : (
                  <>
                    <Save size={16} /> Enregistrer
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  required,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{label}</label>
      <input
        required={required}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border-2 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none transition-all focus:bg-white disabled:opacity-50 ${
          error ? "border-red-200 bg-red-50/40" : "border-gray-50 focus:border-indigo-500/20"
        }`}
      />
      {error ? <p className="text-[10px] font-bold text-red-600">{error}</p> : null}
    </div>
  );
}

function TechnicalInput({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        className={`w-full border-b-2 bg-transparent py-2 text-xl font-black outline-none transition-all ${
          error ? "border-red-400 text-red-900" : "border-gray-200 focus:border-indigo-500"
        }`}
        value={value as string | number}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-[10px] font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
