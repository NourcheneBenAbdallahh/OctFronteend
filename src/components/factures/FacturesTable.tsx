"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  createFacture,
  deleteFacture,
  normalizeFacture,
  updateFacture,
} from "@/lib/factures.api";
import {
  FactureStatut,
  FacturesPaginatorInfo,
  TableFacture,
  UpdateFactureInput,
  CreateFactureInput,
} from "@/types/facture";
import { BonLivraisonOption } from "@/types/bon-livraison"; 
import { usePathname, useRouter } from "next/navigation";
import { 
  X, Search, Edit2, Trash2, 
  FileText, Clock, AlertCircle, 
  ChevronDown, Banknote, TrendingUp, Save, Truck, Check
} from "lucide-react";

type Id = string | number;

type FactureForm = {
  numero_facture: string;
  date_facture: string;
  montant_ht: string;
  bon_livraison_ids: string[]; // Changé en tableau pour le multi-sélection
  statut: FactureStatut;
};

const emptyForm: FactureForm = {
  numero_facture: "",
  date_facture: new Date().toISOString().split('T')[0],
  montant_ht: "0",
  bon_livraison_ids: [],
  statut: "BROUILLON",
};

const STATUT_STYLES: Record<string, string> = {
  BROUILLON: "bg-amber-50 text-amber-700 border-amber-200",
  VALIDE: "bg-blue-50 text-blue-700 border-blue-200",
  PAYE: "bg-green-50 text-green-700 border-green-200",
};

const formatDate = (v?: string | null) => v ? (v.includes("T") ? v.split("T")[0] : v) : "-";
const formatMoney = (v?: number | null) => v?.toLocaleString('fr-TN', { minimumFractionDigits: 3 }) || "0,000";

