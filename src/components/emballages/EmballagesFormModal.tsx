"use client";
import React, { useState } from "react";
import { X, Save, Settings2 } from "lucide-react";
import { updateEmballages, createEmballages } from "@/lib/emballages.api";
import { normalizeEmballages } from "@/types/emballage";

export default function EmballagesFormModal({ editing, setRows, onClose }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(editing || {
    code: "", name: "", type: "", material: "", status: "ACTIVE",
    poids: 0, largeur: 0, epaisseur_pp: 0, epaisseur_ppc: 0,
    capacity_value: 0, capacity_unit: "KG"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
   try {
  const payload = {
    ...form,
    poids: Number(form.poids),
    largeur: Number(form.largeur),
    epaisseur_pp: Number(form.epaisseur_pp),
    epaisseur_ppc: Number(form.epaisseur_ppc),
    capacity_value: Number(form.capacity_value)
  };

  if (editing) {
    // Cas Modification
    const res = await updateEmballages(editing.id, payload);
    // On utilise le "as any" ici pour bypasser la vérification stricte de l'union
    const updated = normalizeEmballages((res as any).updateEmballage);
    setRows((prev: any) => prev.map((r: any) => String(r.id) === String(updated.id) ? updated : r));
  } else {
    // Cas Création
    const res = await createEmballages(payload as any);
    const created = normalizeEmballages((res as any).createEmballage);
    setRows((prev: any) => [created, ...prev]);
  }
  
  onClose();
} catch (err: any) {
  alert(err?.message || "Erreur de sauvegarde");
}
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-2xl bg-white shadow-[-30px_0_60px_rgba(0,0,0,0.1)] rounded-l-[3rem] flex flex-col">
        
        <div className="p-12 pb-6 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] block mb-2">Configuration</span>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">
              {editing ? "Modifier Fiche" : "Nouveau Modèle"}
            </h2>
          </div>
          <button onClick={onClose} className="h-12 w-12 bg-gray-50 hover:bg-gray-100 rounded-[1.2rem] flex items-center justify-center text-gray-400 transition-colors"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-12 py-6 space-y-10">
          {/* NOM EN LARGE */}
          <div className="border-b-4 border-gray-50 focus-within:border-indigo-500 pb-4 transition-all">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Désignation Commerciale</label>
            <input 
              required
              className="w-full text-4xl font-black text-gray-900 placeholder:text-gray-100 bg-transparent outline-none tracking-tighter uppercase"
              placeholder="NOM DE L'EMBALLAGE..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <InputField label="Code Interne" value={form.code} onChange={(v:any)=>setForm({...form, code:v})} required disabled={!!editing} />
            <InputField label="Type (Ex: Sac, Film)" value={form.type} onChange={(v:any)=>setForm({...form, type:v})} required />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <InputField label="Matériau" value={form.material} onChange={(v:any)=>setForm({...form, material:v})} />
            <div className="space-y-3 text-xs font-black">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Statut</label>
              <select className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 outline-none focus:bg-white" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          {/* SECTION TECHNIQUE */}
          <div className="bg-gray-50/80 p-10 rounded-[2.5rem] space-y-8 border border-gray-100">
            <div className="flex items-center gap-3 text-indigo-600">
               <Settings2 size={18} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fiche Technique Appliquée</span>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <TechnicalInput label="Poids (kg)" value={form.poids} onChange={(v:any)=>setForm({...form, poids:v})} />
              <TechnicalInput label="Largeur (cm)" value={form.largeur} onChange={(v:any)=>setForm({...form, largeur:v})} />
              <TechnicalInput label="Épais. PP (μ)" value={form.epaisseur_pp} onChange={(v:any)=>setForm({...form, epaisseur_pp:v})} />
            </div>

            <div className="grid grid-cols-3 gap-6">
              <TechnicalInput label="Épais. PPC (μ)" value={form.epaisseur_ppc} onChange={(v:any)=>setForm({...form, epaisseur_ppc:v})} />
              <TechnicalInput label="Capacité" value={form.capacity_value} onChange={(v:any)=>setForm({...form, capacity_value:v})} />
              <UnitSelect value={form.capacity_unit} onChange={(v:any)=>setForm({...form, capacity_unit:v})} />

            </div>
          </div>
        </form>

        <div className="p-12 border-t border-gray-50 bg-white flex items-center gap-6">
          <button onClick={onClose} className="text-[11px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900">Annuler</button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gray-900 hover:bg-indigo-600 text-white py-6 rounded-2xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl transition-all flex justify-center items-center gap-2"
          >
            {loading ? "Calcul..." : <><Save size={18} /> Valider la fiche technique</>}
          </button>
        </div>
      </div>
    </>
  );
}

const InputField = ({ label, value, onChange, required, disabled }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{label}</label>
    <input 
      required={required} disabled={disabled}
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black text-gray-900 outline-none focus:border-indigo-500/20 focus:bg-white transition-all disabled:opacity-50" 
    />
  </div>
);

const UnitSelect = ({ value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Unité</label>
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-xl font-black outline-none focus:border-indigo-500 transition-all"
    >
      <option value="KG">KG</option>
      <option value="L">L</option>
      <option value="M3">M³</option>
            <option value="M3">Tonne</option>

      <option value="UNITE">UNITÉ</option>
    </select>
  </div>
);

const TechnicalInput = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{label}</label>
    <input 
      type="number" step="0.01"
      className="w-full bg-transparent border-b-2 border-gray-200 py-2 text-xl font-black outline-none focus:border-indigo-500 transition-all" 
      value={value ?? 0} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

