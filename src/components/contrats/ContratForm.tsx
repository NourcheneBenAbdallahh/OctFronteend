"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, ChevronDown, ChevronUp, Check, AlertCircle } from "lucide-react";
import { UniteMesureSearchablePicker } from "@/components/unites-mesure/UniteMesureSearchablePicker";

import { getContratStatutNote } from "@/lib/contratAnalytics";
import { GmailEmailLink } from "@/components/ui/GmailEmailLink";

export const ContratForm = ({
  isOpen,
  editing,
  form,
  setForm,
  onClose,
  onSubmit,
  loading,
  fournisseurs,
  emballages,
  unitesMesure = [],
  onExtractFromFile,
  onDocumentFile,
  extracting,
  hasPendingDocument,
  pendingDocumentFile,
}: any) => {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const isLocked = Number(form.quantite_realisee) > 0;

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep(1);
      setErrors({});
    }
  }

  useEffect(() => {
    if (!isOpen) return;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarW = window.innerWidth - html.clientWidth;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarW > 0) {
      body.style.paddingRight = `${scrollbarW}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validateCurrentStep = () => {
    if (editing) return true; 

    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!form.numero_contrat?.trim()) newErrors.numero_contrat = "La référence est obligatoire";
      if (!form.fournisseur_id) newErrors.fournisseur_id = "Sélectionnez un fournisseur";
      if (!form.emballage_id) newErrors.emballage_id = "Sélectionnez un emballage";
    }

    if (step === 2) {
      if (!form.date_debut) newErrors.date_debut = "Date de début requise";
      if (!form.date_fin) newErrors.date_fin = "Date de fin requise";
      if (!form.montant_ht || Number(form.montant_ht) <= 0) newErrors.montant_ht = "Montant HT requis";
    }

    if (step === 3) {
      if (!form.quantite_contractuelle || Number(form.quantite_contractuelle) <= 0) {
        newErrors.quantite_contractuelle = "La quantité est obligatoire";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (editing || validateCurrentStep()) {
      setStep(s => s + 1);
    }
  };

  const handlePrev = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing || validateCurrentStep()) {
      onSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-y-0 right-0 flex h-full max-h-[100dvh] w-full max-w-xl min-h-0 flex-col overflow-hidden rounded-l-[3rem] bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500">
        {/* HEADER */}
        <div className="shrink-0 p-10 pb-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2 underline decoration-2 underline-offset-4">
                Étape {step} sur 3
              </span>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
                {editing ? "Modifier Contrat" : "Nouvel Engagement"}
              </h2>
            </div>
            <button onClick={onClose} className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={20} /></button>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-[#1C2434]' : 'bg-gray-100'}`} />
            ))}
          </div>
        </div>

        {/* FORM CONTENT */}
        <div className="form-scroll min-h-0 flex-1 px-10 py-4">
          
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Référence */}
              <div className={`border-b-4 pb-4 transition-all ${errors.numero_contrat ? 'border-red-500' : 'border-gray-50 focus-within:border-indigo-500'}`}>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Référence Unique</label>
                <input 
                  disabled={isLocked}
                  className={`w-full text-4xl font-black outline-none tracking-tighter uppercase bg-transparent ${isLocked ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 placeholder:text-gray-100'}`}
                  placeholder="OCT-2026-X"
                  value={form.numero_contrat ?? ""}
                  onChange={(e) => { setForm({ ...form, numero_contrat: e.target.value }); if(errors.numero_contrat) setErrors({}) }}
                />
                {errors.numero_contrat && <p className="text-[10px] font-bold text-red-500 mt-2 italic">{errors.numero_contrat}</p>}
              </div>

              <InputField 
                label="Objet du contrat (Optionnel)" 
                value={form.objet} 
                onChange={(v:any) => setForm({...form, objet:v})} 
                placeholder="Ex: Approvisionnement en Sucre..." 
              />

              {!editing && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Import OCR du contrat (PDF/Image)
                  </label>
                  <div className="rounded-2xl border-2 border-dashed border-indigo-100 bg-indigo-50/40 p-4">
                    <ContractFilePicker
                      disabled={extracting || loading}
                      selectedFile={pendingDocumentFile}
                      onChange={(file) => {
                        onExtractFromFile(file);
                        onDocumentFile?.(file);
                      }}
                    />
                    <p className="mt-2 text-[10px] font-semibold text-indigo-700/80">
                      {extracting
                        ? "Extraction OCR en cours..."
                        : hasPendingDocument
                          ? "Document prêt — il sera enregistré à la validation."
                          : "Le fichier sera conservé comme document du contrat."}
                    </p>
                  </div>
                </div>
              )}

              {(editing || hasPendingDocument) && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Document du contrat
                  </label>
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                    {form.document_contrat && !hasPendingDocument && (
                      <p className="text-[10px] font-bold text-emerald-700">
                        Document existant enregistré.
                      </p>
                    )}
                    <ContractFilePicker
                      disabled={loading}
                      selectedFile={pendingDocumentFile}
                      existingDocumentPath={form.document_contrat}
                      onChange={(file) => onDocumentFile?.(file)}
                    />
                    {hasPendingDocument && (
                      <p className="text-[10px] font-semibold text-indigo-700">
                        Nouveau document sélectionné — enregistrez pour remplacer l&apos;ancien.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Fournisseur" value={form.fournisseur_id} options={fournisseurs} labelKey="raison_sociale" error={errors.fournisseur_id} onChange={(v:any) => setForm({...form, fournisseur_id: v})} disabled={isLocked} />
                <SelectField label="Emballage" value={form.emballage_id} options={emballages} labelKey="name" error={errors.emballage_id} onChange={(v:any) => setForm({...form, emballage_id: v})} disabled={isLocked} />
              </div>
              {form.fournisseur_id && (() => {
                const f = fournisseurs?.find((x: { id: string | number }) => String(x.id) === String(form.fournisseur_id));
                if (!f?.email) return null;
                return (
                  <p className="text-[11px] font-semibold text-gray-500 -mt-4">
                    Contact :{" "}
                    <GmailEmailLink
                      email={f.email}
                      subject={form.numero_contrat ? `Contrat ${form.numero_contrat}` : "Contrat OCT"}
                    />
                  </p>
                );
              })()}

              {/* CONTRÔLE DU STATUT */}
              <div className="pt-4 border-t border-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Statut</label>
                  {isLocked && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                      <AlertCircle size={10} /> Modification restreinte : Engagement en cours d&apos;exécution
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {["ACTIF", "SUSPENDU", "EXPIRE"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={isLocked}
                      onClick={() => setForm({...form, statut: s})}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all ${
                        form.statut === s 
                        ? 'bg-[#1C2434] text-white shadow-lg' 
                        : isLocked ? 'bg-gray-50 text-gray-200 cursor-not-allowed' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Note sur le statut (optionnel)
                  </label>
                  <textarea
                    value={form.note_statut ?? ""}
                    onChange={(e) => setForm({ ...form, note_statut: e.target.value })}
                    placeholder={getContratStatutNote(form.statut) || "Commentaire interne sur l'état du contrat…"}
                    rows={3}
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-semibold outline-none transition-all focus:border-indigo-500/20 focus:bg-white"
                  />
                  <p className="text-[9px] font-semibold text-gray-400 ml-1">
                    Suggestion : {getContratStatutNote(form.statut)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Montant HT (DT)" type="number" value={form.montant_ht} error={errors.montant_ht} onChange={(v:any) => setForm({...form, montant_ht: Number(v)})} disabled={isLocked} />
                <InputField label="Montant TVA (DT)" type="number" value={form.montant_tva} onChange={(v:any) => setForm({...form, montant_tva: Number(v)})} disabled={isLocked} />
              </div>
              <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100/50 space-y-6">
                <InputField label="Date de Signature" type="date" value={form.date_signature} onChange={(v:any) => setForm({...form, date_signature:v})} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Date Début" type="date" value={form.date_debut} error={errors.date_debut} onChange={(v:any) => setForm({...form, date_debut:v})} />
                  <InputField label="Date Fin" type="date" value={form.date_fin} error={errors.date_fin} onChange={(v:any) => setForm({...form, date_fin:v})} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#1C2434] p-8 rounded-[2.5rem] text-white space-y-8 shadow-xl">
                 <div className="grid grid-cols-2 gap-6">
                   <InputFieldDark label="Quantité contractuelle" type="number" value={form.quantite_contractuelle} error={errors.quantite_contractuelle} onChange={(v:any) => setForm({...form, quantite_contractuelle: Number(v)})} disabled={isLocked} />
                   <div className="space-y-2 min-w-0">
                     <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">Unité de quantité</label>
                     <UniteMesureSearchablePicker
                       value={form.unite_quantite ?? ""}
                       onChange={(code) => setForm({ ...form, unite_quantite: code })}
                       unites={unitesMesure}
                       placeholder="Choisir une unité…"
                       disabled={isLocked}
                       variant="dark"
                       allowEmpty
                       emptyLabel="— Non renseigné —"
                       listMaxHeightClassName="max-h-52"
                     />
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <InputFieldDark label="Cautionnement (%)" type="number" value={form.taux_cautionnement} onChange={(v:any) => setForm({...form, taux_cautionnement: Number(v)})} />
                   <InputFieldDark label="Montant cautionnement (DT)" type="number" value={form.montant_cautionnement} onChange={(v:any) => setForm({...form, montant_cautionnement: Number(v)})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                   <InputFieldDark label="Dépassement Max (%)" type="number" value={form.taux_depassement_autorise} onChange={(v:any) => setForm({...form, taux_depassement_autorise: Number(v)})} />
                 </div>
                 <div className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
                   <InputFieldDark label="Pénalité / Jour (%)" type="number" step="0.001" value={form.taux_penalite_retard} onChange={(v:any) => setForm({...form, taux_penalite_retard: Number(v)})} />
                   <InputFieldDark label="Plafond Pénalités (%)" type="number" value={form.plafond_penalite} onChange={(v:any) => setForm({...form, plafond_penalite: Number(v)})} />
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 flex items-center gap-4 border-t border-gray-50 bg-white p-10">
          {step > 1 && (
            <button type="button" onClick={handlePrev} className="h-16 px-8 rounded-2xl border-2 border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all flex items-center gap-2">
              <ChevronLeft size={16} /> Retour
            </button>
          )}
          
          {step < 3 ? (
            <button type="button" onClick={handleNext} className="flex-1 bg-[#1C2434] text-white h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex justify-center items-center gap-2">
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" onClick={handleFinalSubmit} disabled={loading} className="flex-1 bg-emerald-500 text-white h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-600 transition-all flex justify-center items-center gap-2">
              {loading ? "Enregistrement..." : <><Check size={18} /> Confirmer le contrat</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- HELPERS AVEC SUPPORT "DISABLED" ---

const InputField = ({ label, type = "text", value, onChange, placeholder, error, disabled }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      disabled={disabled}
      value={value ?? ""} 
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-2xl border-2 p-4 text-xs font-black outline-none transition-all ${
        disabled ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed' :
        error ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-50 bg-gray-50 focus:border-indigo-500/20 focus:bg-white'
      }`} 
    />
    {error && <p className="text-[9px] font-bold text-red-500 ml-2 italic">{error}</p>}
  </div>
);

const SelectField = ({ label, value, options, onChange, labelKey, error, disabled }: any) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt: any) =>
    String(opt?.[labelKey] ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel =
    options.find((opt: any) => String(opt.id) === String(value))?.[labelKey] || "Sélectionner...";

  return (
    <div className="space-y-2 flex-1">
      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen((v) => !v)}
          className={`w-full rounded-2xl border-2 p-4 text-xs font-black outline-none transition-all text-left flex items-center justify-between ${
            disabled ? 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed' :
            error ? 'border-red-400 bg-red-50 text-red-900' : 'border-gray-50 bg-gray-50 hover:bg-white'
          }`}
        >
          <span className="truncate">{selectedLabel}</span>
          {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {open && !disabled && (
          <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Rechercher ${label.toLowerCase()}...`}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
            />
            <div className="no-scrollbar mt-2 max-h-44 overflow-y-auto overscroll-contain space-y-1 pr-1">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                  !value ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Sélectionner...
              </button>
              {filteredOptions.map((opt: any) => (
                <button
                  key={String(opt.id)}
                  type="button"
                  onClick={() => {
                    onChange(String(opt.id));
                    setOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                    String(value) === String(opt.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {opt[labelKey]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-[9px] font-bold text-red-500 ml-2 italic">{error}</p>}
    </div>
  );
};

function contractFileLabel(
  selectedFile?: File | null,
  existingDocumentPath?: string | null
): string {
  if (selectedFile) return selectedFile.name;
  if (existingDocumentPath) {
    const base = existingDocumentPath.split("/").pop();
    return base ?? "Document enregistré";
  }
  return "Aucun fichier choisi";
}

function ContractFilePicker({
  onChange,
  disabled,
  selectedFile,
  existingDocumentPath,
}: {
  onChange: (file: File) => void;
  disabled?: boolean;
  selectedFile?: File | null;
  existingDocumentPath?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = !!selectedFile || !!existingDocumentPath;
  const label = contractFileLabel(selectedFile, existingDocumentPath);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
        className="rounded-xl border-0 bg-[#1C2434] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-indigo-600 disabled:opacity-50"
      >
        Choisir un fichier
      </button>
      <span
        className={`text-xs font-semibold truncate max-w-full ${
          hasFile ? "text-gray-800" : "text-gray-400"
        }`}
      >
        {label}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onChange(file);
          e.currentTarget.value = "";
        }}
        disabled={disabled}
      />
    </div>
  );
}

const InputFieldDark = ({ label, type = "text", value, onChange, step, error, disabled }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      step={step}
      disabled={disabled}
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-transparent border-b-2 py-2 text-xl font-black outline-none transition-all ${
        disabled ? 'border-white/5 text-gray-600 cursor-not-allowed' :
        error ? 'border-red-500 text-red-400' : 'border-white/10 text-white focus:border-indigo-400'
      }`} 
    />
    {error && <p className="text-[9px] font-bold text-red-400 italic mt-1">{error}</p>}
  </div>
);