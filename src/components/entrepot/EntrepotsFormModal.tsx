import { useState } from "react";
import { Entrepot } from "@/lib/entrepot.api";

interface EntrepotsFormModalProps {
  editing: Entrepot | null;
  onSave: (form: Partial<Entrepot>) => void;
  onClose: () => void;
}

interface InputProps {
  label: string;
  value: string | number | null | undefined; // Ajout de null ici pour la sécurité
  onChange: (v: string) => void;
  type?: "text" | "number";
}

export default function EntrepotsFormModal({ editing, onSave, onClose }: EntrepotsFormModalProps) {
  const [form, setForm] = useState<Partial<Entrepot>>(editing || {
    nom: "",
    adresse: "", 
    capacite_totale: undefined, 
    capacite_disponible: undefined, 
    statut: "ACTIF"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">{editing ? "Modifier l'Entrepôt" : "Nouvel Entrepôt"}</h2>
          <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">×</button>
        </div>

        <div className="p-8 bg-[#F8F9FA]">
          <div className="bg-white p-6 border border-gray-200 rounded-sm space-y-6 shadow-sm">
            
            {/* --- SECTION IDENTIFICATION --- */}
            <div className="space-y-4 border-b border-gray-100 pb-6">
              <div>
                <label className="text-[10px] font-bold text-[#00A09D] uppercase block mb-1">Nom de l'entrepôt</label>
                <input 
                  className="w-full text-2xl font-bold outline-none border-none p-0 focus:ring-0 placeholder:text-gray-200 text-gray-800"
                  value={form.nom ?? ""}
                  onChange={(e) => setForm({...form, nom: e.target.value})}
                  placeholder="Ex: Entrepôt Principal"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Adresse / Localisation</label>
                <input 
                  className="w-full text-lg font-medium outline-none border-none p-0 focus:ring-0 placeholder:text-gray-200 text-gray-600"
                  value={form.adresse ?? ""}
                  onChange={(e) => setForm({...form, adresse: e.target.value})}
                  placeholder="Ex: 42 Rue de la Logistique, Tunis"
                />
              </div>
            </div>

            {/* --- SECTION DETAILS --- */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Input 
                  label="Capacité Totale" 
                  type="number" 
                  value={form.capacite_totale} 
                  onChange={(v) => setForm({...form, capacite_totale: v === "" ? null : Number(v)})} 
                />
                <Input 
                  label="Capacité Disponible" 
                  type="number" 
                  value={form.capacite_disponible} 
                  onChange={(v) => setForm({...form, capacite_disponible: v === "" ? null : Number(v)})} 
                />
              </div>
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Statut</label>
                  <select 
                    className="border-b border-gray-300 py-1 text-sm outline-none focus:border-[#00A09D] bg-transparent"
                    value={form.statut ?? "ACTIF"}
                    onChange={(e) => setForm({...form, statut: e.target.value})}
                  >
                    <option value="ACTIF">ACTIF</option>
                    <option value="INACTIF">INACTIF</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold uppercase text-gray-500 border rounded hover:bg-gray-100 transition-colors">Annuler</button>
          <button 
            type="button"
            onClick={() => onSave(form)} 
            className="px-6 py-2 text-xs font-bold uppercase text-white bg-[#00A09D] rounded shadow-md hover:bg-[#008784] transition-all"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

const Input = ({ label, value, onChange, type = "text" }: InputProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
    <input 
      type={type}
      className="border-b border-gray-300 py-1 text-sm outline-none focus:border-[#00A09D] bg-transparent"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);