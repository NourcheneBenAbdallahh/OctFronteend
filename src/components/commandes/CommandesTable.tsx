"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  cancelCommande,
  createCommande,
  dropCommande,
  normalizeCommande,
  updateCommande,
} from "@/lib/commandes.api";
import {
  CommandeStatut,
  CommandesPaginatorInfo,
  ContratForCommande,
  CreateCommandeInput,
  EmballageOption,
  EntrepotOption,
  FournisseurOption,
  TableCommande,
  UpdateCommandeInput,
} from "@/types/commandes";
import { useAuthStore } from "@/store/useAuthStore";
import { graphqlRequest } from "@/lib/graphqlClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  X, Plus, Search, Edit2, Trash2, Ban, 
  Package, Truck, Calendar, AlertCircle, Info, ArrowRight,
  ChevronDown, Timer, History, CheckCircle2
} from "lucide-react";

type Id = string | number;

// --- AJUSTEMENT DES TYPES POUR TES DONNÉES RÉELLES ---
type CommandeForm = {
  date_livraison_prevue: string;
  emballage_id: string;
  quantite: string;
  fournisseur_id: string;
  entrepot_id: string;
  statut: CommandeStatut;
};

const emptyForm: CommandeForm = {
  date_livraison_prevue: "",
  emballage_id: "",
  quantite: "",
  fournisseur_id: "",
  entrepot_id: "",
  statut: "EN_ATTENTE",
};

const STATUT_STYLES: Record<string, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-700 border-amber-200",
  VALIDEE: "bg-blue-50 text-blue-700 border-blue-200",
  RECEPTIONNEE: "bg-green-50 text-green-700 border-green-200",
  ANNULEE: "bg-gray-100 text-gray-600 border-gray-200",
  PARTIELLEMENT_RECEPTIONNEE: "bg-purple-50 text-purple-700 border-purple-200",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.includes("T") ? value.split("T")[0] : value;
}

