import React from "react";
import { X, Save, AlertCircle } from "lucide-react";

export const ContratForm = ({ isOpen, editing, form, setForm, onClose, onSubmit, loading, fournisseurs, emballages }: any) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-xl bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-500 rounded-l-[3rem] flex flex-col">
        
        {/* Header */}
        <div className="p-12 pb-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">Workspace</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {editing ? "Modifier Contrat" : "Nouvel Engagement"}
            </h2>
          </div>
          <button onClick={onClose} className="h-12 w-12 bg-gray-50 hover:bg-gray-100 rounded-[1.2rem] flex items-center justify-center text-gray-400 transition-colors"><X /></button>
        </div>

        <form onSubmit={onSubmit} className="flex-1 overflow-y-auto px-12 py-6 space-y-10 scrollbar-hide">
          
          {/* LARGE PLACEHOLDER DESIGN */}
          <div className="border-b-4 border-gray-50 focus-within:border-indigo-500 pb-4 transition-all">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Référence du Contrat</label>
            <input 
              required
              className="w-full text-5xl font-black text-gray-900 placeholder:text-gray-100 bg-transparent outline-none tracking-tighter"
              placeholder="CONTRAT/2026/00"
              value={form.numero_contrat ?? ""}
              onChange={(e) => setForm({ ...form, numero_contrat: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Fournisseur</label>
              <select 
                required
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all appearance-none"
                value={form.fournisseur_id ?? ""}
                onChange={(e) => setForm({...form, fournisseur_id: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {fournisseurs.map((f: any) => <option key={f.id} value={f.id}>{f.raison_sociale}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Type Emballage</label>
              <select 
                required
                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all appearance-none"
                value={form.emballage_id ?? ""}
                onChange={(e) => setForm({...form, emballage_id: e.target.value})}
              >
                <option value="">Sélectionner...</option>
                {emballages.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
             <InputField label="Début" type="date" value={form.date_debut} onChange={(v:any) => setForm({...form, date_debut:v})} />
             <InputField label="Fin" type="date" value={form.date_fin} onChange={(v:any) => setForm({...form, date_fin:v})} />
          </div>

          <div className="bg-gray-50/80 p-10 rounded-[2.5rem] space-y-8">
            <div className="flex items-center gap-3 mb-2 text-indigo-600">
               <AlertCircle size={18} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Paramètres de Volume</span>
            </div>
            <div className="grid grid-cols-2 gap-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Qté Contractuelle</label>
                 <input type="number" className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-3xl font-black outline-none focus:border-indigo-500 transition-all" value={form.quantite_contractuelle} onChange={(e) => setForm({...form, quantite_contractuelle: Number(e.target.value)})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Marge (%)</label>
                 <input type="number" step="0.01" className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-3xl font-black outline-none focus:border-indigo-500 transition-all" value={form.taux_depassement_autorise} onChange={(e) => setForm({...form, taux_depassement_autorise: Number(e.target.value)})} />
               </div>
            </div>
          </div>
        </form>

        <div className="p-12 border-t border-gray-50 bg-white flex items-center gap-6">
          <button onClick={onClose} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900 transition-colors">Annuler</button>
          <button 
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 bg-gray-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-2"
          >
            {loading ? "Traitement..." : <><Save size={18} /> Enregistrer l'engagement</>}
          </button>
        </div>
      </div>
    </>
  );
};

const InputField = ({ label, type, value, onChange }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all" 
    />
  </div>
);