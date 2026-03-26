"use client";
import React, { useState, useEffect } from "react";
import { Entrepot } from "@/lib/entrepot.api";
import { X, MapPin, Database, Activity, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  editing: Entrepot | null;
  onSave: (form: Partial<Entrepot>) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function EntrepotsFormModal({ isOpen, editing, onSave, onClose, loading }: Props) {
  const [form, setForm] = useState<Partial<Entrepot>>({
    nom: "", adresse: "", capacite_totale: 0, capacite_disponible: 0, statut: "ACTIF"
  });

  useEffect(() => {
    if (isOpen) setForm(editing || { nom: "", adresse: "", capacite_totale: 0, capacite_disponible: 0, statut: "ACTIF" });
  }, [isOpen, editing]);

  if (!isOpen) return null;

  const utilisationTaux = form.capacite_totale 
    ? Math.round(((Number(form.capacite_totale) - Number(form.capacite_disponible)) / Number(form.capacite_totale)) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001515]/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
        
        {/* HEADER INNOVANT */}
        <div className="relative h-32 bg-[#00A09D] p-8 flex justify-between items-start">
          <div className="z-10">
            <h2 className="text-white text-3xl font-black uppercase tracking-tighter">
              {editing ? "Configuration" : "Déploiement"}<span className="opacity-50 text-black">.</span>
            </h2>
            <p className="text-[#E0F2F2] text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Unité de Stockage Logistique</p>
          </div>
          <button onClick={onClose} className="z-10 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-all">
            <X size={20} />
          </button>
          {/* Motif décoratif en arrière-plan */}
          <div className="absolute top-0 right-0 w-64 h-full bg-black/5 skew-x-12 translate-x-10 pointer-events-none" />
        </div>

        <div className="p-10 space-y-8 bg-[#FBFDFD]">
          {/* IDENTITÉ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du Site</label>
              <div className="relative group">
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]/30 group-focus-within:text-[#00A09D]" size={16} />
                <input 
                  className="w-full pl-12 pr-5 py-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-[#00A09D] outline-none shadow-sm focus:ring-4 focus:ring-[#00A09D]/5 transition-all"
                  value={form.nom ?? ""}
                  onChange={(e) => setForm({...form, nom: e.target.value})}
                  placeholder="NOM DE L'ENTREPOT"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Localisation</label>
              <div className="relative group">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00A09D]/30 group-focus-within:text-[#00A09D]" size={16} />
                <input 
                  className="w-full pl-12 pr-5 py-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black text-[#00A09D] outline-none shadow-sm focus:ring-4 focus:ring-[#00A09D]/5 transition-all"
                  value={form.adresse ?? ""}
                  onChange={(e) => setForm({...form, adresse: e.target.value})}
                  placeholder="ADRESSE PHYSIQUE"
                />
              </div>
            </div>
          </div>

          {/* CAPACITÉ VISUELLE */}
          <div className="bg-white border border-gray-100 p-8 rounded-[2rem] shadow-sm">
             <div className="flex justify-between items-end mb-6">
                <div>
                    <span className="text-[10px] font-black text-[#00A09D] uppercase tracking-widest">Analyse de Capacité</span>
                    <div className="text-3xl font-black text-gray-800">{utilisationTaux}% <span className="text-[10px] text-gray-400 uppercase">utilisé</span></div>
                </div>
                <Activity className="text-[#00A09D] animate-pulse" />
             </div>
             
             <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Total (Unités)</span>
                        <input 
                          type="number"
                          className="text-2xl font-black text-gray-800 outline-none bg-transparent border-b-2 border-gray-50 focus:border-[#00A09D] transition-colors"
                          value={form.capacite_totale ?? ""}
                          onChange={(e) => setForm({...form, capacite_totale: Number(e.target.value)})}
                        />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase">Disponible</span>
                        <input 
                          type="number"
                          className="text-2xl font-black text-gray-800 outline-none bg-transparent border-b-2 border-gray-50 focus:border-[#00A09D] transition-colors"
                          value={form.capacite_disponible ?? ""}
                          onChange={(e) => setForm({...form, capacite_disponible: Number(e.target.value)})}
                        />
                    </div>
                </div>
                
                {/* Visualisation graphique simple */}
                <div className="flex items-center justify-center border-l border-gray-50 pl-10">
                    <div className="relative w-24 h-24 rounded-full border-8 border-gray-50 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle 
                                cx="48" cy="48" r="40" fill="transparent" stroke="#00A09D" strokeWidth="8"
                                strokeDasharray={251} strokeDashoffset={251 - (251 * utilisationTaux) / 100}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <span className="text-xs font-black text-[#00A09D]">{utilisationTaux}%</span>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-10 py-8 border-t border-gray-50 flex justify-between items-center bg-white">
          <div className="flex gap-4">
            {['ACTIF', 'INACTIF'].map((s) => (
              <button 
                key={s} type="button"
                onClick={() => setForm({...form, statut: s})}
                className={`text-[9px] font-black px-4 py-2 rounded-full border transition-all ${form.statut === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-transparent text-gray-400 border-gray-100'}`}
              >
                {s}
              </button>
            ))}
          </div>
          
          <button 
            type="button" 
            onClick={() => onSave(form)} 
            disabled={loading}
            className="bg-[#00A09D] text-white px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-gray-900 transition-all flex items-center gap-2"
          >
            {loading ? "Calcul..." : <><CheckCircle2 size={14}/> Finaliser</>}
          </button>
        </div>
      </div>
    </div>
  );
}