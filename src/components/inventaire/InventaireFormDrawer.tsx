"use client";

import { useEffect, useState } from "react";
import { X, Save, Warehouse, Package, Hash, Calendar, ArrowRight } from "lucide-react";
import { CreateInventaireInput, TableInventaire } from "@/types/inventaire";

interface Option {
  id: string;
  label: string;
}

interface Props {
  open: boolean;
  item?: TableInventaire | null;
  entrepots: Option[];
  emballages: Option[];
  onClose: () => void;
  onSubmit: (payload: CreateInventaireInput) => Promise<void>;
}

export default function InventaireFormDrawer({
  open,
  item,
  entrepots,
  emballages,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CreateInventaireInput>({
    entrepot_id: "",
    emballage_id: "",
    stock_physique: 0,
    date_inventaire: new Date().toISOString().slice(0, 16),
    periode_debut: "",
    periode_fin: "",
    user_id: "1",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setForm({
        entrepot_id: item.entrepot_id,
        emballage_id: item.emballage_id,
        stock_physique: item.stock_physique,
        date_inventaire: item.date_inventaire?.slice(0, 16),
        periode_debut: item.periode_debut?.slice(0, 16) || "",
        periode_fin: item.periode_fin?.slice(0, 16) || "",
        user_id: item.user_id || "1",
      });
    } else {
      setForm({
        entrepot_id: "",
        emballage_id: "",
        stock_physique: 0,
        date_inventaire: new Date().toISOString().slice(0, 16),
        periode_debut: "",
        periode_fin: "",
        user_id: "1",
      });
    }
  }, [item, open]);

  if (!open) return null;
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!form.date_inventaire) {
    alert("La date d'inventaire est obligatoire.");
    return;
  }

  setSaving(true);

  // Fonction de formatage pour le Backend
  const formatForBackend = (dateStr: string | null | undefined): string | undefined => {
    if (!dateStr) return undefined;
    
    // 1. On remplace le 'T' par un espace
    // 2. On s'assure d'avoir les secondes ':00' si elles manquent
    let formatted = dateStr.replace("T", " ");
    if (formatted.length === 16) {
      formatted = `${formatted}:00`;
    }
    return formatted;
  };

  const payload: CreateInventaireInput = {
    ...form,
    // On nettoie toutes les dates ici
    date_inventaire: formatForBackend(form.date_inventaire) as string, 
    periode_debut: formatForBackend(form.periode_debut),
    periode_fin: formatForBackend(form.periode_fin),

    entrepot_id: String(form.entrepot_id),
    emballage_id: String(form.emballage_id),
    user_id: String(form.user_id || "1"),
    stock_physique: Number(form.stock_physique),
  };

  try {
    await onSubmit(payload);
    onClose();
  } catch (err) {
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      <div className="absolute inset-0 bg-[#1C2434]/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER */}
        <div className="px-8 pt-10 pb-6 border-b border-gray-100 flex items-start justify-between bg-white">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#00A09D]/10 text-[#00A09D] text-[10px] font-[1000] uppercase tracking-widest mb-2">
              Formulaire d'Audit
            </span>
            <h2 className="text-3xl font-[1000] text-[#1C2434] tracking-tighter">
              {item ? "Modifier l'entrée" : "Nouvel Inventaire"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
          
          {/* SECTION : LOCALISATION & PRODUIT */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Warehouse size={14} /> Localisation & Article
            </label>
            
            <div className="relative">
              <select
                value={form.entrepot_id}
                onChange={(e) => setForm({ ...form, entrepot_id: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-[20px] bg-gray-50 border-2 border-transparent focus:border-[#00A09D] focus:bg-white outline-none appearance-none transition-all font-bold text-[#1C2434]"
                required
              >
                <option value="">Sélectionner un entrepôt</option>
                {entrepots.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <Warehouse className="absolute left-4 top-4 text-gray-400" size={20} />
            </div>

            <div className="relative">
              <select
                value={form.emballage_id}
                onChange={(e) => setForm({ ...form, emballage_id: e.target.value })}
                className="w-full h-14 pl-12 pr-4 rounded-[20px] bg-gray-50 border-2 border-transparent focus:border-[#00A09D] focus:bg-white outline-none appearance-none transition-all font-bold text-[#1C2434]"
                required
              >
                <option value="">Sélectionner un emballage</option>
                {emballages.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
              <Package className="absolute left-4 top-4 text-gray-400" size={20} />
            </div>
          </div>

          {/* SECTION : QUANTITÉ PHYSIQUE */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-[#00A09D] flex items-center gap-2">
              <Hash size={14} /> Résultat du comptage
            </label>
            <div className="relative group">
              <input
                type="number"
                value={form.stock_physique}
                onChange={(e) => setForm({ ...form, stock_physique: parseFloat(e.target.value) || 0 })}
                className="w-full h-24 text-5xl font-[1000] text-center rounded-[28px] bg-[#1C2434] text-white border-4 border-transparent focus:border-[#00A09D] outline-none transition-all shadow-xl"
                placeholder="0"
                required
              />
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-widest text-white/40">
                Unités Physiques
              </span>
            </div>
          </div>

          {/* SECTION : TEMPORALITÉ */}
          <div className="space-y-4 pt-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Calendar size={14} /> Période d'Audit
            </label>
            
            <div className="grid grid-cols-1 gap-4">
               <div>
                <span className="text-[10px] font-bold text-gray-400 ml-4 mb-1 block">Date de l'inventaire</span>
                <input
                  type="datetime-local"
                  value={form.date_inventaire}
                  onChange={(e) => setForm({ ...form, date_inventaire: e.target.value })}
                  className="w-full h-12 px-6 rounded-full bg-gray-50 border-2 border-transparent focus:border-[#00A09D] outline-none font-bold text-gray-600"
                  required
                />
               </div>

               <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 ml-4 mb-1 block">Début</span>
                    <input
                      type="datetime-local"
                      value={form.periode_debut || ""}
                      onChange={(e) => setForm({ ...form, periode_debut: e.target.value })}
                      className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border-2 border-transparent focus:border-[#00A09D] outline-none text-[12px] font-bold"
                    />
                  </div>
                  <ArrowRight size={20} className="mt-4 text-gray-300" />
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-gray-400 ml-4 mb-1 block">Fin</span>
                    <input
                      type="datetime-local"
                      value={form.periode_fin || ""}
                      onChange={(e) => setForm({ ...form, periode_fin: e.target.value })}
                      className="w-full h-12 px-4 rounded-[18px] bg-gray-50 border-2 border-transparent focus:border-[#00A09D] outline-none text-[12px] font-bold"
                    />
                  </div>
               </div>
            </div>
          </div>
        </form>

        {/* ACTIONS FOOTER */}
        <div className="px-8 py-8 border-t border-gray-100 flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            type="submit"
            className="w-full h-16 rounded-[24px] bg-[#1C2434] text-white flex items-center justify-center gap-3 hover:bg-[#00A09D] transition-all active:scale-95 disabled:opacity-50 shadow-xl"
          >
            {saving ? (
               <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save size={20} />
                <span className="text-[13px] font-[1000] uppercase tracking-[0.2em]">Enregistrer l'Audit</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
          >
            Abandonner la saisie
          </button>
        </div>
      </div>
    </div>
  );
}