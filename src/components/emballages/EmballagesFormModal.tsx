"use client";

import { useState, useEffect } from "react";
import {
  createEmballages,
  updateEmballages
  
} from "@/lib/emballages.api";
import {TableEmballages ,  Emballages as APIEmballages,  normalizeEmballages,

  } from "@/types/emballage";
type Status = "ACTIVE" | "INACTIVE";

interface Props {
  editing: TableEmballages | null;
  setRows: React.Dispatch<React.SetStateAction<TableEmballages[]>>;
  onClose: () => void;
}
export default function EmballagesFormModal({ editing, setRows, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<Partial<TableEmballages>>(editing || {
    code: "", name: "", type: "", capacity_value: undefined, capacity_unit: "", material: "", status: "ACTIVE"
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name || "",
        type: form.type || "",
        code: form.code || "",
        capacity_value: form.capacity_value ? Number(form.capacity_value) : null,
        capacity_unit: form.capacity_unit || null,
        material: form.material || null,
        status: form.status || "ACTIVE",
      };

      if (editing) {
        const res = await updateEmballages(editing.id, payload);
        const updated = normalizeEmballages(res.updateEmballage);
        setRows(prev => prev.map(r => String(r.id) === String(updated.id) ? updated : r));
      } else {
        const res = await createEmballages(payload as any);
        const created = normalizeEmballages(res.createEmballage);
        setRows(prev => [created, ...prev]);
      }
      onClose();
    } catch (err: any) {
      alert(err?.message || "Erreur de sauvegarde");
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">{editing ? "Modifier Emballage" : "Nouvel Emballage"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-[#F8F9FA]">
          <div className="bg-white p-8 shadow-sm border border-gray-200 rounded-sm space-y-8">
            <div className="border-b border-gray-200 pb-6">
              <label className="text-[10px] font-bold text-[#00A09D] uppercase tracking-widest mb-1 block">Nom de l'emballage</label>
              <input 
                required
                className="w-full text-4xl font-extrabold border-none p-0 focus:ring-0 placeholder:text-gray-200 text-gray-800 bg-transparent outline-none uppercase"
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="EX: SAC DE RIZ 50KG"
              />
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                <Field label="Code Interne" value={form.code} onChange={(v: string) => setForm({...form, code: v})} disabled={!!editing} required />
                <Field label="Type" value={form.type} onChange={(v: string) => setForm({...form, type: v})} required />
                <Field label="Matériau" value={form.material} onChange={(v: string) => setForm({...form, material: v})} />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Capacité" type="number" value={form.capacity_value} onChange={(v: any) => setForm({...form, capacity_value: v})} />
                  <Field label="Unité" value={form.capacity_unit} onChange={(v: string) => setForm({...form, capacity_unit: v})} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Statut</label>
                  <select 
                    className="border-b border-gray-300 py-1 text-sm bg-transparent outline-none focus:border-[#00A09D]" 
                    value={form.status} 
                    onChange={(e) => setForm({...form, status: e.target.value as Status})}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-4 border-t flex justify-end gap-3 bg-white">
          <button type="button" onClick={onClose} className="px-6 py-2 border rounded font-bold text-gray-600 uppercase text-xs">Annuler</button>
          <button type="submit" disabled={loading} className="px-8 py-2 bg-[#00A09D] text-white rounded font-bold uppercase text-xs shadow-md">
            {loading ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </form>
    </div>
  );
}

const Field = ({ label, value, onChange, type = "text", required = false, disabled = false }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
    <input 
      required={required} disabled={disabled} type={type}
      className={`border-b border-gray-300 py-1 focus:border-[#00A09D] outline-none text-sm bg-transparent ${disabled ? 'text-gray-400' : ''}`} 
      value={value ?? ""} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);