"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  createBonLivraisonWithFile,
  updateBonLivraison,
  deleteBonLivraison,
  normalizeBonLivraison,
} from "@/lib/bon-livraisons.api";
import {
  TableBonLivraison,
  BonLivraisonsPaginatorInfo,
  EmballageOption,
  EntrepotOption,
  CommandeOption,
} from "@/types/bon-livraison";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  X, Plus, FileText, Calendar, Package, MapPin, 
  Upload, Trash2, Edit2, AlertCircle, ChevronDown, Hash, ShoppingCart, Truck, CheckCircle2, Search
} from "lucide-react";

// --- SOUS-COMPOSANT : TIMELINE BUS ---
const CommandeTimeline = ({ total, dejaRecu, actuel }: { total: number; dejaRecu: number; actuel: number }) => {
  const totalApresSaisie = Math.min(dejaRecu + actuel, total);
  const pourcentageAncien = (dejaRecu / total) * 100;
  const pourcentageNouveau = (totalApresSaisie / total) * 100;

  return (
    
    <div className="bg-gray-50/80 rounded-[2rem] p-6 border border-gray-100 my-2 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block mb-1">Progression de réception</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900">{totalApresSaisie}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase">/ {total} UNITÉS</span>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase ${pourcentageNouveau >= 100 ? 'bg-green-500 text-white' : 'bg-indigo-600 text-white'}`}>
            {Math.round(pourcentageNouveau)}%
          </span>
        </div>
      </div>

      <div className="relative h-10 flex items-center px-2">
        {/* Rail */}
        <div className="absolute left-0 right-0 h-1.5 bg-gray-200 rounded-full overflow-hidden">
           <div className="h-full bg-indigo-200 transition-all duration-1000" style={{ width: `${pourcentageAncien}%` }} />
           <div className="h-full bg-indigo-600 absolute top-0 transition-all duration-1000 ease-out" style={{ width: `${pourcentageNouveau}%` }} />
        </div>

        {/* Le Bus (Camion) */}
        <div 
          className="absolute transition-all duration-1000 ease-in-out z-10"
          style={{ left: `calc(${pourcentageNouveau}% - 18px)` }}
        >
          <div className={`p-1.5 rounded-xl shadow-lg transition-colors ${pourcentageNouveau >= 100 ? 'bg-green-600' : 'bg-indigo-600'} text-white animate-bounce`}>
            <Truck className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[8px] font-black text-gray-400 uppercase tracking-tighter">
        <span>Fournisseur</span>
        <span>Entrepôt</span>
      </div>
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
type Id = string | number;
type BonLivraisonForm = {
  date_reception: string;
  emballage_id: string;
  quantite_recue: string;
  numero_commande: string;
  entrepot_id: string;
};

const emptyForm: BonLivraisonForm = {
  date_reception: new Date().toISOString().split("T")[0],
  emballage_id: "",
  quantite_recue: "",
  numero_commande: "",
  entrepot_id: "",
};

export default function BonLivraisonsTable({
  data,
  pagination,
  emballages,
  commandes,
  entrepots,
}: {
  data: TableBonLivraison[];
  pagination: BonLivraisonsPaginatorInfo;
  emballages: EmballageOption[];
  commandes: CommandeOption[];
  entrepots: EntrepotOption[];
}) {
  const [rows, setRows] = useState<TableBonLivraison[]>(data);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableBonLivraison | null>(null);
  const [form, setForm] = useState<BonLivraisonForm>(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => setRows(data), [data]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCmdOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const commandesEnAttente = useMemo(() => {
    return commandes.filter((c: any) => c.statut !== "RECEPTIONNEE");
  }, [commandes]);

  const selectedCommande = useMemo(
    () => commandes.find((c) => c.numero_commande === form.numero_commande),
    [commandes, form.numero_commande]
  );

  const dejaRecu = useMemo(() => {
    if (!selectedCommande) return 0;
    return rows
      .filter((bl) => bl.numero_commande === selectedCommande.numero_commande && String(bl.id) !== String(editing?.id))
      .reduce((acc, bl) => acc + (Number(bl.quantite_recue) || 0), 0);
  }, [selectedCommande, rows, editing]);

  const remainingQuantity = selectedCommande ? (selectedCommande.quantite - dejaRecu) : 0;

  const handleSelectCommande = (c: CommandeOption) => {
    setForm((prev) => ({
      ...prev,
      numero_commande: c.numero_commande,
      emballage_id: c.emballage_id ? String(c.emballage_id) : "",
      entrepot_id: c.entrepot_id ? String(c.entrepot_id) : "",
      quantite_recue: "" 
    }));
    setIsCmdOpen(false);
    setErrorMessage("");
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  };


  const stats = useMemo(() => {
  const totalRecu = rows.reduce((acc, curr) => acc + (Number(curr.quantite_recue) || 0), 0);
  const nbBl = rows.length;
  // On calcule le reliquat global basé sur les commandes en attente
  const reliquatGlobal = commandesEnAttente.reduce((acc, curr) => acc + (curr.quantite - (curr.quantite || 0)), 0);
  
  return { totalRecu, nbBl, reliquatGlobal };
}, [rows, commandesEnAttente]);


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !file) { setErrorMessage("Le document BL est obligatoire"); return; }
    if (Number(form.quantite_recue) > remainingQuantity) {
        setErrorMessage(`Quantité dépasse le reste à livrer (${remainingQuantity})`);
        return;
    }

    setSubmitLoading(true);
    try {
      const payload = { ...form, quantite_recue: Number(form.quantite_recue) };
      if (editing) {
        const res = await updateBonLivraison(editing.id, payload);
        setRows(prev => prev.map(r => String(r.id) === String(editing.id) ? normalizeBonLivraison(res.updateBonLivraison) : r));
      } else {
        const created = await createBonLivraisonWithFile(payload as any, file!);
        setRows(prev => [normalizeBonLivraison(created), ...prev]);
      }
      setIsDrawerOpen(false);
      setForm(emptyForm);
      setFile(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de serveur");
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(id: Id) {
    if (!confirm("Supprimer définitivement ce BL ?")) return;
    try {
      await deleteBonLivraison(id);
      setRows(prev => prev.filter(r => String(r.id) !== String(id)));
    } catch (err: any) { alert(err.message); }
  }

  return (
<div className="space-y-8">
    {/* HEADER & STATS */}
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
          Flux Réceptions
        </h1>
        <p className="text-gray-400 text-sm font-medium mt-1">
          Gestion des bons de livraison et entrées en stock
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Widget 1: Total Reçu */}
        <div className="bg-white border border-gray-100 p-4 rounded-[2rem] flex items-center gap-4 min-w-[180px] shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Reçu</span>
            <span className="text-xl font-black text-gray-900">{stats.totalRecu.toLocaleString()}</span>
          </div>
        </div>

        {/* Widget 2: Reliquat */}
        <div className="bg-white border border-gray-100 p-4 rounded-[2rem] flex items-center gap-4 min-w-[180px] shadow-sm">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">En Attente</span>
            <span className="text-xl font-black text-amber-600">{stats.reliquatGlobal.toLocaleString()}</span>
          </div>
        </div>

        {/* Bouton Action */}
        <button 
          onClick={() => { setEditing(null); setForm(emptyForm); setIsDrawerOpen(true); }}
          className="bg-indigo-600 hover:bg-gray-900 text-white px-8 py-4 rounded-[2rem] flex items-center gap-3 transition-all hover:scale-105 shadow-xl shadow-indigo-100 group"
        >
          <Plus className="h-5 w-5 stroke-[3px] group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-black uppercase tracking-[0.15em]">Nouveau BL</span>
        </button>
      </div>
    </div>   
    

      {/* TABLEAU DESIGN */}
<div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Référence BL</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-center">Commande</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-center">Quantité Reçue</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((bl) => (
              <tr key={bl.id} className="hover:bg-indigo-50/10 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-gray-800">{bl.numero_bl || "En attente"}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">{bl.date_reception?.split("T")[0]}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-100">
                    <ShoppingCart className="h-3 w-3" /> {bl.numero_commande}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-sm font-black text-gray-700">{bl.quantite_recue}</span>
                  <span className="text-[10px] ml-1.5 text-gray-300 font-bold uppercase">Unités</span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => {
                        setEditing(bl);
                        setForm({
                            date_reception: bl.date_reception?.split("T")[0] || "",
                            emballage_id: String(bl.emballage_id),
                            quantite_recue: String(bl.quantite_recue),
                            numero_commande: bl.numero_commande,
                            entrepot_id: String(bl.entrepot_id),
                        });
                        setIsDrawerOpen(true);
                      }} className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(bl.id)} className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-xl transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-6 border-t border-gray-50 bg-gray-50/30">
        <Pagination currentPage={pagination.currentPage} totalPages={pagination.lastPage} onPageChange={handlePageChange} />
      </div>

      {/* DRAWER DESIGN */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-gray-900/30 backdrop-blur-[2px] transition-all" onClick={() => setIsDrawerOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] animate-in slide-in-from-right duration-500 rounded-l-[2.5rem] border-l border-gray-100 flex flex-col">
            
            <div className="p-10 pb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{editing ? "Modifier" : "Réception"}</h2>
                <div className="mt-2 h-1 w-8 bg-indigo-600 rounded-full" />
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="h-12 w-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors"><X /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-6 space-y-6 scrollbar-hide">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-black flex items-center gap-3 rounded-2xl uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4" /> {errorMessage}
                </div>
              )}

              {/* STEP 1: COMMANDE SELECTION */}
              <div className="space-y-4" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Référence Commande</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCmdOpen(!isCmdOpen)}
                    className={`w-full flex items-center justify-between rounded-2xl border-2 p-4 text-sm font-black transition-all ${
                      form.numero_commande ? "border-indigo-600 bg-indigo-50/20 text-indigo-900" : "border-gray-100 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Hash className={`h-4 w-4 ${form.numero_commande ? "text-indigo-600" : "text-gray-200"}`} />
                      {form.numero_commande || "Choisir Commande"}
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isCmdOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isCmdOpen && (
                    <div className="absolute z-[110] mt-3 w-full bg-white border border-gray-100 rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <div className="max-h-64 overflow-y-auto p-3 space-y-1">
                        {commandesEnAttente.map((c) => (
                          <button key={c.id} type="button" onClick={() => handleSelectCommande(c)} className="w-full text-left p-4 hover:bg-indigo-600 hover:text-white rounded-[1.2rem] transition-all group">
                            <div className="font-black text-sm">#{c.numero_commande}</div>
                            <div className="text-[10px] opacity-60 font-bold uppercase mt-1">Total: {c.quantite} Unités</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* VISUELLE PAR COMMANDE (TIMELINE) */}
              {selectedCommande && (
                <CommandeTimeline 
                  total={selectedCommande.quantite} 
                  dejaRecu={dejaRecu} 
                  actuel={Number(form.quantite_recue) || 0} 
                />
              )}

              {/* FORM FIELDS */}
              <div className={`space-y-6 transition-all duration-700 ${!selectedCommande ? "opacity-20 pointer-events-none" : ""}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Emballage</label>
                    <select value={form.emballage_id} onChange={(e) => setForm({...form, emballage_id: e.target.value})} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none cursor-pointer">
                      <option value="">N/A</option>
                      {emballages.map(e => <option key={e.id} value={String(e.id)}>{e.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Destination</label>
                    <select value={form.entrepot_id} onChange={(e) => setForm({...form, entrepot_id: e.target.value})} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none cursor-pointer">
                      <option value="">N/A</option>
                      {entrepots.map(e => <option key={e.id} value={String(e.id)}>{e.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Date d'Arrivée</label>
                    <input type="date" value={form.date_reception} onChange={(e) => setForm({...form, date_reception: e.target.value})} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Quantité (Max: {remainingQuantity})</label>
                    <input type="number" value={form.quantite_recue} onChange={(e) => setForm({...form, quantite_recue: e.target.value})} className="w-full rounded-2xl border-2 border-gray-100 p-4 text-xs font-black outline-none focus:border-indigo-600 transition-all placeholder:text-gray-200" placeholder="00" required />
                  </div>
                </div>

                {/* DRAG & DROP ZONE */}
                {!editing && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 text-center block">Justificatif Numérique</label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        const droppedFile = e.dataTransfer.files[0];
                        if (droppedFile) setFile(droppedFile);
                      }}
                      className={`relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all group overflow-hidden ${
                        isDragging ? "border-indigo-500 bg-indigo-50 scale-[1.02]" : file ? "border-green-500 bg-green-50/30" : "border-gray-100 hover:bg-gray-50 hover:border-indigo-300"
                      }`}
                    >
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                      <div className="z-10 flex flex-col items-center text-center px-4">
                        <div className={`p-3 rounded-xl mb-2 transition-all ${file ? "bg-green-600 text-white" : "bg-white shadow-sm text-indigo-600"}`}>
                          <Upload className={`h-5 w-5 stroke-[3px] ${isDragging ? "animate-bounce" : ""}`} />
                        </div>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">
                          {file ? file.name : isDragging ? "Lâchez ici" : "Glisser le scan"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>

            <div className="p-10 border-t border-gray-50 bg-white flex gap-4 mt-auto">
              <button onClick={() => setIsDrawerOpen(false)} className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Fermer</button>
              <button 
                onClick={(e) => handleSubmit(e as any)}
                disabled={submitLoading || !selectedCommande}
                className="flex-[2] bg-gray-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-300 transition-all active:scale-95"
              >
                {submitLoading ? "En cours..." : editing ? "Modifier le BL" : "Confirmer l'Entrée"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}