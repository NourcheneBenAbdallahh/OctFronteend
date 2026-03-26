"use client";
import React, { useState, ChangeEvent, DragEvent, FormEvent } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { TableFournisseur } from "@/types/fournisseur";
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
    }
    if (step === 3) {
      if (!form.adresse?.trim()) newErrors.adresse = "L'adresse est requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => { if (validate()) setStep(s => s + 1); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002424]/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-[#00A09D]/10">
        
        {/* HEADER */}
        <div className="px-10 py-6 border-b border-gray-50 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#00A09D] mb-1">
                <div className="w-6 h-[2px] bg-[#00A09D]"></div> Étape {step} sur 3
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                {step === 1 ? "Identité & Logo" : step === 2 ? "Contact" : "Localisation"}<span className="text-[#00A09D]">.</span>
              </h2>
            </div>
            <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 transition-all">
              <X size={20} strokeWidth={3} />
            </button>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= i ? "bg-[#00A09D]" : "bg-gray-100"}`} />
            ))}
          </div>
        </div>

        <div className="p-10 min-h-[460px] bg-[#FBFDFD]">
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
              <div className="grid grid-cols-2 gap-4">
                <Field label="Matricule Fiscale" icon={<Hash size={14}/>} value={form.matricule_fiscale} onChange={(v: string) => setForm(p => ({...p, matricule_fiscale: v}))} required error={errors.matricule_fiscale} />
                <Field label="Registre Entreprise" value={form.registre_entreprise} onChange={(v: string) => setForm(p => ({...p, registre_entreprise: v}))} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <Field label="Email" icon={<Mail size={14}/>} value={form.email} onChange={(v: string) => setForm(p => ({...p, email: v}))} error={errors.email} placeholder="exemple@mail.com" />
              <Field label="Téléphone" icon={<Phone size={14}/>} value={form.telephone} onChange={(v: string) => setForm(p => ({...p, telephone: v}))} error={errors.telephone} />
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                <Field label="Représentant" icon={<UserCheck size={14}/>} value={form.representant_nom} onChange={(v: string) => setForm(p => ({...p, representant_nom: v}))} />
                <Field label="Rôle" value={form.representant_role} onChange={(v: string) => setForm(p => ({...p, representant_role: v}))} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="h-[220px] w-full rounded-[2rem] overflow-hidden border-2 border-gray-100 relative z-0">
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
        <div className="px-10 py-8 border-t border-gray-50 flex justify-between items-center bg-white">
          <button type="button" onClick={step === 1 ? onClose : () => setStep(s => s - 1)} className="text-[10px] font-black uppercase text-gray-400 hover:text-red-500">
            {step === 1 ? "Abandonner" : <><ArrowLeft size={16} className="inline mr-1"/> Précédent</>}
          </button>
          
          <button 
            type="button" 
            onClick={(e) => step < 3 ? handleNext() : (validate() && onSubmit(e as any))} 
            disabled={loading}
            className="bg-gray-900 text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-[#00A09D] transition-all disabled:opacity-50"
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
    <div className="flex flex-col gap-1.5 flex-1 group">
      <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-[#00A09D]'}`}>
        {label} {required && "*"}
      </label>
      <div className="relative">
        {icon && <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${error ? 'text-red-500' : 'text-[#00A09D]/30 group-focus-within:text-[#00A09D]'}`}>{icon}</div>}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-11' : 'px-5'} py-4 bg-white border ${error ? 'border-red-500' : 'border-gray-100'} rounded-2xl text-[11px] font-black text-[#00A09D] outline-none shadow-sm transition-all focus:ring-4 ${error ? 'focus:ring-red-500/5' : 'focus:ring-[#00A09D]/5'}`}
          value={value ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        />
      </div>
      {error && <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 ml-1 mt-1 uppercase"><AlertCircle size={10}/> {error}</span>}
    </div>
  );
}