// --- COMPOSANT TIMELINE MIS À JOUR AVEC TES CHAMPS ---
const OrderTimelineDetail = ({ item, emballageLabel }: { item: TableCommande; emballageLabel?: string }) => {
  const dateCrea = new Date(item.date_commande || new Date());
  const datePrevue = new Date(item.date_livraison_prevue);
  const aujourdhui = new Date();

  // Calcul des jours
  const joursRestants = Math.ceil((datePrevue.getTime() - aujourdhui.getTime()) / (1000 * 60 * 60 * 24));
  
  // Utilisation de tes champs : quantite_recue_total et reste
  const qteTotale = Number(item.quantite || 0);
  const qteRecue = Number((item as any).quantite_recue_total || 0); 
  const resteARecevoir = Number((item as any).reste || 0);
  
  const ratio = qteTotale > 0 ? Math.min((qteRecue / qteTotale) * 100, 100) : 0;
  const estEnRetard = joursRestants < 0 && item.statut !== "RECEPTIONNEE";

  return (
    <div className="bg-gray-50/80 p-8 border-t border-gray-100 animate-in slide-in-from-top duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COL 1: ANALYSE TEMPS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <History className="h-3 w-3" /> État du délai
          </div>
          <div className={`p-5 rounded-[2rem] border-2 shadow-sm flex items-center gap-4 ${estEnRetard ? 'bg-red-50 border-red-100' : 'bg-white border-white'}`}>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${estEnRetard ? 'bg-red-500 text-white' : 'bg-indigo-600 text-white'}`}>
               <Timer className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Échéance</p>
              <p className={`text-lg font-black ${estEnRetard ? 'text-red-600' : 'text-gray-900'}`}>
                {joursRestants > 0 ? `${joursRestants} Jours restants` : estEnRetard ? `${Math.abs(joursRestants)} J. de retard` : "Échéance atteinte"}
              </p>
            </div>
          </div>
        </div>

        {/* COL 2: PROGRESSION RÉELLE (Tes données) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 tracking-widest">
            <span>Progression Réception</span>
            <span className="text-indigo-600 font-black">{ratio.toFixed(1)}%</span>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-3">
             <div className="flex justify-between text-xs font-black">
                <span className="text-gray-400">Total attendu:</span>
                <span className="text-gray-900">{qteTotale} {emballageLabel}</span>
             </div>
             <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${resteARecevoir < 0 ? 'bg-amber-500' : 'bg-indigo-600'}`} style={{ width: `${ratio}%` }} />
             </div>
             <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Déjà reçu: <span className="text-indigo-600">{qteRecue}</span></p>
                {resteARecevoir > 0 ? (
                    <p className="text-[10px] font-bold text-amber-600 uppercase italic">Reste: {resteARecevoir}</p>
                ) : resteARecevoir < 0 ? (
                    <p className="text-[10px] font-bold text-red-600 uppercase italic">Surplus: {Math.abs(resteARecevoir)}</p>
                ) : (
                    <p className="text-[10px] font-bold text-green-600 uppercase">Complet</p>
                )}
             </div>
          </div>
        </div>

        {/* COL 3: DATES CLÉS */}
        <div className="space-y-4">
           <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Dates de suivi</div>
           <div className="space-y-3 bg-white/50 p-4 rounded-2xl border border-dashed border-gray-200">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Création</span>
                 <span className="text-xs font-black text-gray-900">{formatDate(item.date_commande)}</span>
              </div>
              <div className="h-px bg-gray-100 w-full" />
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold text-gray-400 uppercase">Livraison Prévue</span>
                 <span className="text-xs font-black text-gray-900">{formatDate(item.date_livraison_prevue)}</span>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default function CommandesTable({
  data,
  pagination,
  emballages,
  entrepots,
  fournisseurs,
  contrats,
}: {
  data: TableCommande[];
  pagination: CommandesPaginatorInfo;
  emballages: EmballageOption[];
  entrepots: EntrepotOption[];
  fournisseurs: FournisseurOption[];
  contrats: ContratForCommande[];
}) {
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [rows, setRows] = useState<TableCommande[]>(data);
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableCommande | null>(null);
  const [form, setForm] = useState<CommandeForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

    const router = useRouter();
const searchParams = useSearchParams();
const pathname = usePathname();

const goToPage = (page: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  router.push(`${pathname}?${params.toString()}`);
};


  useEffect(() => { setRows(data); }, [data]);

  useEffect(() => {
    async function loadUserNames() {
      if (!token) return;
      try {
        const query = `
          query ListUsersForCommandes {
            users {
              id
              name
            }
          }
        `;
        const res = await graphqlRequest<{ users: Array<{ id: string | number; name: string }> }>(
          query,
          {},
          { token }
        );
        const map: Record<string, string> = {};
        (res.users || []).forEach((u) => {
          map[String(u.id)] = u.name;
        });
        setUserNamesById(map);
      } catch {
        // Fallback handled in UI if users query is unavailable
      }
    }

    loadUserNames();
  }, [token]);

  const emballagesMap = useMemo(() => new Map(emballages.map((x) => [String(x.id), x.label])), [emballages]);
  const entrepotsMap = useMemo(() => new Map(entrepots.map((x) => [String(x.id), x.label])), [entrepots]);
  const fournisseursMap = useMemo(() => new Map(fournisseurs.map((x) => [String(x.id), x.label])), [fournisseurs]);

  // --- LOGIQUE FILTRAGE ET CONTRAT ---
  const filteredFournisseurs = useMemo(() => {
    if (!form.emballage_id) return [];
    const supplierIds = new Set(
      contrats
        .filter(c => String(c.emballage_id) === String(form.emballage_id) && c.statut.toUpperCase() === "ACTIF")
        .map(c => String(c.fournisseur_id))
    );
    return fournisseurs.filter(f => supplierIds.has(String(f.id)));
  }, [form.emballage_id, contrats, fournisseurs]);

  const activeContract = useMemo(() => {
    if (!form.fournisseur_id || !form.emballage_id) return null;
    return contrats.find(c => 
      String(c.fournisseur_id) === String(form.fournisseur_id) && 
      String(c.emballage_id) === String(form.emballage_id) &&
      c.statut.toUpperCase() === "ACTIF"
    ) || null;
  }, [form.fournisseur_id, form.emballage_id, contrats]);

  const contractStats = useMemo(() => {
  if (!activeContract) return null;
  const total = Number(activeContract.quantite_contractuelle || 0);
  const realise = Number(activeContract.quantite_realisee || 0);
  const saisie = Number(form.quantite || 0);
  const restant = total - realise;
  const pourcentage = Math.min(((realise + saisie) / total) * 100, 100);
  
  const surplus = saisie - restant; 
  
  return { total, realise, restant, pourcentage, depasse: saisie > restant, surplus };
}, [activeContract, form.quantite]);


  // --- ACTIONS ---
  const openNew = () => { setEditing(null); setForm(emptyForm); setErrorMessage(""); setIsDrawerOpen(true); };
  const openEdit = (item: TableCommande) => {
    setEditing(item);
    setForm({
      date_livraison_prevue: formatDate(item.date_livraison_prevue),
      emballage_id: String(item.emballage_id ?? ""),
      quantite: String(item.quantite ?? ""),
      fournisseur_id: String(item.fournisseur_id ?? ""),
      entrepot_id: String(item.entrepot_id ?? ""),
      statut: item.statut,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { if (!submitLoading) { setIsDrawerOpen(false); setErrorMessage(""); } };




  async function handleCancel(id: Id) {
    if (!confirm("Annuler cette commande ?")) return;
    try {
      const res = await cancelCommande(id);
      const updated = normalizeCommande(res.cancelCommande);
      setRows(prev => prev.map(r => String(r.id) === String(updated.id) ? updated : r));
    } catch (err: any) { alert(err.message); }
  }

  async function handleDrop(id: Id) {
    if (!confirm("Supprimer cette commande ?")) return;
    try {
      await dropCommande(id);
      setRows(prev => prev.filter(r => String(r.id) !== String(id)));
    } catch (err: any) { alert(err.message); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (contractStats?.depasse) { setErrorMessage("Quantité supérieure au reste du contrat !"); return; }
    setSubmitLoading(true);
    try {
      const payloadBase = {
        date_livraison_prevue: form.date_livraison_prevue,
        emballage_id: form.emballage_id,
        quantite: Number(form.quantite),
        fournisseur_id: form.fournisseur_id,
        entrepot_id: form.entrepot_id,
      };

      if (editing) {
        const updatePayload: UpdateCommandeInput = { ...payloadBase, statut: form.statut };
        const res = await updateCommande(editing.id, updatePayload);
        const updated = normalizeCommande(res.updateCommande);
        setRows((prev) => prev.map((r) => String(r.id) === String(updated.id) ? updated : r));
      } else {
        const res = await createCommande(payloadBase as any);
        const created = normalizeCommande(res.createCommande);
        setRows((prev) => [created, ...prev]);
      }
      closeDrawer();
    } catch (err: any) { setErrorMessage(err.message || "Erreur lors de l'enregistrement"); } finally { setSubmitLoading(false); }
  }

// 1. Calculer le nombre d'éléments par statut pour les badges
const statusCounts = useMemo(() => {
  const counts: Record<string, number> = {
    EN_ATTENTE: 0,
    VALIDEE: 0,
    PARTIELLEMENT_RECEPTIONNEE: 0,
    RECEPTIONNEE: 0,
    ANNULEE: 0,
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
  const statusList = ['EN_ATTENTE', 'VALIDEE', 'PARTIELLEMENT_RECEPTIONNEE', 'RECEPTIONNEE', 'ANNULEE'];

  if (statusList.includes(q)) {
    // Si on a cliqué sur un bouton de statut
    return rows.filter(r => r.statut === q);
  }

  // Sinon, recherche textuelle (Numéro ou Fournisseur)
  return rows.filter(r => 
    r.numero_commande?.toLowerCase().includes(query.toLowerCase()) || 
    fournisseursMap.get(String(r.fournisseur_id))?.toLowerCase().includes(query.toLowerCase())
  );
}, [rows, query, fournisseursMap]);
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Flux Commandes</h1>
          <p className="text-sm text-gray-500 font-medium italic">Suivi des réceptions et délais</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
            <input type="text" placeholder="Rechercher une commande..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 md:w-80 transition-all shadow-sm" />
          </div>
          <button onClick={openNew}
          
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
             > NOUVEAU
          </button>
        </div>
      </div>

{/* SECTION ANALYSE RAPIDE */}
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
  {/* Widget 1: Volume Total Attendu */}
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
      <Package className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Flux Total</p>
      <p className="text-xl font-black text-gray-900">
        {rows.reduce((acc, curr) => acc + Number(curr.quantite || 0), 0)}
      </p>
    </div>
  </div>

  {/* Widget 2: Reste à recevoir (Somme des reliquats) */}
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
      <ArrowRight className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Reliquat Total</p>
      <p className="text-xl font-black text-amber-600">
        {rows.reduce((acc, curr) => acc + Math.max(0, Number(curr.reste || 0)), 0)}
      </p>
    </div>
  </div>

  {/* Widget 3: Alertes Retards */}
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
      <AlertCircle className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Retard</p>
      <p className="text-xl font-black text-red-600">
        {rows.filter(r => new Date(r.date_livraison_prevue) < new Date() && r.statut !== 'RECEPTIONNEE').length}
      </p>
    </div>
  </div>

  {/* Widget 4: Taux de Service */}
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
      <CheckCircle2 className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Taux Réception</p>
      <p className="text-xl font-black text-green-600">
        {Math.round((rows.filter(r => r.statut === 'RECEPTIONNEE').length / rows.length) * 100 || 0)}%
      </p>
    </div>
  </div>
</div>

{/* FILTRES RAPIDES AVEC BADGES */}
<div className="flex gap-3 mb-8 overflow-x-auto pb-4 scrollbar-hide items-center">
  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Filtrer par :</div>
  {['TOUT', 'EN_ATTENTE', 'VALIDEE', 'PARTIELLEMENT_RECEPTIONNEE', 'RECEPTIONNEE'].map((s) => {
    const isActive = s === 'TOUT' ? query === '' : query === s;
    const count = s === 'TOUT' ? rows.length : (statusCounts[s] || 0);

    return (
      <button
        key={s}
        onClick={() => setQuery(s === 'TOUT' ? '' : s)}
        className={`group flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap border ${
          isActive 
          ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200 scale-105' 
          : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
        }`}
      >
        {s.replace(/_/g, ' ')}
        <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold transition-colors ${
          isActive 
          ? 'bg-indigo-500 text-white' 
          : 'bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600'
        }`}>
          {count}
        </span>
      </button>
    );
  })}
</div>

      {/* TABLE SECTION */}
      <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/40">
        <div className="overflow-x-auto">

          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <th className="px-8 py-6 w-10"></th>
                <th className="px-6 py-6">Référence</th>
                <th className="px-6 py-6">Logistique</th>
                <th className="px-6 py-6 text-center">Quantité</th>
                <th className="px-6 py-6">Créé par</th>
                <th className="px-6 py-6">Statut</th>
                <th className="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRows.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className={`group cursor-pointer transition-all ${expandedId === item.id ? 'bg-indigo-50/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <td className="px-8 py-5">
                       <ChevronDown className={`h-4 w-4 text-gray-300 transition-transform duration-500 ${expandedId === item.id ? 'rotate-180 text-indigo-600' : ''}`} />
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors">{item.numero_commande}</div>
                      <div className="text-[10px] text-gray-400 font-bold tracking-tighter uppercase">{formatDate(item.date_commande)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-700">{fournisseursMap.get(String(item.fournisseur_id))}</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 italic">📍 {entrepotsMap.get(String(item.entrepot_id))}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-1 font-black text-sm text-gray-800">
                        {item.quantite}
                      </div>
                      <div className="text-[10px] mt-1 text-gray-400 font-bold uppercase">{emballagesMap.get(String(item.emballage_id))}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex items-center rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-700">
                        {userNamesById[String(item.created_by)] ||
                          (String(item.created_by) === String(currentUser?.id)
                            ? (currentUser?.name || "-")
                            : `Utilisateur #${item.created_by}`)}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center rounded-full border px-4 py-1 text-[9px] font-black uppercase tracking-widest shadow-sm ${STATUT_STYLES[item.statut]}`}>
                        {item.statut}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(item)} className="p-3 text-gray-400 hover:bg-white hover:text-indigo-600 rounded-2xl shadow-none hover:shadow-md transition-all">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        {item.statut === "VALIDEE" && (
                          <button onClick={() => handleCancel(item.id)} className="p-3 text-gray-400 hover:bg-white hover:text-amber-600 rounded-2xl transition-all">
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                        {item.statut === "EN_ATTENTE" && (
                          <button onClick={() => handleDrop(item.id)} className="p-3 text-gray-400 hover:bg-white hover:text-red-600 rounded-2xl transition-all">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* TIMELINE DETAIL RÉEL */}
                  {expandedId === item.id && (
                    <tr>
                      <td colSpan={7} className="p-0 border-none bg-white">
                         <OrderTimelineDetail 
                            item={item} 
                            emballageLabel={emballagesMap.get(String(item.emballage_id))} 
                          />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        
      </div>
<div className="mt-6 flex justify-center">
  <Pagination
    currentPage={pagination.currentPage}
    totalPages={pagination.lastPage}
    onPageChange={goToPage}
  />
</div>
      {/* DRAWER SECTION */}
      {isDrawerOpen && (
        <>
          <div className="fixed inset-0 z-[1000] bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={closeDrawer} />
          <div className="fixed inset-y-0 right-0 z-[1001] w-full max-w-md transform border-l border-gray-100 bg-white shadow-[-30px_0_80px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out rounded-l-[3.5rem] overflow-hidden">
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-50 p-10 pb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{editing ? "Mise à jour" : "Nouvelle commande"}</h2>
                  <div className="h-1.5 w-12 bg-indigo-600 rounded-full mt-2 shadow-lg shadow-indigo-100" />
                </div>
                <button onClick={closeDrawer} className="rounded-2xl h-12 w-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:bg-gray-100 transition-all"><X /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {errorMessage && (
                  <div className="flex items-center gap-3 rounded-3xl border-2 border-red-100 bg-red-50 p-5 text-[11px] font-black text-red-600 uppercase tracking-wider animate-shake">
                    <AlertCircle className="h-5 w-5 shrink-0" /> {errorMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">📦 Type d'emballage</label>
                  <select value={form.emballage_id} onChange={(e) => setForm({ ...form, emballage_id: e.target.value, fournisseur_id: "" })} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-sm font-black focus:bg-white focus:border-indigo-600 outline-none transition-all cursor-pointer shadow-sm appearance-none" required>
                    <option value="">Sélectionner...</option>
                    {emballages.map(e => <option key={e.id} value={String(e.id)}>{e.label}</option>)}
                  </select>
                </div>

                <div className={`space-y-3 transition-all duration-500 ${!form.emballage_id ? "opacity-30 pointer-events-none scale-95" : "opacity-100 scale-100"}`}>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">🤝 Fournisseur autorisé</label>
                  <select value={form.fournisseur_id} disabled={!form.emballage_id} onChange={(e) => setForm({ ...form, fournisseur_id: e.target.value })} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-sm font-black focus:bg-white focus:border-indigo-600 transition-all cursor-pointer shadow-sm" required>
                    <option value="">{form.emballage_id ? "Choisir le fournisseur..." : "En attente de l'emballage"}</option>
                    {filteredFournisseurs.map(f => <option key={f.id} value={String(f.id)}>{f.label}</option>)}
                  </select>
                </div>

               {activeContract && contractStats && (
  <div className={`rounded-[2.5rem] border-2 p-8 space-y-4 shadow-inner transition-all duration-500 ${
    contractStats.depasse ? "border-red-100 bg-red-50/50" : "border-indigo-50 bg-indigo-50/30"
  }`}>
    <div className="flex justify-between items-end">
      <span className={`text-[10px] font-black uppercase tracking-widest ${
        contractStats.depasse ? "text-red-600" : "text-indigo-600"
      }`}>
        Capacité du contrat
      </span>
      <span className={`text-2xl font-black ${contractStats.depasse ? "text-red-600" : "text-indigo-900"}`}>
        {(( (contractStats.realise + Number(form.quantite)) / contractStats.total) * 100).toFixed(0)}%
      </span>
    </div>

    {/* Barre de progression */}
    <div className="h-3 w-full overflow-hidden rounded-full bg-white border border-indigo-100/50">
      <div 
        className={`h-full transition-all duration-1000 ${contractStats.depasse ? "bg-red-500" : "bg-indigo-600"}`} 
        style={{ width: `${Math.min(((contractStats.realise + Number(form.quantite)) / contractStats.total) * 100), 100}%` }} 
      />
    </div>

    {/* Message d'explication en cas de dépassement */}
    {contractStats.depasse ? (
      <div className="flex items-start gap-3 mt-4 animate-in fade-in slide-in-from-top-2">
        <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-red-700 leading-relaxed uppercase tracking-tight">
          Attention : Vous dépassez la limite du contrat de <span className="underline">{contractStats.surplus}</span> unités. 
          Veuillez réduire la quantité ou modifier le contrat fournisseur.
        </p>
      </div>
    ) : (
      <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase">
        <span>Reste disponible: {contractStats.restant}</span>
        <span>Plafond: {contractStats.total}</span>
      </div>
    )}
  </div>
)}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">🗓️ Livraison Prévue</label>
                    <input type="date" value={form.date_livraison_prevue} onChange={(e) => setForm({ ...form, date_livraison_prevue: e.target.value })} className="w-full rounded-2xl border-2 border-gray-50 p-4 text-sm font-black outline-none focus:border-indigo-600 transition-all shadow-sm" required />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">🔢 Quantité</label>
                    <input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })} className="w-full rounded-2xl border-2 border-gray-50 p-4 text-sm font-black outline-none focus:border-indigo-600 transition-all shadow-sm font-mono" required />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">🏠 Entrepôt de destination</label>
                  <select value={form.entrepot_id} onChange={(e) => setForm({ ...form, entrepot_id: e.target.value })} className="w-full rounded-2xl border-2 border-gray-50 p-4 text-sm font-black outline-none focus:border-indigo-600 transition-all shadow-sm" required>
                    <option value="">Sélectionner...</option>
                    {entrepots.map(en => <option key={en.id} value={String(en.id)}>{en.label}</option>)}
                  </select>
                </div>
              </form>

              <div className="border-t border-gray-50 p-10 flex gap-4 bg-white/80 backdrop-blur-md">
                <button type="button" onClick={closeDrawer} className="flex-1 rounded-2xl py-4 text-[11px] font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-[0.2em]">Annuler</button>
                <button
                  onClick={(e) => { e.preventDefault(); handleSubmit(e as any); }}
                  disabled={submitLoading || contractStats?.depasse || !form.fournisseur_id}
                  className="flex-[2] rounded-2xl bg-gray-900 py-5 text-[11px] font-black text-white shadow-2xl shadow-gray-200 hover:bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-300 transition-all uppercase tracking-[0.2em]"
                >
                  {submitLoading ? "Envoi en cours..." : editing ? "Confirmer la modification" : "Lancer la commande"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}