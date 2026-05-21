"use client";

import { useEffect, useState } from "react";
import { Calendar, CalendarRange, Layers, Warehouse } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import {
  currentYear,
  dayScopeBounds,
  todayIsoDay,
  yearOptions,
  yearScopeBounds,
} from "@/lib/inventaire.dates";
import type { InventaireDateMode } from "@/types/inventaire";

type EntrepotOption = { id: string; label: string };

interface Props {
  open: boolean;
  entrepots: EntrepotOption[];
  initialEntrepotId?: string;
  initialMode?: InventaireDateMode;
  initialDay?: string;
  initialYear?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    entrepotId: string;
    scope: "DAY" | "YEAR";
    dateInventaire: string;
    periodeDebut?: string;
    periodeFin?: string;
  }) => void;
}

export default function InventaireGenererEntrepotModal({
  open,
  entrepots,
  initialEntrepotId = "",
  initialMode = "day",
  initialDay,
  initialYear,
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  const [entrepotId, setEntrepotId] = useState(initialEntrepotId);
  const [mode, setMode] = useState<"day" | "year">(initialMode === "year" ? "year" : "day");
  const [pivotDay, setPivotDay] = useState(initialDay || todayIsoDay());
  const [pivotYear, setPivotYear] = useState(initialYear || currentYear());

  useEffect(() => {
    if (!open) return;
    setEntrepotId(initialEntrepotId);
    setMode(initialMode === "year" ? "year" : "day");
    setPivotDay(initialDay || todayIsoDay());
    setPivotYear(initialYear || currentYear());
  }, [open, initialEntrepotId, initialMode, initialDay, initialYear]);

  const entrepotLabel = entrepots.find((e) => e.id === entrepotId)?.label;

  const handleConfirm = () => {
    if (!entrepotId) return;
    if (mode === "year") {
      const b = yearScopeBounds(pivotYear);
      onConfirm({
        entrepotId,
        scope: "YEAR",
        dateInventaire: b.dateInventaire,
        periodeDebut: b.periodeDebut,
        periodeFin: b.periodeFin,
      });
    } else {
      const b = dayScopeBounds(pivotDay);
      onConfirm({
        entrepotId,
        scope: "DAY",
        dateInventaire: b.dateInventaire,
      });
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} className="max-w-lg rounded-[32px] p-8" showCloseButton>
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00A09D]/10 text-[#00A09D]">
          <Layers size={26} />
        </div>
        <h3 className="text-xl font-[1000] text-[#1C2434] tracking-tight">
          Générer inventaire entrepôt
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Une ligne par emballage en stock, avec stock théorique figé et session unique.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-2">
            <Warehouse size={14} className="text-[#00A09D]" />
            Entrepôt
          </label>
          <select
            value={entrepotId}
            onChange={(e) => setEntrepotId(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold outline-none focus:border-[#00A09D]"
          >
            <option value="">— Sélectionner —</option>
            {entrepots.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 p-1 rounded-2xl bg-gray-50 border border-gray-100">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
              mode === "day" ? "bg-white text-[#1C2434] shadow-sm" : "text-gray-400"
            }`}
          >
            <Calendar size={14} />
            Par jour
          </button>
          <button
            type="button"
            onClick={() => setMode("year")}
            className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 ${
              mode === "year" ? "bg-white text-[#1C2434] shadow-sm" : "text-gray-400"
            }`}
          >
            <CalendarRange size={14} />
            Par année
          </button>
        </div>

        {mode === "day" ? (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Date d&apos;inventaire
            </label>
            <input
              type="date"
              value={pivotDay.slice(0, 10)}
              onChange={(e) => setPivotDay(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-bold outline-none focus:border-[#00A09D]"
            />
            <p className="text-xs text-gray-400 mt-2">
              Session : INV-E{entrepotId || "?"}-{pivotDay.slice(0, 10).replace(/-/g, "")}
            </p>
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
              Année de référence
            </label>
            <select
              value={pivotYear}
              onChange={(e) => setPivotYear(e.target.value)}
              className="w-full h-12 px-4 rounded-2xl border border-gray-100 bg-gray-50 text-sm font-black outline-none focus:border-[#00A09D]"
            >
              {yearOptions(10).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-2">
              Période 01/01 → 31/12/{pivotYear}, pointage au 31/12. Session INV-E
              {entrepotId || "?"}-{pivotYear}.
            </p>
          </div>
        )}

        {entrepotLabel && (
          <p className="text-sm font-bold text-[#1C2434] bg-[#00A09D]/5 rounded-2xl px-4 py-3">
            {entrepotLabel}
            {mode === "day"
              ? ` — inventaire du ${pivotDay.slice(0, 10)}`
              : ` — inventaire annuel ${pivotYear}`}
          </p>
        )}
      </div>

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
          onClick={handleConfirm}
          disabled={loading || !entrepotId}
          className="h-12 px-8 rounded-full bg-[#00A09D] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#008f8c] disabled:opacity-40"
        >
          {loading ? "Génération…" : "Générer les lignes"}
        </button>
      </div>
    </Modal>
  );
}
