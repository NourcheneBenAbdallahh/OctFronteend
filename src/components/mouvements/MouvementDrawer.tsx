"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLotsDisponibles } from "@/lib/mouvement.api";
import { MOUVEMENT_TYPES, needsDestination, needsLot, needsSource } from "@/lib/mouvement.config";
import {
  buildSummary,
  formatQuantity,
  getSelectedLotAvailable,
  validateForm,
  validateQuantityAgainstLot,
} from "@/lib/mouvement.helpers";
import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,
  MouvementFormState,
  MouvementType,
} from "@/types/mouvement";
import { inputClass, Label, selectClass, TypeBadge } from "./mouvement-ui";
import { ChevronRight, ChevronLeft, Package, Truck, ClipboardCheck, ArrowRight, X } from "lucide-react";

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

  // --- Logique Métier (Garder la même que ton drawer) ---
  const selectedLotAvailable = useMemo(() => getSelectedLotAvailable(lots, form.lotId), [lots, form.lotId]);
  const summary = useMemo(() => buildSummary(form, emballages, entrepots, lots), [form, emballages, entrepots, lots]);
  
  useEffect(() => {
    if (!open) { setStep(1); return; }
    if (!form.emballageId || (needsSource(form.type) && !form.sourceId)) return;
    
    setLotsLoading(true);
    fetchLotsDisponibles(form.sourceId, form.emballageId)
      .then(setLots)
      .finally(() => setLotsLoading(false));
  }, [open, form.type, form.sourceId, form.emballageId]);

  const canGoNext = () => {
    if (step === 1) return !!form.type;
    if (step === 2) return !!form.emballageId;
    if (step === 3) {
        const sourceOk = needsSource(form.type) ? !!form.sourceId : true;
        const destOk = needsDestination(form.type) ? !!form.destId : true;
        return sourceOk && destOk;
    }
    return true;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1C2434]/60 backdrop-blur-md" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[40px] bg-white shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header avec Stepper */}
        <div className="border-b border-gray-100 bg-gray-50/50 px-10 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-[1000] uppercase tracking-tighter text-[#1C2434]">
                Nouveau Flux Stock<span className="text-[#00A09D]">.</span>
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Étape {step} sur 4</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-200 transition-colors">
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          {/* Stepper Visual */}
          <div className="flex items-center gap-4">
            {[
              { s: 1, icon: <Package size={18} />, label: "Type" },
              { s: 2, icon: <Package size={18} />, label: "Article" },
              { s: 3, icon: <Truck size={18} />, label: "Logistique" },
              { s: 4, icon: <ClipboardCheck size={18} />, label: "Validation" }
            ].map((item, index) => (
              <div key={item.s} className="flex items-center flex-1">
                <div className={`flex items-center gap-3 transition-all ${step >= item.s ? 'text-[#00A09D]' : 'text-gray-300'}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${step >= item.s ? 'bg-[#00A09D] text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {step > item.s ? "✓" : item.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{item.label}</span>
                </div>
                {index < 3 && <div className={`mx-4 h-[2px] flex-1 rounded-full ${step > item.s ? 'bg-[#00A09D]' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="max-h-[60vh] overflow-y-auto px-10 py-10">
          
          {/* STEP 1: TYPE */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-4">
               {(Object.keys(MOUVEMENT_TYPES) as MouvementType[]).map((type) => {
                  const meta = MOUVEMENT_TYPES[type];
                  return (
                    <button
                      key={type}
                      onClick={() => { setForm(prev => ({ ...prev, type })); setStep(2); }}
                      className={`group relative rounded-3xl border-2 p-6 text-left transition-all ${form.type === type ? 'border-[#00A09D] bg-[#00A09D]/5 ring-4 ring-[#00A09D]/10' : 'border-gray-100 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-3xl">{meta.icon}</span>
                        <TypeBadge type={type} />
                      </div>
                      <h4 className="mt-4 font-black uppercase tracking-tight text-[#1C2434]">{meta.label}</h4>
                      <p className="mt-1 text-xs text-gray-500 leading-relaxed">{meta.description}</p>
                    </button>
                  );
               })}
            </div>
          )}

          {/* STEP 2: ARTICLE */}
          {step === 2 && (
            <div className="max-w-xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4">
               <div className="rounded-[30px] border-2 border-gray-100 p-8">
                  <Label>Sélectionner l'Emballage</Label>
                  <select
                    value={form.emballageId}
                    onChange={(e) => setForm(prev => ({ ...prev, emballageId: e.target.value, lotId: "" }))}
                    className={`${selectClass} mt-4 !py-5 !rounded-2xl`}
                  >
                    <option value="">Choisir un produit...</option>
                    {emballages.map((emb) => <option key={emb.id} value={emb.id}>{emb.code} · {emb.name}</option>)}
                  </select>
               </div>
            </div>
          )}

          {/* STEP 3: LOGISTIQUE */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4">
              <div className="grid gap-6 sm:grid-cols-2">
                {needsSource(form.type) && (
                  <div className="space-y-2">
                    <Label>Entrepôt Source</Label>
                    <select value={form.sourceId} onChange={(e) => setForm(prev => ({ ...prev, sourceId: e.target.value, lotId: "" }))} className={selectClass}>
                      <option value="">Source...</option>
                      {entrepots.map(e => <option key={e.id} value={e.id}>{e.adresse}</option>)}
                    </select>
                  </div>
                )}
                {needsDestination(form.type) && (
                  <div className="space-y-2">
                    <Label>Entrepôt Destination</Label>
                    <select value={form.destId} onChange={(e) => setForm(prev => ({ ...prev, destId: e.target.value }))} className={selectClass}>
                      <option value="">Destination...</option>
                      {entrepots.filter(e => e.id !== form.sourceId).map(e => <option key={e.id} value={e.id}>{e.adresse}</option>)}
                    </select>
                  </div>
                )}
              </div>
              
              <div className="rounded-3xl bg-gray-50 p-6 border border-gray-100">
                <Label>Quantité à mouvementer</Label>
                <input
                  type="number"
                  value={form.quantite}
                  onChange={(e) => setForm(prev => ({ ...prev, quantite: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className={`${inputClass} mt-3 text-2xl font-[1000]`}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* STEP 4: RÉSUMÉ & LOT */}
          {step === 4 && (
            <div className="grid gap-8 lg:grid-cols-2 animate-in fade-in zoom-in-95">
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">Récapitulatif</h5>
                <div className="divide-y divide-gray-100 rounded-3xl border border-gray-100 px-6 bg-white">
                   <SummaryRow label="Flux" value={summary.typeLabel} />
                   <SummaryRow label="Article" value={summary.emballageLabel} />
                   <SummaryRow label="Volume" value={summary.quantiteLabel} />
                   <SummaryRow label="Trajet" value={`${summary.sourceLabel} → ${summary.destLabel}`} />
                </div>
              </div>
              
              <div className="space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-[#00A09D]">Contrôle Lot</h5>
                <div className="rounded-3xl bg-[#1C2434] p-6 text-white shadow-xl">
                  <Label className="!text-gray-400">Affectation Lot</Label>
                  <select 
                    value={form.lotId} 
                    onChange={(e) => setForm(prev => ({ ...prev, lotId: e.target.value }))}
                    className="mt-3 w-full bg-white/10 border-white/20 text-white rounded-xl p-3 outline-none focus:ring-2 ring-[#00A09D]"
                  >
                    <option className="text-black" value="">{lotsLoading ? "Chargement..." : "Sélectionner un lot"}</option>
{lots.map(l => (
  <option 
    className="text-black" 
    key={l.lot_id ?? 'empty'} // 'empty' ou un index pour garantir une clé unique si lot_id est null
    value={l.lot_id ?? ""}    // Utilise "" au lieu de null
  >
    {l.code_lot} (Dispo: {l.stock_disponible})
  </option>
))}                  </select>
                  {selectedLotAvailable && <p className="mt-4 text-xs font-bold text-[#00A09D]">Stock disponible : {formatQuantity(selectedLotAvailable)} unités</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-10 py-8">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-[#1C2434] transition-colors"
          >
            <ChevronLeft size={16} />
            {step === 1 ? "Abandonner" : "Retour"}
          </button>

          <div className="flex gap-4">
            {step < 4 ? (
              <button
                disabled={!canGoNext()}
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-3 bg-[#1C2434] text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#00A09D] transition-all disabled:opacity-20 disabled:grayscale shadow-lg shadow-[#1C2434]/20"
              >
                Étape Suivante
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                disabled={saving}
                onClick={onSubmit}
                className="bg-[#00A09D] text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#1C2434] transition-all shadow-[8px_8px_0px_rgba(28,36,52,0.2)] active:translate-y-1 active:shadow-none"
              >
                {saving ? "Enregistrement..." : "Confirmer le mouvement"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</span>
      <span className="text-sm font-bold text-[#1C2434]">{value}</span>
    </div>
  );
}