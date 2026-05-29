"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Entrepot } from "@/lib/entrepot.api";
import {
  X,
  MapPin,
  Zap,
  Power,
  Rocket,
  Layers,
  Box,
  Sparkles,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  editing: Entrepot | null;
  onSave: (form: Partial<Entrepot>) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

type FormState = {
  nom: string;
  adresse: string;
  capacite_totale: number;
  capacite_disponible: number;
  statut: string;
};

type Zone = "identite" | "capacite";
type AdjustMode = "percent" | "units";

const EMPTY_FORM: FormState = {
  nom: "",
  adresse: "",
  capacite_totale: 0,
  capacite_disponible: 0,
  statut: "ACTIF",
};

const GRID = 8;

function toFormState(editing: Entrepot | null): FormState {
  if (!editing) return { ...EMPTY_FORM };
  return {
    nom: editing.nom ?? "",
    adresse: editing.adresse ?? "",
    capacite_totale: Number(editing.capacite_totale ?? 0),
    capacite_disponible: Number(editing.capacite_disponible ?? 0),
    statut: editing.statut ?? "ACTIF",
  };
}

function validateIdentite(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (form.nom.trim().length < 2) errors.nom = "Nom trop court (min. 2 car.)";
  if (form.adresse.trim().length < 5) errors.adresse = "Adresse incomplète";
  return errors;
}

function validateCapacite(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.capacite_totale || form.capacite_totale <= 0) {
    errors.capacite_totale = "Définissez une capacité > 0";
  }
  if (form.capacite_disponible < 0) errors.capacite_disponible = "Valeur invalide";
  if (form.capacite_disponible > form.capacite_totale) {
    errors.capacite_disponible = "Dépasse le total";
  }
  return errors;
}

