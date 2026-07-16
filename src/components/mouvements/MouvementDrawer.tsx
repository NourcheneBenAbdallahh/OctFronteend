"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLotsDisponibles } from "@/lib/mouvement.api";
import {
  MANUAL_MOUVEMENT_TYPES,
  MOUVEMENT_TYPES,
  needsDestination,
  needsLot,
  needsSource,
} from "@/lib/mouvement.config";
import {
  buildSummary,
  formatQuantity,
  getEntrepotIdForLots,
  getSelectedLotAvailable,
  validateQuantityAgainstLot,
} from "@/lib/mouvement.helpers";
import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,
  MouvementFormState,
  MouvementType,
} from "@/types/mouvement";
import { inputClass, Label, TypeBadge } from "./mouvement-ui";
import { MouvementSearchableSelect } from "./MouvementSearchableSelect";
import {
  ChevronRight,
  ChevronLeft,
  Package,
  Truck,
  ClipboardCheck,
  X,
} from "lucide-react";

export default function MouvementStepperModal({
  open,
  saving,
  form,
  setForm,
  emballages,
  entrepots,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  form: MouvementFormState;
  setForm: React.Dispatch<React.SetStateAction<MouvementFormState>>;
  emballages: EmballageRef[];
  entrepots: EntrepotRef[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [step, setStep] = useState(1);
  const [lots, setLots] = useState<LotDisponible[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);

  const selectedLotAvailable = useMemo(
    () => getSelectedLotAvailable(lots, form.lotId),
    [lots, form.lotId]
  );

  const qtyLotError = useMemo(
    () => validateQuantityAgainstLot(form, selectedLotAvailable),
    [form, selectedLotAvailable]
  );

  const summary = useMemo(
    () => buildSummary(form, emballages, entrepots, lots),
    [form, emballages, entrepots, lots]
  );

  const entrepotPourLots = useMemo(() => getEntrepotIdForLots(form.type, form), [form]);

  useEffect(() => {
    if (!open) return;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [open]);

  /** Réinitialiser l’étape à l’ouverture (évite setState synchrone dans l’effet des lots). */
  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setStep(1));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!form.emballageId || !entrepotPourLots) {
      queueMicrotask(() => setLots([]));
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLotsLoading(true);
      fetchLotsDisponibles(entrepotPourLots, form.emballageId)
        .then((data) => {
          if (!cancelled) setLots(data);
        })
        .finally(() => {
          if (!cancelled) setLotsLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [open, form.type, form.emballageId, form.sourceId, form.destId, entrepotPourLots]);

  const step2Complete = (): boolean => {
    if (!form.emballageId) return false;
    if (!entrepotPourLots) return false;

    if (needsLot(form.type) && !form.lotId) return false;

    if (form.quantite === "" || Number(form.quantite) <= 0) return false;

    if (form.type === "PTE" && !form.motif.trim()) return false;

    if (qtyLotError) return false;

    return true;
  };

  const step3Complete = (): boolean => {
    if (needsDestination(form.type) && needsSource(form.type)) {
      return !!form.destId;
    }
    return true;
  };

  const canGoNext = (): boolean => {
    if (step === 1) return !!form.type;
    if (step === 2) return step2Complete();
    if (step === 3) return step3Complete();
    return true;
  };

  if (!open) return null;

  const compactTrigger = `${inputClass} !py-2.5 !text-base !rounded-2xl sm:!py-3 min-h-[2.75rem] sm:min-h-0 touch-manipulation`;
  const compactInput = `${inputClass} !py-2.5 !text-base !rounded-2xl sm:!py-3 min-h-[2.75rem] sm:min-h-0 touch-manipulation`;

  /** Étapes « légères » : centrer le bloc dans la zone fixe */
  const sparseStep = step === 3 || step === 4;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 bg-[#1C2434]/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="no-scrollbar relative z-[101] flex min-h-[100dvh] w-full items-stretch justify-center overflow-y-auto overflow-x-hidden p-0 sm:min-h-full sm:items-center sm:p-3 md:p-4">
        <div className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-1 flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-gray-200/60 animate-in zoom-in-95 duration-200 sm:h-[min(92vh,840px)] sm:max-h-[min(92vh,840px)] sm:max-w-6xl sm:flex-none sm:rounded-3xl">
        {/* En-tête : fixe, ne défile pas */}
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-[#f8fafb] to-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-4 sm:px-10 sm:py-7 sm:pt-7">
          <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-[1000] uppercase tracking-tighter text-[#1C2434] sm:text-3xl">
                Nouveau Flux Stock<span className="text-[#00A09D]">.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Étape {step} sur 4
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 sm:shrink-0">
              <button
                type="button"
                onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                className="flex items-center gap-2 rounded-full px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:bg-gray-200/80 hover:text-[#1C2434] sm:px-4 sm:text-[11px] touch-manipulation"
              >
                <ChevronLeft size={16} />
                {step === 1 ? "Abandonner" : "Retour"}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  disabled={!canGoNext()}
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-2 rounded-full bg-[#1C2434] px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-[#1C2434]/15 transition-all hover:bg-[#00A09D] disabled:cursor-not-allowed disabled:opacity-30 sm:px-6 sm:text-[11px] touch-manipulation"
                >
                  Étape suivante
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSubmit}
                  className="rounded-full bg-[#00A09D] px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-[#1C2434] disabled:opacity-50 sm:px-7 sm:text-[11px] touch-manipulation"
                >
                  {saving ? "Enregistrement…" : "Confirmer"}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-[#1C2434]"
                aria-label="Fermer"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-1 sm:gap-5">
            {[
              { s: 1, icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Type" },
              { s: 2, icon: <Package className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Article & lot" },
              { s: 3, icon: <Truck className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Logistique" },
              { s: 4, icon: <ClipboardCheck className="h-4 w-4 sm:h-5 sm:w-5" />, label: "Validation" },
            ].map((item, index) => (
              <div key={item.s} className="flex min-w-0 items-center flex-1">
                <div
                  className={`flex min-w-0 items-center gap-1.5 transition-all sm:gap-3 ${step >= item.s ? "text-[#00A09D]" : "text-gray-300"}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black sm:h-10 sm:w-10 sm:text-xs ${step >= item.s ? "bg-[#00A09D] text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    {step > item.s ? "✓" : item.icon}
                  </div>
                  <span className="hidden truncate text-[11px] font-black uppercase tracking-widest text-gray-400 sm:inline">
                    {item.label}
                  </span>
                </div>
                {index < 3 && (
                  <div
                    className={`mx-1 h-[2px] min-w-[0.5rem] flex-1 rounded-full sm:mx-4 ${step > item.s ? "bg-[#00A09D]" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Corps : occupe l’espace sous le header ; scroll interne unique */}
        <div className="flex min-h-0 flex-1 flex-col bg-[#eef3f4] pb-[env(safe-area-inset-bottom,0px)]">
          <div className="form-scroll flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 py-6 sm:px-12 sm:py-12">
            <div
              className={`mx-auto w-full max-w-5xl min-h-0 ${sparseStep ? "flex min-h-full flex-col justify-center py-2" : ""}`}
            >
          {/* STEP 1: TYPE */}
          {step === 1 && (
            <div className="grid max-w-none grid-cols-1 gap-4 sm:gap-7 lg:grid-cols-2 lg:gap-8 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4">
              {MANUAL_MOUVEMENT_TYPES.map((type) => {
                const meta = MOUVEMENT_TYPES[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, type, motif: type === "PTE" ? prev.motif : "" }))}
                    className={`group relative rounded-2xl border-2 bg-white p-5 text-left shadow-sm transition-all active:scale-[0.99] sm:rounded-3xl sm:p-9 min-h-[128px] sm:min-h-[168px] md:min-h-[188px] touch-manipulation ${form.type === type ? "border-[#00A09D] bg-[#00A09D]/5 ring-2 ring-[#00A09D]/10" : "border-gray-100 hover:border-gray-300"}`}
                  >
                    <div className="flex items-start justify-end">
                      <TypeBadge type={type} />
                    </div>
                    <h4 className="mt-3 font-black uppercase tracking-tight text-base text-[#1C2434] pr-1 sm:mt-5 sm:text-lg md:text-xl">
                      {meta.label}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-3 sm:mt-3 sm:text-sm md:text-[15px]">
                      {meta.description}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: ARTICLE + ENTREPÔT POUR LOTS + CONTRÔLE LOT + QUANTITÉ */}
          {step === 2 && (
            <div className="w-full space-y-4 sm:space-y-5 animate-in fade-in slide-in-from-right-4">
              <div
                className={`grid gap-3 sm:gap-4 ${needsSource(form.type) || needsDestination(form.type) ? "md:grid-cols-2" : "grid-cols-1"}`}
              >
                <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-6">
                  <Label>Sélectionner l&apos;emballage</Label>
                  <div className="mt-2">
                    <MouvementSearchableSelect
                      value={form.emballageId}
                      onChange={(id) =>
                        setForm((prev) => ({ ...prev, emballageId: id, lotId: "" }))
                      }
                      options={emballages.map((emb) => ({
                        id: emb.id,
                        label: `${emb.code} · ${emb.name}`,
                        searchText: `${emb.code} ${emb.name}`,
                      }))}
                      placeholder="Choisir un produit…"
                      triggerClassName={compactTrigger}
                    />
                  </div>
                </div>

                {needsSource(form.type) && (
                  <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-6">
                    <Label>Entrepôt source (stock des lots)</Label>
                    <div className="mt-2">
                      <MouvementSearchableSelect
                        value={form.sourceId}
                        onChange={(id) =>
                          setForm((prev) => ({ ...prev, sourceId: id, lotId: "" }))
                        }
                        options={entrepots.map((e) => ({
                          id: e.id,
                          label: e.adresse,
                          searchText: `${e.nom ?? ""} ${e.adresse}`,
                        }))}
                        placeholder="Choisir l&apos;entrepôt source…"
                        triggerClassName={compactTrigger}
                      />
                    </div>
                  </div>
                )}

                {!needsSource(form.type) && needsDestination(form.type) && (
                  <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-6">
                    <Label>Entrepôt destination (stock des lots)</Label>
                    <div className="mt-2">
                      <MouvementSearchableSelect
                        value={form.destId}
                        onChange={(id) =>
                          setForm((prev) => ({ ...prev, destId: id, lotId: "" }))
                        }
                        options={entrepots.map((e) => ({
                          id: e.id,
                          label: e.adresse,
                          searchText: `${e.nom ?? ""} ${e.adresse}`,
                        }))}
                        placeholder="Choisir l&apos;entrepôt…"
                        triggerClassName={compactTrigger}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#00A09D]/30 bg-white p-4 shadow-sm ring-1 ring-[#00A09D]/10 sm:p-6">
                <h5 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#00A09D]">
                  Contrôle lot
                </h5>
                <p className="mt-1 text-[11px] text-gray-500 leading-snug">
                  Quantité ≤ stock du lot pour continuer.
                </p>

                {needsLot(form.type) ? (
                  <>
                    <Label className="mt-3">Lot</Label>
                    <div className="mt-2">
                      <MouvementSearchableSelect
                        value={form.lotId}
                        onChange={(id) => setForm((prev) => ({ ...prev, lotId: id }))}
                        options={lots
                          .filter((l) => l.lot_id)
                          .map((l) => ({
                            id: l.lot_id as string,
                            label: `${l.code_lot ?? "—"} — disponible : ${formatQuantity(l.stock_disponible)}`,
                            searchText: `${l.code_lot ?? ""} ${formatQuantity(l.stock_disponible)}`,
                          }))}
                        placeholder={
                          lotsLoading ? "Chargement des lots…" : "Sélectionner un lot"
                        }
                        disabled={!form.emballageId || !entrepotPourLots || lotsLoading}
                        triggerClassName={compactTrigger}
                        listMaxHeightClassName="max-h-[min(13rem,40vh)] sm:max-h-52"
                      />
                    </div>
                    {!lotsLoading && needsLot(form.type) && form.emballageId && entrepotPourLots && lots.length === 0 && (
                      <p className="mt-3 text-xs font-bold text-amber-700">
                        Aucun lot avec stock positif pour cet entrepôt et cet emballage.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-[11px] text-gray-500 leading-snug">
                    Lot optionnel — sélectionnez-en un pour contrôler la quantité.
                  </p>
                )}

                {!needsLot(form.type) && (
                  <>
                    <Label className="mt-3">Lot (optionnel)</Label>
                    <div className="mt-2">
                      <MouvementSearchableSelect
                        value={form.lotId}
                        onChange={(id) => setForm((prev) => ({ ...prev, lotId: id }))}
                        options={[
                          { id: "", label: "Sans lot lié", searchText: "sans" },
                          ...lots
                            .filter((l) => l.lot_id)
                            .map((l) => ({
                              id: l.lot_id as string,
                              label: `${l.code_lot ?? "—"} — disponible : ${formatQuantity(l.stock_disponible)}`,
                              searchText: `${l.code_lot ?? ""}`,
                            })),
                        ]}
                        placeholder="Sans lot lié"
                        disabled={!form.emballageId || !entrepotPourLots || lotsLoading}
                        triggerClassName={compactTrigger}
                        listMaxHeightClassName="max-h-[min(13rem,40vh)] sm:max-h-52"
                      />
                    </div>
                  </>
                )}

                {form.lotId && selectedLotAvailable != null && (
                  <p className="mt-2 text-xs font-bold text-[#00A09D]">
                    Dispo lot : {formatQuantity(selectedLotAvailable)} u.
                  </p>
                )}

                <Label className="mt-3">Quantité</Label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={form.quantite}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantite: e.target.value === "" ? "" : Number(e.target.value),
                    }))
                  }
                  className={`${compactInput} mt-2 font-[1000]`}
                  placeholder="0.00"
                />
                {qtyLotError && (
                  <p className="mt-2 text-xs font-bold text-red-600" role="alert">
                    {qtyLotError}
                  </p>
                )}

                {form.type === "PTE" && (
                  <>
                    <Label className="mt-4">Motif de la perte</Label>
                    <textarea
                      value={form.motif}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, motif: e.target.value }))
                      }
                      rows={3}
                      maxLength={500}
                      className={`${compactInput} mt-2 resize-y min-h-[5rem]`}
                      placeholder="Ex. casse lors du transport, péremption, vol, erreur de comptage…"
                      required
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Obligatoire — décrivez la cause ou la nature de la perte.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: DESTINATION (si transfert) + DATE */}
          {step === 3 && (
            <div className="w-full space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-right-4">
              {needsDestination(form.type) && needsSource(form.type) && (
                <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-6">
                  <Label>Entrepôt destination</Label>
                  <div className="mt-2 max-w-full">
                    <MouvementSearchableSelect
                      value={form.destId}
                      onChange={(id) => setForm((prev) => ({ ...prev, destId: id }))}
                      options={entrepots
                        .filter((e) => e.id !== form.sourceId)
                        .map((e) => ({
                          id: e.id,
                          label: e.adresse,
                          searchText: `${e.nom ?? ""} ${e.adresse}`,
                        }))}
                      placeholder="Choisir…"
                      triggerClassName={compactTrigger}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100/80 bg-white p-4 shadow-sm sm:p-6">
                <Label>Date du mouvement</Label>
                <input
                  type="datetime-local"
                  value={form.dateMouvement}
                  onChange={(e) => setForm((prev) => ({ ...prev, dateMouvement: e.target.value }))}
                  className={`${compactInput} mt-2 w-full max-w-full`}
                />
              </div>
            </div>
          )}

          {/* STEP 4: RÉCAP */}
          {step === 4 && (
            <div className="animate-in fade-in zoom-in-95 w-full">
              <h5 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-[#00A09D]">
                Récapitulatif
              </h5>
              <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100/80 bg-white px-4 py-1 shadow-sm sm:px-6">
                <SummaryRow label="Flux" value={summary.typeLabel} />
                <SummaryRow label="Article" value={summary.emballageLabel} />
                <SummaryRow label="Lot" value={summary.lotLabel} />
                <SummaryRow label="Volume" value={summary.quantiteLabel} />
                {form.type === "PTE" && summary.motifLabel && (
                  <SummaryRow label="Motif" value={summary.motifLabel} />
                )}
                {summary.trajetLabel ? (
                  <SummaryRow label="Trajet" value={summary.trajetLabel} />
                ) : null}
              </div>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-4">
      <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 sm:text-[11px]">
        {label}
      </span>
      <span className="min-w-0 text-sm font-bold leading-snug text-[#1C2434] break-words sm:max-w-[65%] sm:text-right">
        {value}
      </span>
    </div>
  );
}