export default function FacturesTable({
  data,
  pagination,
  bonsLivraison,
}: {
  data: TableFacture[];
  pagination: FacturesPaginatorInfo;
  bonsLivraison: BonLivraisonOption[];
}) {
  const [rows, setRows] = useState<TableFacture[]>(data);
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableFacture | null>(null);
  const [form, setForm] = useState<FactureForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [blSearch, setBlSearch] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [blDropdownOpen, setBlDropdownOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setRows(data); }, [data]);

  // --- AUTO-REMPLISSAGE DES VALEURS ---
  useEffect(() => {
    if (!editing && form.bon_livraison_ids.length > 0) {
      const selectedBLs = bonsLivraison.filter(bl => form.bon_livraison_ids.includes(String(bl.id)));
      
      // Calcul du montant HT total basé sur (quantité reçue * prix unitaire de la commande)
      const totalHT = selectedBLs.reduce((sum, bl) => {
        const prix = bl.commande?.prix_unitaire || 0;
        return sum + (bl.quantite_recue * prix);
      }, 0);

      setForm(prev => ({ ...prev, montant_ht: totalHT.toFixed(3) }));
    }
  }, [form.bon_livraison_ids, bonsLivraison, editing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBlDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBL = useMemo(() => {
    const s = blSearch.trim().toLowerCase();
    return bonsLivraison.filter(b => b.numero_bl.toLowerCase().includes(s));
  }, [bonsLivraison, blSearch]);

  const toggleBL = (id: string) => {
    setForm(prev => ({
      ...prev,
      bon_livraison_ids: prev.bon_livraison_ids.includes(id)
        ? prev.bon_livraison_ids.filter(i => i !== id)
        : [...prev.bon_livraison_ids, id]
    }));
  };

  const openNew = () => { setEditing(null); setForm(emptyForm); setBlSearch(""); setIsDrawerOpen(true); };
  
  const openEdit = (item: TableFacture) => {
    setEditing(item);
    setForm({
      numero_facture: item.numero_facture || "",
      date_facture: formatDate(item.date_facture),
      montant_ht: String(item.montant_ht || ""),
      bon_livraison_ids: item.bon_livraisons?.map(bl => String(bl.id)) || [],
      statut: item.statut,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { if (!submitLoading) { setIsDrawerOpen(false); setErrorMessage(""); } };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.bon_livraison_ids.length === 0) return setErrorMessage("Sélectionnez au moins un Bon de Livraison");
    
    setSubmitLoading(true);
    try {
      const payload = { ...form, montant_ht: Number(form.montant_ht) };
      if (editing) {
        const res = await updateFacture(editing.id, payload as UpdateFactureInput);
        setRows(prev => prev.map(r => String(r.id) === String(editing.id) ? normalizeFacture(res.updateFacture) : r));
      } else {
        const res = await createFacture(payload as any); // Le service Laravel gérera le tableau bon_livraison_ids
        setRows(prev => [normalizeFacture(res.createFacture), ...prev]);
      }
      closeDrawer();
    } catch (err: any) {
      setErrorMessage(err.graphQLErrors?.[0]?.message || err.message);
    } finally { setSubmitLoading(false); }
  }
// --- SUPPRESSION D'UNE FACTURE ---
  async function handleDelete(id: Id) {
    // Utilisation d'une confirmation stylée ou standard
    if (!confirm("Voulez-vous vraiment supprimer cette facture ? Cette action est irréversible.")) return;
    
    try {
      // Appel à ton API lib/factures.api
      await deleteFacture(id);
      
      // Mise à jour locale de l'état pour un feedback instantané (Optimistic UI)
      setRows(prev => prev.filter(r => String(r.id) !== String(id)));
      
      // Optionnel : Notifier l'utilisateur (si tu as une lib de toast)
      console.log(`Facture ${id} supprimée avec succès`);
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + (err.message || "Serveur injoignable"));
    }
  }
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8 font-sans">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
        <div className="w-8 h-[2px] bg-[#00A09D]"></div>
Gestion Facturation      </div>
      <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">
        Automatisation des pénalités et groupement de BL <span className="text-[#00A09D]">.</span>
      </h1>
    </div>
       
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Filtrer..." value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none w-64 shadow-sm" />
          </div>
          <button onClick={openNew} className="bg-gray-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl">
            Nouvelle Facture
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/30 text-[10px] font-black uppercase text-gray-400 border-b">
                <th className="px-8 py-6 w-10"></th>
                <th className="px-6 py-6">Facture</th>
                <th className="px-6 py-6">BL Liés</th>
                <th className="px-6 py-6 text-center">Montant TTC</th>
                <th className="px-6 py-6">Statut</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((item) => (
                <React.Fragment key={item.id}>
                  <tr onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="hover:bg-gray-50/50 transition-all cursor-pointer">
                    <td className="px-8 py-5"><ChevronDown className={`h-4 w-4 transition-transform ${expandedId === item.id ? 'rotate-180 text-indigo-600' : ''}`} /></td>
                    <td className="px-6 py-5">
                      <div className="font-black text-gray-900">{item.numero_facture}</div>
                      <div className="text-[10px] text-gray-400 font-bold">{formatDate(item.date_facture)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex -space-x-2">
                        {item.bon_livraisons?.map((bl, i) => (
                          <div key={bl.id} title={bl.numero_bl} className="h-8 w-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">
                            {bl.numero_bl.slice(-2)}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="bg-gray-900 text-white px-3 py-1 rounded-lg font-black text-xs">{formatMoney(item.montant_ttc)} DT</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-4 py-1 rounded-full text-[9px] font-black border uppercase ${STATUT_STYLES[item.statut]}`}>{item.statut}</span>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(item)} className="p-2 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-gray-50/50 animate-in fade-in duration-300">
                      <td colSpan={6} className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-white p-6 rounded-[2rem] border shadow-sm col-span-2">
                             <h4 className="text-[10px] font-black uppercase text-gray-400 mb-4 flex items-center gap-2"><Truck className="h-3 w-3"/> Détails des réceptions</h4>
                             <div className="space-y-3">
                                {item.bon_livraisons?.map(bl => (
                                  <div key={bl.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                                    <span className="font-bold">{bl.numero_bl} <span className="text-gray-400 font-medium">({formatDate(bl.date_reception)})</span></span>
                                    <span className="font-black text-indigo-600">{bl.quantite_recue} Unités</span>
                                  </div>
                                ))}
                             </div>
                          </div>
                          <div className="bg-indigo-600 p-6 rounded-[2rem] text-white space-y-4">
                             <div>
                               <p className="text-[10px] uppercase font-bold opacity-70">Pénalités appliquées</p>
                               <p className="text-2xl font-black">-{formatMoney(item.montant_penalites)} DT</p>
                             </div>
                             <div className="pt-4 border-t border-white/20">
                               <p className="text-[10px] uppercase font-bold opacity-70">Net à payer (TTC)</p>
                               <p className="text-2xl font-black">{formatMoney(item.montant_ttc)} DT</p>
                             </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DRAWER FORM */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[999] flex justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={closeDrawer} />
          <div className="relative w-full max-w-lg bg-white p-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-black italic mb-8 uppercase tracking-tighter text-gray-900">
              {editing ? "Modifier Facture" : "Nouvelle Facture Groupée"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {errorMessage && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black border border-red-100 uppercase">{errorMessage}</div>}

              {/* MULTI-SELECT BL DROPDOWN */}
              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] font-black uppercase text-gray-400">Sélectionner un ou plusieurs BL</label>
                
                {/* Zone de Badges */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.bon_livraison_ids.map(id => {
                    const bl = bonsLivraison.find(b => String(b.id) === id);
                    return (
                      <div key={id} className="bg-indigo-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black flex items-center gap-2">
                        {bl?.numero_bl}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => toggleBL(id)} />
                      </div>
                    );
                  })}
                </div>

                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" className="w-full bg-gray-50 rounded-2xl p-4 pl-12 text-sm font-bold outline-none border-2 border-transparent focus:border-indigo-600 transition-all" 
                    placeholder="Ajouter un Bon de livraison..." value={blSearch} onFocus={() => setBlDropdownOpen(true)} onChange={e => setBlSearch(e.target.value)} />
                </div>

                {blDropdownOpen && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-56 overflow-y-auto p-2">
                    {filteredBL.length > 0 ? filteredBL.map(bl => (
                      <button key={bl.id} type="button" onClick={() => toggleBL(String(bl.id))} className={`w-full p-3 rounded-xl text-left text-xs font-black mb-1 flex justify-between items-center transition-colors ${form.bon_livraison_ids.includes(String(bl.id)) ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}>
                        <span>{bl.numero_bl} <span className="text-gray-400 ml-2">({bl.quantite_recue} reçus)</span></span>
                        {form.bon_livraison_ids.includes(String(bl.id)) && <Check className="h-4 w-4" />}
                      </button>
                    )) : <div className="p-4 text-center text-xs text-gray-400 uppercase font-black">Aucun BL disponible</div>}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400">N° Facture Fournisseur</label>
                <input className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-2 border-transparent focus:border-indigo-600 outline-none" required value={form.numero_facture} onChange={e => setForm({...form, numero_facture: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Date Facture</label>
                  <input type="date" className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold" value={form.date_facture} onChange={e => setForm({...form, date_facture: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 text-indigo-600">Montant HT (Auto)</label>
                  <div className="relative">
                     <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400" />
                     <input type="number" step="0.001" className="w-full bg-indigo-50/50 rounded-2xl p-4 pl-12 text-sm font-black text-indigo-700 border-2 border-indigo-100" value={form.montant_ht} onChange={e => setForm({...form, montant_ht: e.target.value})} required />
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Total Final Estimé (TVA 19%)</p>
                    <p className="text-3xl font-black">{(Number(form.montant_ht) * 1.19).toFixed(3)} <span className="text-sm font-medium">DT</span></p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-indigo-500 opacity-50 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <button disabled={submitLoading} className="w-full bg-indigo-600 text-white p-6 rounded-[2rem] font-black text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-3">
                {submitLoading ? "SYNCHRONISATION..." : <><Save className="h-5 w-5" /> VALIDER LA FACTURE GROUPÉE</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}