/** Visualisation grille — cases occupées */
function WarehouseGrid({
  occupationPct,
  active,
  onCellClick,
}: {
  occupationPct: number;
  active: boolean;
  onCellClick?: (pct: number) => void;
}) {
  const filled = Math.round((occupationPct / 100) * GRID * GRID);

  return (
    <div
      className="relative mx-auto"
      style={{
        perspective: "900px",
        transformStyle: "preserve-3d",
      }}
    >
      <div
        className="grid gap-1.5 p-3 rounded-2xl border border-[#00A09D]/20 bg-white/90 shadow-[inset_0_0_30px_rgba(0,160,157,0.08)]"
        style={{
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          transform: "rotateX(52deg) rotateZ(-38deg) scale(0.92)",
          transformOrigin: "center center",
        }}
      >
        {Array.from({ length: GRID * GRID }, (_, i) => {
          const isFilled = i < filled;
          const row = Math.floor(i / GRID);
          const col = i % GRID;
          const delay = (row + col) * 18;
          return (
            <button
              key={i}
              type="button"
              disabled={!active || !onCellClick}
              onClick={() => {
                if (!onCellClick) return;
                const pct = Math.round(((i + 1) / (GRID * GRID)) * 100);
                onCellClick(pct);
              }}
              className={`h-5 w-5 sm:h-6 sm:w-6 rounded-sm transition-all duration-500 ${
                active && onCellClick ? "cursor-pointer hover:scale-110" : "cursor-default"
              } ${
                isFilled
                  ? occupationPct > 80
                    ? "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]"
                    : occupationPct > 50
                      ? "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]"
                      : "bg-[#00A09D] shadow-[0_0_10px_rgba(0,160,157,0.45)]"
                  : "bg-gray-100 border border-gray-200"
              }`}
              style={{ transitionDelay: `${delay}ms` }}
              aria-hidden={!onCellClick}
            />
          );
        })}
      </div>
      <div
        className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-3 w-[85%] rounded-full bg-[#00A09D]/25 blur-md"
        style={{ transform: "rotateX(52deg) rotateZ(-38deg)" }}
      />
    </div>
  );
}

export default function EntrepotsFormModal({
  isOpen,
  editing,
  onSave,
  onClose,
  loading: externalLoading,
}: Props) {
  const isEdit = !!editing;
  const [zone, setZone] = useState<Zone>("identite");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [adjustMode, setAdjustMode] = useState<AdjustMode>("percent");

  const loading = externalLoading ?? saving;

  useEffect(() => {
    if (!isOpen) return;
    setForm(toFormState(editing));
    setZone("identite");
    setFieldErrors({});
    setSaving(false);
    setAdjustMode("percent");
  }, [isOpen, editing]);

  const occupiedUnits = useMemo(() => {
    return Math.max(0, form.capacite_totale - form.capacite_disponible);
  }, [form.capacite_totale, form.capacite_disponible]);

  const occupationPct = useMemo(() => {
    if (!form.capacite_totale) return 0;
    const occ =
      ((form.capacite_totale - form.capacite_disponible) / form.capacite_totale) * 100;
    return Math.min(100, Math.max(0, Math.round(occ)));
  }, [form.capacite_totale, form.capacite_disponible]);

  const bumpPulse = () => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 400);
  };

  const setOccupationPct = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    const total = form.capacite_totale;
    if (!total) return;
    setForm((f) => ({
      ...f,
      capacite_disponible: Math.round(total * (1 - clamped / 100)),
    }));
    bumpPulse();
    if (fieldErrors.capacite_disponible) {
      setFieldErrors((e) => ({ ...e, capacite_disponible: "" }));
    }
  };

  const setTotal = (raw: string) => {
    const total = raw === "" ? 0 : Math.max(0, Number(raw));
    setForm((f) => {
      const wasEmpty = !f.capacite_totale;
      const dispo =
        wasEmpty || f.capacite_disponible > f.capacite_totale
          ? total
          : Math.min(f.capacite_disponible, total);
      return { ...f, capacite_totale: total, capacite_disponible: dispo };
    });
    if (fieldErrors.capacite_totale) {
      setFieldErrors((e) => ({ ...e, capacite_totale: "" }));
    }
  };

  const setDisponibleUnits = (raw: string) => {
    const total = form.capacite_totale;
    if (!total) return;
    const dispo =
      raw === "" ? 0 : Math.min(total, Math.max(0, Math.round(Number(raw))));
    if (Number.isNaN(dispo)) return;
    setForm((f) => ({ ...f, capacite_disponible: dispo }));
    bumpPulse();
    if (fieldErrors.capacite_disponible) {
      setFieldErrors((e) => ({ ...e, capacite_disponible: "" }));
    }
  };

  const setOccupeUnits = (raw: string) => {
    const total = form.capacite_totale;
    if (!total) return;
    const occupe =
      raw === "" ? 0 : Math.min(total, Math.max(0, Math.round(Number(raw))));
    if (Number.isNaN(occupe)) return;
    setForm((f) => ({ ...f, capacite_disponible: total - occupe }));
    bumpPulse();
    if (fieldErrors.capacite_disponible) {
      setFieldErrors((e) => ({ ...e, capacite_disponible: "" }));
    }
  };

  const goCapacite = () => {
    const errs = validateIdentite(form);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setZone("capacite");
  };

  const handleSubmit = async () => {
    const e1 = validateIdentite(form);
    const e2 = validateCapacite(form);
    const all = { ...e1, ...e2 };
    setFieldErrors(all);
    if (Object.keys(e1).length > 0) {
      setZone("identite");
      return;
    }
    if (Object.keys(e2).length > 0) {
      setZone("capacite");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        nom: form.nom.trim(),
        adresse: form.adresse.trim(),
        capacite_totale: form.capacite_totale,
        capacite_disponible: form.capacite_disponible,
        statut: form.statut,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const displayName = form.nom.trim() || "—";
  const isActive = form.statut === "ACTIF";

  return (
    <div className="pointer-events-auto fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6">
      <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .scanline::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 160, 157, 0.35), transparent);
          animation: scanline 4s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {/* Fond — aligné page Entrepôts (#F0F4F4) */}
      <div
        className="fixed inset-0 z-0 bg-[#1C2434]/40 backdrop-blur-sm"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && !loading) onClose();
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,160,157,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,160,157,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-1/4 -left-32 h-80 w-80 rounded-full bg-[#00A09D]/15 blur-[80px]" />
        <div className="absolute bottom-1/4 -right-32 h-80 w-80 rounded-full bg-[#00A09D]/10 blur-[80px]" />
      </div>

      {/* Carte principale */}
      <div
        className={`relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-2xl lg:max-h-[90vh] lg:flex-row ${
          pulse ? "ring-2 ring-[#00A09D]/40" : ""
        }`}
      >
        {/* ——— Panneau visuel (gauche) ——— */}
        <div className="scanline relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#E0F2F2] via-[#F0F4F4] to-white p-6 sm:p-8 lg:w-[44%] lg:min-h-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(0,160,157,0.12),transparent_55%)]" />

          <div className="relative z-10">
            <div className="mb-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00A09D]/25 bg-[#00A09D]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-[#007a78]">
                <Sparkles size={10} className="text-[#00A09D]" />
                {isEdit ? "Reconfig" : "Nouveau site"}
              </span>
              <span
                className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${
                  isActive
                    ? "bg-[#00A09D]/15 text-[#007a78]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[#00A09D] animate-pulse" : "bg-gray-400"}`}
                />
                {isActive ? "Actif" : "Inactif"}
              </span>
            </div>

            <h2 className="text-3xl font-black uppercase leading-[0.95] tracking-tighter text-[#1C2434] sm:text-4xl">
              {displayName}
            </h2>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <MapPin size={11} className="mt-0.5 shrink-0 text-[#00A09D]" />
              <span className="line-clamp-2">
                {form.adresse.trim() || "Positionnez le site sur la carte →"}
              </span>
            </p>
          </div>

          {/* Grille 3D */}
          <div
            className="relative z-10 my-6 flex flex-1 items-center justify-center py-4"
            style={{ animation: "float 6s ease-in-out infinite" }}
          >
            <WarehouseGrid
              occupationPct={zone === "capacite" ? occupationPct : 0}
              active={zone === "capacite" && !!form.capacite_totale}
              onCellClick={
                zone === "capacite" && form.capacite_totale ? setOccupationPct : undefined
              }
            />
          </div>

          {/* Jauges live */}
          <div className="relative z-10 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-100 bg-white/90 p-3 shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Total</p>
              <p className="text-lg font-black tabular-nums text-[#1C2434]">
                {form.capacite_totale
                  ? form.capacite_totale.toLocaleString("fr-FR")
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-[#00A09D]/25 bg-[#00A09D]/10 p-3 shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-[#007a78]">
                Libre
              </p>
              <p className="text-lg font-black tabular-nums text-[#00A09D]">
                {form.capacite_totale
                  ? form.capacite_disponible.toLocaleString("fr-FR")
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-white/90 p-3 shadow-sm">
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Occupé</p>
              <p
                className={`text-lg font-black tabular-nums ${
                  occupationPct > 80 ? "text-red-500" : occupationPct > 50 ? "text-amber-500" : "text-[#1C2434]"
                }`}
              >
                {zone === "capacite" && form.capacite_totale ? `${occupationPct}%` : "—"}
              </p>
            </div>
          </div>

          {zone === "capacite" && form.capacite_totale > 0 && (
            <p className="relative z-10 mt-3 text-center text-[9px] font-bold uppercase tracking-widest text-gray-400">
              Cliquez les cases pour définir le remplissage
            </p>
          )}
        </div>

        {/* ——— Panneau formulaire (droite) ——— */}
        <div className="flex flex-1 flex-col bg-white lg:min-h-0">
          {/* Nav zones */}
          <div className="flex shrink-0 items-center gap-1 border-b border-gray-100 p-4 sm:p-5">
            {(
              [
                { id: "identite" as Zone, label: "01 · Signal", icon: MapPin },
                { id: "capacite" as Zone, label: "02 · Volume", icon: Layers },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  if (id === "capacite") goCapacite();
                  else setZone("identite");
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  zone === id
                    ? "bg-[#00A09D] text-white shadow-md"
                    : "text-gray-400 hover:bg-[#F0F4F4]"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 hover:bg-gray-200 disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
            {zone === "identite" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
                    Désignation du site
                  </label>
                  <input
                    autoFocus
                    value={form.nom}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, nom: e.target.value }));
                      if (fieldErrors.nom) setFieldErrors((er) => ({ ...er, nom: "" }));
                    }}
                    placeholder="ENTREPÔT ATLAS…"
                    className={`w-full border-b-4 bg-transparent pb-2 text-3xl font-black uppercase tracking-tighter text-[#1C2434] outline-none placeholder:text-gray-200 ${
                      fieldErrors.nom ? "border-red-400" : "border-gray-100 focus:border-[#00A09D]"
                    }`}
                  />
                  {fieldErrors.nom && (
                    <p className="mt-2 text-xs font-bold text-red-500">{fieldErrors.nom}</p>
                  )}
                </div>

                <div className="relative">
                  <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                    Coordonnées GPS / Adresse
                  </label>
                  <div className="relative overflow-hidden rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white p-1 focus-within:border-[#00A09D]">
                    <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
                      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
                            <circle cx="2" cy="2" r="1" fill="#00A09D" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                      </svg>
                    </div>
                    <textarea
                      rows={3}
                      value={form.adresse}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, adresse: e.target.value }));
                        if (fieldErrors.adresse) setFieldErrors((er) => ({ ...er, adresse: "" }));
                      }}
                      placeholder="12 Zone Industrielle, Casablanca…"
                      className={`relative w-full resize-none bg-transparent px-5 py-4 text-sm font-bold text-gray-800 outline-none ${
                        fieldErrors.adresse ? "text-red-700" : ""
                      }`}
                    />
                    <MapPin
                      className="absolute bottom-4 right-4 text-[#00A09D]/30"
                      size={32}
                    />
                  </div>
                  {fieldErrors.adresse && (
                    <p className="mt-2 text-xs font-bold text-red-500">{fieldErrors.adresse}</p>
                  )}
                </div>

                {/* Interrupteur statut */}
                <div>
                  <p className="mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                    Alimentation du site
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        statut: f.statut === "ACTIF" ? "INACTIF" : "ACTIF",
                      }))
                    }
                    className={`group relative flex w-full items-center gap-5 overflow-hidden rounded-[1.75rem] border-2 p-5 transition-all ${
                      isActive
                        ? "border-[#00A09D] bg-[#00A09D]/5"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div
                      className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all ${
                        isActive
                          ? "bg-[#00A09D] text-white shadow-[0_0_30px_rgba(0,160,157,0.5)]"
                          : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute inset-0 rounded-2xl bg-[#00A09D]"
                          style={{ animation: "pulse-ring 1.5s ease-out infinite" }}
                        />
                      )}
                      <Power size={28} className="relative z-10" />
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-black uppercase tracking-tight text-gray-900">
                        {isActive ? "Site opérationnel" : "Site en veille"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isActive
                          ? "Mouvements et inventaires autorisés"
                          : "Aucune opération logistique"}
                      </p>
                    </div>
                    <div
                      className={`ml-auto h-8 w-14 shrink-0 rounded-full p-1 transition-colors ${
                        isActive ? "bg-[#00A09D]" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                          isActive ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {zone === "capacite" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <label className="mb-3 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
                    <Box size={12} /> Capacité maximale
                  </label>
                  <div className="flex items-end gap-3">
                    <input
                      type="number"
                      min={1}
                      value={form.capacite_totale || ""}
                      onChange={(e) => setTotal(e.target.value)}
                      placeholder="0"
                      className={`w-full bg-transparent text-6xl font-black tabular-nums tracking-tighter text-[#1C2434] outline-none placeholder:text-gray-100 ${
                        fieldErrors.capacite_totale ? "text-red-500" : ""
                      }`}
                    />
                    <span className="mb-3 shrink-0 text-sm font-black uppercase text-gray-300">
                      u.
                    </span>
                  </div>
                  {fieldErrors.capacite_totale ? (
                    <p className="text-xs font-bold text-red-500">{fieldErrors.capacite_totale}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">
                      Unités de stockage que le site peut absorber
                    </p>
                  )}
                </div>

                {/* Répartition — % ou unités */}
                <div className="rounded-[2rem] border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-6 sm:p-8">
                  <div className="mb-6 flex items-center justify-between gap-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                      Répartition du stock
                    </p>
                    <div className="flex rounded-xl bg-[#F0F4F4] p-1">
                      <button
                        type="button"
                        disabled={!form.capacite_totale}
                        onClick={() => setAdjustMode("percent")}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                          adjustMode === "percent"
                            ? "bg-white text-[#00A09D] shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        %
                      </button>
                      <button
                        type="button"
                        disabled={!form.capacite_totale}
                        onClick={() => setAdjustMode("units")}
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                          adjustMode === "units"
                            ? "bg-white text-[#00A09D] shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        Unités
                      </button>
                    </div>
                  </div>

                  {form.capacite_totale > 0 && (
                    <p className="mb-5 text-center text-[10px] font-bold text-gray-500">
                      <span className="text-[#00A09D]">
                        {form.capacite_disponible.toLocaleString("fr-FR")}
                      </span>{" "}
                      libres ·{" "}
                      <span className="text-gray-700">
                        {occupiedUnits.toLocaleString("fr-FR")}
                      </span>{" "}
                      occupées ·{" "}
                      <span className="text-gray-400">
                        {form.capacite_totale.toLocaleString("fr-FR")} total
                      </span>
                    </p>
                  )}

                  {adjustMode === "percent" ? (
                    <>
                      <div className="relative mx-auto h-44 w-44">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            fill="none"
                            stroke={
                              occupationPct > 80
                                ? "#ef4444"
                                : occupationPct > 50
                                  ? "#f59e0b"
                                  : "#00A09D"
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={264}
                            strokeDashoffset={264 - (264 * occupationPct) / 100}
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black tabular-nums text-[#1C2434]">
                            {occupationPct}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            % occupé
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={occupationPct}
                        disabled={!form.capacite_totale}
                        onChange={(e) => setOccupationPct(Number(e.target.value))}
                        className="mt-6 w-full accent-[#00A09D] disabled:opacity-30"
                      />

                      <div className="mt-4 flex w-full justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex items-center gap-1">
                          <Zap size={10} className="text-[#00A09D]" /> Vide
                        </span>
                        <span>Saturé</span>
                      </div>

                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {[0, 25, 50, 75, 100].map((p) => (
                          <button
                            key={p}
                            type="button"
                            disabled={!form.capacite_totale}
                            onClick={() => setOccupationPct(p)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-600 transition-all hover:border-[#00A09D] hover:bg-[#00A09D]/5 hover:text-[#00A09D] disabled:opacity-30"
                          >
                            {p === 0 ? "Vide" : p === 100 ? "Plein" : `${p}%`}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border-2 border-[#00A09D]/20 bg-[#00A09D]/5 p-4">
                          <label
                            htmlFor="entrepot-dispo"
                            className="mb-2 block text-[9px] font-black uppercase tracking-widest text-[#007a78]"
                          >
                            Places disponibles
                          </label>
                          <div className="flex items-end gap-2">
                            <input
                              id="entrepot-dispo"
                              type="number"
                              min={0}
                              max={form.capacite_totale || undefined}
                              step={1}
                              value={form.capacite_totale ? form.capacite_disponible : ""}
                              disabled={!form.capacite_totale}
                              onChange={(e) => setDisponibleUnits(e.target.value)}
                              className="w-full bg-transparent text-4xl font-black tabular-nums text-[#00A09D] outline-none disabled:opacity-40"
                            />
                            <span className="mb-1 shrink-0 text-xs font-black uppercase text-[#00A09D]/60">
                              u.
                            </span>
                          </div>
                        </div>

                        <div className="rounded-2xl border-2 border-gray-100 bg-white p-4">
                          <label
                            htmlFor="entrepot-occupe"
                            className="mb-2 block text-[9px] font-black uppercase tracking-widest text-gray-400"
                          >
                            Places occupées
                          </label>
                          <div className="flex items-end gap-2">
                            <input
                              id="entrepot-occupe"
                              type="number"
                              min={0}
                              max={form.capacite_totale || undefined}
                              step={1}
                              value={form.capacite_totale ? occupiedUnits : ""}
                              disabled={!form.capacite_totale}
                              onChange={(e) => setOccupeUnits(e.target.value)}
                              className="w-full bg-transparent text-4xl font-black tabular-nums text-[#1C2434] outline-none disabled:opacity-40"
                            />
                            <span className="mb-1 shrink-0 text-xs font-black uppercase text-gray-300">
                              u.
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-center text-[10px] text-gray-400">
                        Modifier l&apos;une valeur met à jour l&apos;autre et la grille à gauche.
                      </p>

                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          { label: "Tout libre", dispo: form.capacite_totale },
                          {
                            label: "Moitié",
                            dispo: Math.round(form.capacite_totale / 2),
                          },
                          { label: "Complet", dispo: 0 },
                        ].map(({ label, dispo }) => (
                          <button
                            key={label}
                            type="button"
                            disabled={!form.capacite_totale}
                            onClick={() => setDisponibleUnits(String(dispo))}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-gray-600 transition-all hover:border-[#00A09D] hover:bg-[#00A09D]/5 hover:text-[#00A09D] disabled:opacity-30"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fieldErrors.capacite_disponible && (
                    <p className="mt-4 text-center text-xs font-bold text-red-500">
                      {fieldErrors.capacite_disponible}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shrink-0 border-t border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              {zone === "capacite" && (
                <button
                  type="button"
                  onClick={() => setZone("identite")}
                  disabled={loading}
                  className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-800"
                >
                  ← Signal
                </button>
              )}
              <div className="flex-1" />
              {zone === "identite" ? (
                <button
                  type="button"
                  onClick={goCapacite}
                  disabled={loading}
                  className="group flex items-center gap-3 rounded-2xl border-2 border-gray-900 bg-white px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-900 shadow-[8px_8px_0px_rgba(0,160,157,0.25)] transition-all hover:bg-gray-900 hover:text-white disabled:opacity-50"
                >
                  Calibrer le volume
                  <Layers size={16} className="group-hover:rotate-12 transition-transform" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={loading}
                  className="group flex items-center gap-3 rounded-2xl bg-[#00A09D] px-8 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[8px_8px_0px_rgba(0,160,157,0.3)] transition-all hover:bg-[#008f8c] disabled:opacity-50"
                >
                  {loading ? (
                    "Transmission…"
                  ) : (
                    <>
                      {isEdit ? "Mettre à jour" : "Déployer le site"}
                      <Rocket
                        size={16}
                        className="group-hover:-translate-y-1 group-hover:translate-x-0.5 transition-transform"
                      />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
