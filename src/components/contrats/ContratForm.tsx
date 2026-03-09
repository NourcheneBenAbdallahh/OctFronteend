import React from "react";
import { TableContrat } from "@/types/contrat";
import { TableFournisseur } from "@/lib/fournisseurs.api";
import {TableEmballages 
  } from "@/types/emballage";
interface Props {
  isOpen: boolean;
  editing: boolean;
  form: Partial<TableContrat>;
  setForm: React.Dispatch<React.SetStateAction<Partial<TableContrat>>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  // AJOUT DES PROPS ICI POUR RÉGLER L'ERREUR TS(2322)
  fournisseurs: TableFournisseur[];
  emballages: TableEmballages[];
}

export const ContratForm = ({ 
  isOpen, editing, form, setForm, onClose, onSubmit, loading,
  fournisseurs, emballages 
}: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form onSubmit={onSubmit} className="bg-white rounded shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {editing ? "Modifier le Contrat" : "Nouveau Contrat de Stock"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
          <div className="bg-white p-8 shadow-sm border border-gray-200 rounded-sm space-y-8">
            
            {/* Style Odoo : Numéro du Contrat */}
            <div className="border-b border-gray-200 pb-6">
              <label className="text-[10px] font-bold text-[#00A09D] uppercase tracking-widest mb-1 block">
                Numéro du Contrat
              </label>
              <input 
                required
                type="text"
                placeholder="ex: CONTRAT/2026/001"
                className="w-full text-4xl font-extrabold border-none p-0 focus:ring-0 placeholder:text-gray-300 text-gray-800 bg-transparent outline-none"
                value={form.numero_contrat ?? ""}
                onChange={(e) => setForm({ ...form, numero_contrat: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                {/* SÉLECTION FOURNISSEUR */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Fournisseur</label>
                  <select 
                    required
                    className="border-b border-gray-300 py-1 focus:border-[#00A09D] outline-none text-sm bg-transparent"
                    value={form.fournisseur_id ?? ""}
                    onChange={(e) => setForm({...form, fournisseur_id: e.target.value})}
                  >
                    <option value="">Choisir un fournisseur...</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>{f.raison_sociale}</option>
                    ))}
                  </select>
                </div>

                {/* SÉLECTION EMBALLAGE */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Type d'Emballage</label>
                  <select 
                    required
                    className="border-b border-gray-300 py-1 focus:border-[#00A09D] outline-none text-sm bg-transparent"
                    value={form.emballage_id ?? ""}
                    onChange={(e) => setForm({...form, emballage_id: e.target.value})}
                  >
                    <option value="">Choisir un emballage...</option>
                    {emballages.map((e) => (
                      <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Statut</label>
                  <select 
                    className="border-b border-gray-300 py-1 text-sm bg-transparent outline-none" 
                    value={form.statut} 
                    onChange={(e) => setForm({...form, statut: e.target.value as any})}
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="EXPIRE">EXPIRE</option>
                    <option value="SUSPENDU">SUSPENDU</option>
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <Field label="Date Début" type="date" value={form.date_debut} onChange={(v: string) => setForm({...form, date_debut: v})} />
                <Field label="Date Fin" type="date" value={form.date_fin} onChange={(v: string) => setForm({...form, date_fin: v})} />
              </div>
            </div>

            {/* SECTION QUANTITÉS */}
            <div className="bg-gray-50 p-6 rounded grid grid-cols-3 gap-6 border border-gray-100">
              <NumberField 
                label="Qté Contractuelle" 
                value={form.quantite_contractuelle} 
                onChange={(v: number) => setForm({...form, quantite_contractuelle: v})} 
              />
              <NumberField 
                label="Qté Réalisée" 
                value={form.quantite_realisee} 
                onChange={(v: number) => setForm({...form, quantite_realisee: v})} 
              />
              <NumberField 
                label="Taux Dépassement (%)" 
                value={form.taux_depassement_autorise} 
                onChange={(v: number) => setForm({...form, taux_depassement_autorise: v})} 
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-4 border-t flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-6 py-2 border rounded font-bold text-gray-600 uppercase text-xs hover:bg-gray-50">
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-8 py-2 bg-[#00A09D] text-white rounded font-bold uppercase text-xs shadow-md hover:bg-[#008784] disabled:opacity-50"
          >
            {loading ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
};

// --- SOUS-COMPOSANTS TYPÉS ---

const Field = ({ label, value, onChange, type = "text" }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
    <input 
      type={type} 
      className="border-b border-gray-300 py-1 focus:border-[#00A09D] outline-none text-sm bg-transparent" 
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

const NumberField = ({ label, value, onChange }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
    <input 
      type="number" 
      className="bg-transparent border-b border-gray-300 font-bold text-lg outline-none focus:border-[#00A09D]" 
      value={value ?? 0} 
      onChange={(e) => onChange(Number(e.target.value))} 
    />
  </div>
);