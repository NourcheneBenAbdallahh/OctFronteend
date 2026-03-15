import React from "react";
import { TableFournisseur } from "@/lib/fournisseurs.api";

interface Props {
  isOpen: boolean;
  editing: boolean;
  form: Partial<TableFournisseur>;
  setForm: React.Dispatch<React.SetStateAction<Partial<TableFournisseur>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const FournisseurForm = ({ isOpen, editing, form, setForm, onClose, onSubmit, loading }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form onSubmit={onSubmit} className="bg-white rounded shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {editing ? "Modifier Fournisseur" : "Nouveau Partenaire Fournisseur"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
          <div className="bg-white p-8 shadow-sm border border-gray-200 rounded-sm space-y-8">
            
            <div className="border-b border-gray-200 pb-6">
              <label className="text-[10px] font-bold text-[#00A09D] uppercase tracking-widest mb-1 block">Raison Sociale</label>
              <input 
                required
                className="w-full text-4xl font-extrabold border-none p-0 focus:ring-0 placeholder:text-gray-200 text-gray-800 bg-transparent outline-none uppercase"
                value={form.raison_sociale ?? ""}
                onChange={(e) => setForm({ ...form, raison_sociale: e.target.value })}
                placeholder="NOM DE L'ENTREPRISE"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                <Field label="Matricule Fiscale" value={form.matricule_fiscale} onChange={(v: string) => setForm({...form, matricule_fiscale: v})} required />
                <Field label="Téléphone" value={form.telephone} onChange={(v: string) => setForm({...form, telephone: v})} />
              </div>

              <div className="space-y-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Statut</label>
                  <select 
                    className="border-b border-gray-300 py-1 text-sm bg-transparent outline-none focus:border-[#00A09D]" 
                    value={form.statut} 
                    onChange={(e) => setForm({...form, statut: e.target.value as any})}
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Adresse Siège</label>
                  <textarea 
                    className="border border-gray-200 p-2 text-sm bg-gray-50 rounded outline-none focus:border-[#00A09D] h-20"
                    value={form.adresse ?? ""}
                    onChange={(e) => setForm({...form, adresse: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-6 py-2 border rounded font-bold text-gray-600 uppercase text-xs hover:bg-gray-50">Annuler</button>
          <button type="submit" disabled={loading} className="px-8 py-2 bg-[#00A09D] text-white rounded font-bold uppercase text-xs shadow-md hover:bg-[#008784] disabled:opacity-50">
            {loading ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", required = false }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
    <input 
      required={required}
      type={type} 
      className="border-b border-gray-300 py-1 focus:border-[#00A09D] outline-none text-sm bg-transparent" 
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);