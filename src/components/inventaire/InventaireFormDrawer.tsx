"use client";

import { useCallback, useEffect, useState } from "react";
import {
  X,
  Save,
  Warehouse,
  Package,
  Hash,
  Calendar,
  ArrowRight,
  Monitor,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CreateInventaireInput, TableInventaire } from "@/types/inventaire";
import { fetchStockTheoriqueInventaire } from "@/lib/inventaire.api";
import { useAuthStore } from "@/store/useAuthStore";
import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";

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
  onValidationError?: (message: string) => void;
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
  onValidationError,
}: Props) {
  const user = useAuthStore((s) => s.user);
  const isEdit = !!item;
  const [step, setStep] = useState<1 | 2>(1);
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

  const loadTheorique = useCallback(async () => {
    if (!form.entrepot_id || !form.emballage_id || !form.date_inventaire) {
      setTheoriquePreview(null);
      return;
    }

    const dateInv = formatForBackend(form.date_inventaire);
    if (!dateInv) return;

    const debut = formatForBackend(form.periode_debut);
    const fin = formatForBackend(form.periode_fin);
    const usePeriode = !!(debut && fin);

    setLoadingTheorique(true);
    setTheoriquePreview(null);

    try {
      const v = await fetchStockTheoriqueInventaire({
        entrepot_id: form.entrepot_id,
        emballage_id: form.emballage_id,
        date_inventaire: dateInv,
        periode_debut: usePeriode ? debut : undefined,
        periode_fin: usePeriode ? fin : undefined,
      });
      setTheoriquePreview(v);
    } catch {
      setTheoriquePreview(null);
    } finally {
      setLoadingTheorique(false);
    }
  }, [
    form.entrepot_id,
    form.emballage_id,
    form.date_inventaire,
    form.periode_debut,
    form.periode_fin,
  ]);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    if (item) {
      setForm({
        entrepot_id: item.entrepot_id,
        emballage_id: item.emballage_id,
        stock_physique: item.stock_physique,
        date_inventaire: item.date_inventaire?.slice(0, 16) ?? "",
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
    if (!open || step !== 1) return;
    if (isEdit) return;
    const t = window.setTimeout(() => {
      void loadTheorique();
    }, 300);
    return () => window.clearTimeout(t);
  }, [open, step, isEdit, loadTheorique]);

  useEffect(() => {
    if (!open || !isEdit) return;
    void loadTheorique();
  }, [open, isEdit, loadTheorique]);

  if (!open) return null;

  const usePeriode = !!(form.periode_debut && form.periode_fin);
  const theoriqueRef = isEdit
    ? (theoriquePreview ?? item?.stock_theorique_fige ?? item?.stock_theorique)
    : theoriquePreview;
  const ecartPreview =
    theoriqueRef != null ? Number(form.stock_physique) - Number(theoriqueRef) : null;
  const isLocked = item?.statut === "REGULARISEE";

  const step1Valid =
    !!form.entrepot_id &&
    !!form.emballage_id &&
    !!form.date_inventaire &&
    !loadingTheorique &&
    theoriqueRef != null;

  const entrepotOptions = entrepots.map((e) => ({ id: e.id, label: e.label }));
  const emballageOptions = emballages.map((e) => ({ id: e.id, label: e.label }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date_inventaire) {
      onValidationError?.("La date d'inventaire est obligatoire.");
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

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-[#1C2434]/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col">
        <div className="px-8 pt-10 pb-6 border-b border-gray-100 flex items-start justify-between shrink-0">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#00A09D]/10 text-[#00A09D] text-[10px] font-[1000] uppercase tracking-widest mb-2">
              {isEdit ? "Modification" : `Étape ${step} / 2`}
            </span>
            <h2 className="text-3xl font-[1000] text-[#1C2434] tracking-tighter">
              {item ? "Modifier l'inventaire" : step === 1 ? "Contexte & dates" : "Comptage réel"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {!isEdit && (
          <div className="px-8 pt-4 flex gap-2 shrink-0">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-[#00A09D]" : "bg-gray-100"}`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-[#00A09D]" : "bg-gray-100"}`}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          {(step === 1 || isEdit) && (
            <>
              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Warehouse size={14} /> Entrepôt
                </label>
                <OptionSearchablePicker
                  value={form.entrepot_id}
                  onChange={(id) => setForm({ ...form, entrepot_id: id })}
                  options={entrepotOptions}
                  placeholder="Choisir un entrepôt"
                  disabled={isLocked || isEdit}
                  searchPlaceholder="Rechercher un entrepôt…"
                  selectedOptionClassName="bg-[#00A09D]/10 text-[#007a78]"
                  dropdownZClassName="z-[1100]"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Package size={14} /> Emballage
                </label>
                <OptionSearchablePicker
                  value={form.emballage_id}
                  onChange={(id) => setForm({ ...form, emballage_id: id })}
                  options={emballageOptions}
                  placeholder="Choisir un emballage"
                  disabled={isLocked || isEdit}
                  searchPlaceholder="Rechercher un emballage…"
                  selectedOptionClassName="bg-[#00A09D]/10 text-[#007a78]"
                  dropdownZClassName="z-[1100]"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Calendar size={14} /> Date d&apos;inventaire
                </label>
                <input
                  type="datetime-local"
                  disabled={isLocked}
                  value={form.date_inventaire}
                  onChange={(e) => setForm({ ...form, date_inventaire: e.target.value })}
                  className="w-full h-14 px-6 rounded-[20px] bg-gray-50 border-2 border-transparent font-bold outline-none focus:border-[#00A09D] disabled:opacity-60"
                  required
                />
                <p className="text-[10px] text-gray-400 ml-2">
                  Le stock système est recalculé à chaque changement de date.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">
                  Période d&apos;audit (optionnel)
                </p>
                <p className="text-[10px] text-gray-400">
                  Si début et fin sont renseignés, le stock système = mouvements sur cette période.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="datetime-local"
                    disabled={isLocked}
                    value={form.periode_debut || ""}
                    onChange={(e) => setForm({ ...form, periode_debut: e.target.value })}
                    className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 text-[12px] font-bold disabled:opacity-60"
                  />
                  <ArrowRight size={20} className="text-gray-300 shrink-0" />
                  <input
                    type="datetime-local"
                    disabled={isLocked}
                    value={form.periode_fin || ""}
                    onChange={(e) => setForm({ ...form, periode_fin: e.target.value })}
                    className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 text-[12px] font-bold disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="p-5 rounded-[24px] bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor size={20} className="text-[#00A09D]" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                      Stock système {usePeriode ? "(période)" : "(à la date)"}
                    </p>
                    <p className="text-2xl font-[1000] text-[#1C2434]">
                      {loadingTheorique
                        ? "…"
                        : theoriqueRef != null
                          ? theoriqueRef
                          : "—"}
                    </p>
                  </div>
                </div>
                {!loadingTheorique && form.entrepot_id && form.emballage_id && theoriqueRef == null && (
                  <span className="text-[10px] font-bold text-amber-600">Sélection incomplète</span>
                )}
              </div>
            </>
          )}

          {(step === 2 || isEdit) && (
            <>
              {!isEdit && theoriqueRef != null && (
                <div className="p-4 rounded-[20px] bg-[#00A09D]/5 border border-[#00A09D]/20 text-sm font-bold text-[#007a78]">
                  Référence système : <span className="font-[1000]">{theoriqueRef}</span>
                  {usePeriode ? " (période)" : ` au ${form.date_inventaire.slice(0, 16)}`}
                </div>
              )}

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase tracking-widest text-[#00A09D] flex items-center gap-2">
                  <Hash size={14} /> Comptage réel
                </label>
                <input
                  type="number"
                  disabled={isLocked}
                  value={form.stock_physique}
                  onChange={(e) =>
                    setForm({ ...form, stock_physique: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-24 text-5xl font-[1000] text-center rounded-[28px] bg-[#1C2434] text-white disabled:opacity-60"
                  required
                />
                {ecartPreview != null && step === 2 && (
                  <p
                    className={`text-center text-sm font-black uppercase tracking-widest ${
                      ecartPreview < 0
                        ? "text-red-500"
                        : ecartPreview > 0
                          ? "text-blue-500"
                          : "text-emerald-600"
                    }`}
                  >
                    Écart prévu : {ecartPreview > 0 ? `+${ecartPreview}` : ecartPreview}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold text-gray-400 ml-4 mb-1 block">
                  Motif d&apos;écart (optionnel)
                </span>
                <input
                  value={form.motif_ecart || ""}
                  disabled={isLocked}
                  onChange={(e) => setForm({ ...form, motif_ecart: e.target.value })}
                  className="w-full h-12 px-6 rounded-full bg-gray-50 font-bold disabled:opacity-60"
                  placeholder="Casse, erreur saisie…"
                />
              </div>
            </>
          )}
        </form>

        <div className="px-8 py-8 border-t border-gray-100 flex flex-col gap-3 shrink-0">
          {!isLocked && !isEdit && step === 1 && (
            <button
              type="button"
              disabled={!step1Valid}
              onClick={() => setStep(2)}
              className="w-full h-16 rounded-[24px] bg-[#1C2434] text-white flex items-center justify-center gap-3 hover:bg-[#00A09D] disabled:opacity-40 transition-all"
            >
              <span className="text-[13px] font-[1000] uppercase tracking-[0.2em]">Suivant</span>
              <ChevronRight size={20} />
            </button>
          )}

          {!isLocked && !isEdit && step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full h-12 rounded-[20px] border border-gray-200 text-gray-500 flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-widest"
            >
              <ChevronLeft size={18} />
              Retour
            </button>
          )}

          {!isLocked && (isEdit || step === 2) && (
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

          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 text-[11px] font-black uppercase text-gray-400"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
