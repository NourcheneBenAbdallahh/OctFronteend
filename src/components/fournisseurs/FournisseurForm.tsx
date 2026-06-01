"use client";
import React, { useState, ChangeEvent, DragEvent, FormEvent } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TableFournisseur } from "@/types/fournisseur";
import { getFournisseurStatutNote } from "@/lib/fournisseurNotes";
import { 
  X, Save, ArrowRight, ArrowLeft, Hash, Mail, 
  Phone, UserCheck, AlertCircle, UploadCloud, MapPin 
} from "lucide-react";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  isOpen: boolean;
  editing: boolean;
  form: Partial<TableFournisseur>;
  setForm: React.Dispatch<React.SetStateAction<Partial<TableFournisseur>>>;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  loading: boolean;
}

interface FieldProps {
  label: string;
  value: string | number | null | undefined;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  error?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}

export const FournisseurForm = ({ isOpen, editing, form, setForm, onClose, onSubmit, loading }: Props) => {
  const [step, setStep] = useState<number>(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});


// AJOUTE CECI :
React.useEffect(() => {
  if (isOpen) {
    setStep(1); // On revient à la première étape à chaque ouverture
    setErrors({}); // On vide aussi les anciennes erreurs visuelles
  }
}, [isOpen]);
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          if (data.display_name) {
            setForm((prev) => ({ ...prev, adresse: data.display_name, adresse_geocodee: data.display_name }));
            setErrors(prev => ({...prev, adresse: ""}));
          }
        } catch (error) { console.error(error); }
      },
    });
    return null;
  };

  const handleLogoChange = (file: File | null): void => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm((prev) => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (step === 1) {
      if (!form.raison_sociale?.trim()) newErrors.raison_sociale = "La raison sociale est obligatoire";
      if (!form.matricule_fiscale?.trim()) newErrors.matricule_fiscale = "Le matricule fiscal est requis";
    }
    if (step === 2) {
      if (form.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.email)) newErrors.email = "Email invalide (ex: contact@oct.tn)";
      }
      if (form.telephone) {
        const phoneRegex = /^[0-9+ ]{8,}$/;
        if (!phoneRegex.test(form.telephone)) newErrors.telephone = "Numéro invalide";
      }
      if (form.statut === "INACTIF" && !form.note_statut?.trim()) {
        newErrors.note_statut = "Indiquez le motif de désactivation";
      }
    }
    if (step === 3) {
      if (!form.adresse?.trim()) newErrors.adresse = "L'adresse est requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(s => s + 1); };

  return (
    <div className="no-scrollbar fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[#002424]/40 backdrop-blur-md p-3 sm:items-center sm:p-4 animate-in fade-in duration-300">
      <div className="my-auto flex w-full max-w-2xl max-h-[min(100dvh-1.5rem,900px)] flex-col overflow-hidden rounded-2xl border border-[#00A09D]/10 bg-white shadow-2xl sm:rounded-[3rem] sm:max-h-[min(100dvh-2rem,900px)]">
        
        {/* HEADER */}
        <div className="shrink-0 border-b border-gray-50 bg-white px-5 py-4 sm:px-10 sm:py-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#00A09D]">
                <div className="h-[2px] w-6 shrink-0 bg-[#00A09D]"></div> Étape {step} sur 3
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 sm:text-2xl">
                {step === 1 ? "Identité & Logo" : step === 2 ? "Contact & Suivi" : "Localisation"}<span className="text-[#00A09D]">.</span>
              </h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:text-red-500">
              <X size={20} strokeWidth={3} />
            </button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= i ? "bg-[#00A09D]" : "bg-gray-100"}`} />
            ))}
          </div>
        </div>

        <div className="form-scroll min-h-0 flex-1 bg-[#FBFDFD] p-5 sm:p-10">
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
              {/* SECTION LOGO RE-AJOUTÉE ICI */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logo</label>
                <div 
                  onDragOver={(e: DragEvent) => e.preventDefault()}
                  onDrop={(e: DragEvent) => { e.preventDefault(); handleLogoChange(e.dataTransfer.files[0]); }}
                  className="relative group border-2 border-dashed border-gray-100 rounded-[2rem] p-4 flex flex-col items-center justify-center bg-white hover:border-[#00A09D]/30 transition-all cursor-pointer min-h-[110px]"
                >
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e: ChangeEvent<HTMLInputElement>) => handleLogoChange(e.target.files?.[0] || null)} accept="image/*" />
                  {form.logo ? (
                    <div className="flex items-center gap-4 w-full px-4">
                      <img src={form.logo} alt="Preview" className="w-14 h-14 rounded-xl object-cover shadow-sm" />
                      <span className="text-[9px] font-black text-[#00A09D] uppercase">Changer le logo</span>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="text-gray-200 group-hover:text-[#00A09D] transition-colors mb-1" size={28} />
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Glisser le logo ici</span>
                    </>
                  )}
                </div>
              </div>

              <Field label="Raison Sociale" value={form.raison_sociale} onChange={(v: string) => setForm(p => ({...p, raison_sociale: v}))} required error={errors.raison_sociale} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Matricule Fiscale" icon={<Hash size={14}/>} value={form.matricule_fiscale} onChange={(v: string) => setForm(p => ({...p, matricule_fiscale: v}))} required error={errors.matricule_fiscale} />
                <Field label="Registre Entreprise" value={form.registre_entreprise} onChange={(v: string) => setForm(p => ({...p, registre_entreprise: v}))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <Field label="Email" icon={<Mail size={14}/>} value={form.email} onChange={(v: string) => setForm(p => ({...p, email: v}))} error={errors.email} placeholder="exemple@mail.com" />
              <Field label="Téléphone" icon={<Phone size={14}/>} value={form.telephone} onChange={(v: string) => setForm(p => ({...p, telephone: v}))} error={errors.telephone} />
              <div className="grid grid-cols-1 gap-4 border-t border-gray-50 pt-6 sm:grid-cols-2">
                <Field label="Représentant" icon={<UserCheck size={14}/>} value={form.representant_nom} onChange={(v: string) => setForm(p => ({...p, representant_nom: v}))} />
                <Field label="Rôle" value={form.representant_role} onChange={(v: string) => setForm(p => ({...p, representant_role: v}))} />
              </div>

              <div className="pt-6 border-t border-gray-50 space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Statut</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["ACTIF", "INACTIF"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, statut: s }))}
                        className={`rounded-xl px-5 py-2 text-[10px] font-black transition-all sm:px-6 ${
                          form.statut === s
                            ? "bg-gray-900 text-white shadow-lg"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${errors.note_statut ? "text-red-500" : "text-gray-400"}`}>
                    {form.statut === "INACTIF" ? "Motif de désactivation *" : "Note sur le statut (optionnel)"}
                  </label>
                  <textarea
                    value={form.note_statut ?? ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((p) => ({ ...p, note_statut: e.target.value }))
                    }
                    placeholder={getFournisseurStatutNote(form.statut) || "Commentaire interne…"}
                    rows={3}
                    className={`w-full min-w-0 p-3.5 sm:p-4 bg-white border ${errors.note_statut ? "border-red-500" : "border-gray-100"} rounded-2xl text-[11px] font-bold outline-none`}
                  />
                  {errors.note_statut ? (
                    <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 uppercase">
                      <AlertCircle size={10} /> {errors.note_statut}
                    </span>
                  ) : (
                    <p className="text-[9px] font-semibold text-gray-400 ml-1">
                      Suggestion : {getFournisseurStatutNote(form.statut)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">
                    Évaluation fournisseur (optionnel)
                  </label>
                  <textarea
                    value={form.notes_evaluation ?? ""}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                      setForm((p) => ({ ...p, notes_evaluation: e.target.value }))
                    }
                    placeholder="Qualité des livraisons, délais, relation commerciale…"
                    rows={3}
                    className="w-full min-w-0 p-3.5 sm:p-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="relative z-0 h-[min(220px,40vh)] w-full overflow-hidden rounded-2xl border-2 border-gray-100 sm:rounded-[2rem] sm:h-[220px]">
                <MapContainer center={[36.8065, 10.1815]} zoom={11} style={{ height: "100%", width: "100%" }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapClickHandler />
                  {form.latitude && form.longitude && <Marker position={[form.latitude as number, form.longitude as number]} icon={DefaultIcon} />}
                </MapContainer>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adresse *</label>
                <textarea 
                  className={`w-full p-5 bg-white border ${errors.adresse ? 'border-red-500' : 'border-gray-100'} rounded-[1.5rem] text-[11px] font-bold outline-none`}
                  value={form.adresse ?? ""}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setForm(p => ({...p, adresse: e.target.value}))}
                  placeholder="L'adresse s'affichera ici après clic sur la carte..."
                />
                {errors.adresse && <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 uppercase"><AlertCircle size={10}/> {errors.adresse}</span>}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-50 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-8">
          <button type="button" onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="text-center text-[10px] font-black uppercase text-gray-400 hover:text-red-500 sm:text-left">
            {step === 1 ? "Abandonner" : <><ArrowLeft size={16} className="mr-1 inline"/> Précédent</>}
          </button>
          
          <button 
            type="button" 
            onClick={(e) => step < 3 ? handleNext() : (validate() && onSubmit(e as any))} 
            disabled={loading}
            className="w-full rounded-2xl bg-gray-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-[#00A09D] disabled:opacity-50 sm:w-auto sm:px-10 sm:py-5"
          >
            {loading ? "Chargement..." : step === 3 ? "Enregistrer" : "Continuer"}
          </button>
        </div>
      </div>
    </div>
  );
};

function Field({ label, value, onChange, icon, error, required, placeholder, type = "text" }: FieldProps) {
  return (
    <div className="group flex min-w-0 flex-1 flex-col gap-1.5">
      <label className={`ml-1 text-[10px] font-black uppercase tracking-widest ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#00A09D]'}`}>
        {label} {required && "*"}
      </label>
      <div className="relative min-w-0">
        {icon && <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-500' : 'text-[#00A09D]/30 group-focus-within:text-[#00A09D]'}`}>{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full min-w-0 ${icon ? 'pl-11' : 'px-5'} py-3.5 sm:py-4 bg-white border ${error ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-[11px] font-black text-[#00A09D] outline-none shadow-sm transition-all focus:ring-4 ${error ? 'focus:ring-red-500/5' : 'focus:ring-[#00A09D]/5'}`}
          value={value ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      </div>
      {error && <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 mt-1 uppercase"><AlertCircle size={10}/> {error}</span>}
    </div>
  );
}