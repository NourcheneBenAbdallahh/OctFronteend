"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Facture, FactureStatut, TableFacture, FacturesPaginatorInfo, BonLivraisonOption, UpdateFactureInput, CreateFactureInput } from "@/types/facture";
import { 
  updateFacture,
  createFacture,
  deleteFacture,
  normalizeFacture
} from "@/lib/factures.api";
import { 
  Edit2, Trash2, ChevronDown, ChevronRight, Truck, Calendar, 
  AlertCircle, Search, Plus, User, FileText, Banknote, X, Check, TrendingUp, Save
} from "lucide-react";
import Pagination from "@/components/tables/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// Helper functions
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(3).replace(".", ",");
};

type Id = string | number;

type FactureForm = {
  numero_facture: string;
  date_facture: string;
  montant_ht: string;
  bon_livraison_ids: string[]; // Changé en tableau pour le multi-sélection
  statut: FactureStatut;
};
const LocalPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="flex items-center gap-4">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Précédent
    </button>

    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-x px-6 border-gray-100">
      Page {currentPage} sur {totalPages}
    </div>

    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Suivant
    </button>
  </div>
);
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


export default function FacturesTable({
  data,
  pagination,
  bonsLivraison,
}: {
  data: TableFacture[];
  pagination: FacturesPaginatorInfo;
  bonsLivraison: BonLivraisonOption[];
}) {
  const [rows, setRows] = useState<TableFacture[]>([]);
  const [paginationState, setPaginationState] = useState<FacturesPaginatorInfo>({
    count: 0,
    currentPage: 1,
    lastPage: 1,
    perPage: 10,
    total: 0,
  });
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableFacture | null>(null);
  const [form, setForm] = useState<FactureForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [blSearch, setBlSearch] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [blDropdownOpen, setBlDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | number | null>(null);

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);


const handlePageChange = (page: number) => {
  if (page < 1 || page > pagination.lastPage) return;

  const params = new URLSearchParams();
  params.set("page", String(page));
  router.push(`${pathname}?${params.toString()}`);
};
  useEffect(() => { setRows(data); }, [data]);

// 1. Calculer le nombre d'éléments par statut pour les badges
const statusCounts = useMemo(() => {
  const counts: Record<string, number> = {
    BROUILLON: 0,
    VALIDE: 0,
    PAYE: 0,
    ANNULE: 0,
  };
  
  rows.forEach((item) => {
    if (counts[item.statut] !== undefined) {
      counts[item.statut]++;
    }
  });
  
  return counts;
}, [rows]);

// 2. Mettre à jour la logique de filtrage pour qu'elle comprenne les statuts
const filteredRows = useMemo(() => {
  const q = query.trim().toUpperCase();
  if (!q) return rows;

  // Liste des statuts possibles
  const statusList = ['BROUILLON', 'VALIDE', 'PAYE', 'ANNULE'];

  if (statusList.includes(q)) {
    // Si on a cliqué sur un bouton de statut
    return rows.filter(r => r.statut === q);
  }

  // Sinon, recherche textuelle (Numéro ou fournisseur)
  return rows.filter(r => 
    r.numero_facture?.toLowerCase().includes(query.toLowerCase())
  );
}, [rows, query]);

  // --- AUTO-REMPLISSAGE DES VALEURS ---
  useEffect(() => {
    if (!editing && form.bon_livraison_ids.length > 0) {
      const selectedBLs = bonsLivraison.filter(bl => form.bon_livraison_ids.includes(String(bl.id)));
      
      // Calcul du montant HT total basé sur la quantité totale
      // Note: prix_unitaire n'est pas disponible depuis l'API, l'utilisateur doit saisir le montant
      const totalQuantite = selectedBLs.reduce((sum, bl) => sum + bl.quantite_recue, 0);

      // Si le montant HT est vide ou zéro, on le met à jour avec une valeur par défaut
      // L'utilisateur devra ajuster manuellement le montant HT
      if (!form.montant_ht || form.montant_ht === "0") {
        setForm(prev => ({ ...prev, montant_ht: (totalQuantite * 100).toFixed(3) })); // Valeur par défaut: 100 DT par unité
      }
    }
  }, [form.bon_livraison_ids, bonsLivraison, editing, form.montant_ht]);

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
    
    // Si aucun BL n'est sélectionné, montrer tous les BLs non facturés
    if (form.bon_livraison_ids.length === 0) {
      return bonsLivraison.filter(b => 
        b.numero_bl.toLowerCase().includes(s) && 
        !b.is_factured
      );
    }
    
    // Si un BL est déjà sélectionné, montrer seulement les BLs de la même commande
    const firstBLId = form.bon_livraison_ids[0];
    const firstBL = bonsLivraison.find(b => String(b.id) === firstBLId);
    
    if (!firstBL) {
      return [];
    }
    
    return bonsLivraison.filter(b => 
      b.numero_bl.toLowerCase().includes(s) && 
      !b.is_factured &&
      b.commande_id === firstBL.commande_id
    );
  }, [bonsLivraison, blSearch, form.bon_livraison_ids]);

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

  const handleStatusChange = async (id: string | number, newStatut: FactureStatut) => {
    setUpdatingStatus(id);
    try {
      const currentFacture = rows.find(r => r.id === id);
      if (!currentFacture) return;
      
      await updateFacture(id, { 
        statut: newStatut,
        bon_livraison_ids: currentFacture.bon_livraisons.map(bl => bl.id)
      });
      // Mettre à jour l'état local
      setRows(rows.map(row => 
        row.id === id ? { ...row, statut: newStatut } : row
      ));
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <>
      {/* HEADER */}
      <div className="bg-[#F0F4F4] px-8 py-8 flex flex-col md:flex-row justify-between items-end gap-6">
      <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-[#00A09D]">
              <FileText className="h-5 w-5" />
            </div>
            <nav className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
              Ressources / <span className="text-gray-900">Finance</span>
            </nav>
          </div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            Factures<span className="text-[#00A09D]">.</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-gray-400 uppercase block">Total Actif</span>
            <span className="text-2xl font-black text-gray-900 leading-none">{filteredRows.length} Factures</span>
          </div>
          <button
            onClick={openNew}
            className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
            >
            <span className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              NOUVEAU
            </span>
          </button>
        </div>
      </div>

      <div className="relative group mb-6">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher une facture..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 py-4 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all shadow-sm hover:shadow-md"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>

      {/* STATUS FILTERS */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setQuery("")}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
            query === "" 
              ? "bg-gray-900 text-white shadow-[4px_4px_0px_rgba(0,160,157,0.2)]" 
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Toutes ({rows.length})
        </button>
        {Object.entries(statusCounts).map(([statut, count]) => (
          <button
            key={statut}
            onClick={() => setQuery(statut)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              query === statut 
                ? `${STATUT_STYLES[statut]} shadow-lg` 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {statut === 'BROUILLON' && 'Brouillons'}
            {statut === 'VALIDE' && 'Validées'}
            {statut === 'PAYE' && 'Payées'}
            {statut === 'ANNULE' && 'Annulées'} ({count})
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden backdrop-blur-sm">
          
          <table className="w-full">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <FileText className="h-3 w-3" />
                  N° Facture
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <Calendar className="h-3 w-3" />
                  Date
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <Banknote className="h-3 w-3" />
                  Montant HT
                </th>
                <th 
                className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <TrendingUp className="h-3 w-3" />
                  Montant TTC
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <User className="h-3 w-3" />
                  Validé par
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <AlertCircle className="h-3 w-3" />
                  Statut
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-500 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRows.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="hover:bg-gray-50 transition-all duration-300 cursor-pointer group" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                          <FileText className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm">{item.numero_facture}</p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                              <Truck className="h-3 w-3 mr-1" />
                              {item.bon_livraisons?.length} BL{item.bon_livraisons?.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{formatDate(item.date_facture)}</p>
                          <p className="text-xs text-gray-500">Émise</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-2 rounded-xl font-black text-xs shadow-sm">
                          {formatMoney(item.montant_ht)} DT
                        </span>
                        <p className="text-xs text-gray-500 text-center">Hors taxes</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span
                        className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 px-3 py-2 rounded-xl font-black text-xs shadow-sm"
                        >
                          {formatMoney(item.montant_ttc)} DT
                        </span>
                        <p className="text-xs text-gray-700 text-center font-medium">TTC</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.valide_par ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">ID {item.valide_par}</p>
                            <p className="text-xs text-green-600 font-medium">Validé</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">En attente</p>
                            <p className="text-xs text-gray-400">Non validé</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {updatingStatus === item.id ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-xl">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                          <span className="text-xs text-indigo-700 font-medium">Mise à jour...</span>
                        </div>
                      ) : item.statut === 'VALIDE' ? (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase shadow-sm ${STATUT_STYLES[item.statut]}`}>
                            VALIDÉ
                          </span>
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={item.statut}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as FactureStatut)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 shadow-sm transition-all hover:shadow-md ${STATUT_STYLES[item.statut]}`}
                          >
                            <option value="BROUILLON">BROUILLON</option>
                            <option value="VALIDE">VALIDE</option>
                            <option value="PAYE">PAYE</option>
                            <option value="ANNULE">ANNULE</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => openEdit(item)} 
                          className="group p-2.5 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all duration-200 transform hover:scale-105"
                        >
                          <Edit2 className="h-4 w-4 text-indigo-600 group-hover:rotate-12 transition-transform" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="group p-2.5 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 transform hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 group-hover:rotate-12 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-gray-50 animate-in fade-in duration-500">
                      <td colSpan={7} className="p-8">
                        <div className="space-y-6">
                          {/* Header des détails */}
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-xl flex items-center justify-center">
                              <ChevronDown className="h-4 w-4 text-white" />
                            </div>
                            <h4 className="text-lg font-black text-gray-900">Détails de la facture #{item.numero_facture}</h4>
                            <div className="ml-auto">
                              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                {item.bon_livraisons?.length || 0} Bon{item.bon_livraisons?.length > 1 ? 's' : ''} de livraison
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Détails des BL */}
                            <div className="lg:col-span-2">
                              <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                                  <h5 className="text-sm font-black text-gray-700 uppercase tracking-wider flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-indigo-600" />
                                    Détails des réceptions
                                  </h5>
                                </div>
                                <div className="p-6 space-y-4">
                                  {item.bon_livraisons?.map((bl: any, index: number) => (
                                    <div key={bl.id} className="group">
                                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-all duration-300">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Truck className="h-5 w-5 text-indigo-600" />
                                          </div>
                                          <div>
                                            <p className="font-black text-gray-900">{bl.numero_bl}</p>
                                            <p className="text-xs text-gray-500 font-medium">{formatDate(bl.date_reception)}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-black text-indigo-600 text-lg">{bl.quantite_recue}</p>
                                          <p className="text-xs text-indigo-500 font-medium">Unités</p>
                                        </div>
                                      </div>
                                      {index < (item.bon_livraisons?.length || 0) - 1 && (
                                        <div className="border-l-2 border-gray-200 ml-5 h-4"></div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            {/* Résumé financier */}
                            <div className="space-y-4">
                              <div className="bg-gradient-to-br from-indigo-600 to-cyan-500 rounded-2xl shadow-xl overflow-hidden">
                                <div className="p-6 space-y-6">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-black text-white/80 uppercase tracking-wider">Résumé financier</h5>
                                    <TrendingUp className="h-5 w-5 text-white/60" />
                                  </div>
                                  
                                  <div className="space-y-4">
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                      <p className="text-xs text-white/70 font-medium mb-1">Montant HT</p>
                                      <p className="text-2xl font-black text-white">{formatMoney(item.montant_ht)} DT</p>
                                    </div>
                                    
                                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                      <p className="text-xs text-white/70 font-medium mb-1">TVA (19%)</p>
                                      <p className="text-xl font-bold text-white/90">{formatMoney(Number(item.montant_ht) * 0.19)} DT</p>
                                    </div>
                                    
                                    {(item.montant_penalites || 0) > 0 && (
                                      <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-500/30">
                                        <p className="text-xs text-red-100 font-medium mb-1">Pénalités appliquées</p>
                                        <p className="text-xl font-bold text-red-100">-{formatMoney(item.montant_penalites || 0)} DT</p>
                                      </div>
                                    )}
                                    
                                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                                      <p className="text-xs text-white/90 font-medium mb-1">Net à payer (TTC)</p>
                                      <p className="text-3xl font-black text-white">{formatMoney(item.montant_ttc)} DT</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
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
        
        {/* PAGINATION */}
        <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{filteredRows.length}</span> factures
                <span className="mx-2 text-gray-400">•</span>
                Page <span className="font-medium text-gray-900">{pagination.currentPage}</span> sur <span className="font-medium text-gray-900">{pagination.lastPage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(Math.max(1, pagination.currentPage - 1))}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-600"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                  const pageNum = i + 1;
                  const isActive = pageNum === pagination.currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white shadow-[4px_4px_0px_rgba(0,160,157,0.2)]'
                          : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {pagination.lastPage > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => handlePageChange(pagination.lastPage)}
                      className="w-10 h-10 rounded-xl bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200"
                    >
                      {pagination.lastPage}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(pagination.lastPage, pagination.currentPage + 1))}
                disabled={pagination.currentPage === pagination.lastPage}
                className="p-2 rounded-xl bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 disabled:hover:text-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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

              <div className="p-8 bg-gradient-to-r from-indigo-700 to-cyan-600 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
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
    </>
  );
}