"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Facture, FactureStatut, TableFacture, FacturesPaginatorInfo, BonLivraisonOption, UpdateFactureInput, CreateFactureInput } from "@/types/facture";
import { 
  updateFacture,
  createFacture,
  deleteFacture,
  normalizeFacture
} from "@/lib/factures.api";
import { exportFacturesPdf } from "@/lib/factures.pdf";
import { exportFacturesCsv } from "@/lib/factures.csv";
import { 
  Edit2, Trash2, ChevronDown, ChevronRight, Truck, Calendar, 
  AlertCircle, Search, Plus, User, FileText, Banknote, X, Check, TrendingUp, Save, Printer, FileSpreadsheet
} from "lucide-react";
import Pagination from "@/components/tables/Pagination";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

// Helper functions
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatMoney = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(3).replace(".", ",");
};

const asIdString = (value?: string | number | null) =>
  value === undefined || value === null ? "" : String(value);

type Id = string | number;

type FactureForm = {
  numero_facture: string;
  date_facture: string;
  montant_ht: string;
  bon_livraison_ids: string[]; // Changé en tableau pour le multi-sélection
  fournisseur_id: string;
  contrat_id: string;
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
  fournisseur_id: "",
  contrat_id: "",
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const {
    feedback,
    confirm,
    showSuccess,
    showError,
    showInfo,
    clearFeedback,
    openConfirm,
    closeConfirm,
    runConfirmedAction,
  } = useAppFeedback();

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
    r.numero_facture?.toLowerCase().includes(query.toLowerCase()) ||
    r.fournisseur?.raison_sociale?.toLowerCase().includes(query.toLowerCase()) ||
    r.contrat?.numero_contrat?.toLowerCase().includes(query.toLowerCase())
  );
}, [rows, query]);

  const fournisseurOptions = useMemo(() => {
    const map = new Map<string, string>();
    bonsLivraison.forEach((bl) => {
      const fid = asIdString(bl.fournisseur_id ?? bl.commande?.fournisseur_id);
      const name = bl.fournisseur_name ?? bl.commande?.fournisseur?.raison_sociale;
      if (fid && name && !map.has(fid)) map.set(fid, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bonsLivraison]);

  const contratOptions = useMemo(() => {
    const map = new Map<string, string>();
    bonsLivraison.forEach((bl) => {
      const cid = asIdString(bl.contrat_id ?? bl.commande?.contrat_id);
      const name = bl.contrat_name ?? bl.commande?.contrat?.numero_contrat;
      const fid = asIdString(bl.fournisseur_id ?? bl.commande?.fournisseur_id);
      if (!cid || !name) return;
      if (form.fournisseur_id && fid !== form.fournisseur_id) return;
      if (!map.has(cid)) map.set(cid, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [bonsLivraison, form.fournisseur_id]);

  const selectedCount = useMemo(() => {
    const ids = new Set(filteredRows.map((r) => String(r.id)));
    let n = 0;
    selectedIds.forEach((id) => {
      if (ids.has(id)) n += 1;
    });
    return n;
  }, [filteredRows, selectedIds]);

  const allFilteredSelected =
    filteredRows.length > 0 &&
    filteredRows.every((r) => selectedIds.has(String(r.id)));

  const toggleSelectRow = (id: string | number) => {
    const sid = String(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const every = filteredRows.length > 0 && filteredRows.every((r) => next.has(String(r.id)));
      if (every) {
        filteredRows.forEach((r) => next.delete(String(r.id)));
      } else {
        filteredRows.forEach((r) => next.add(String(r.id)));
      }
      return next;
    });
  };

  const handlePrintPdf = () => {
    const list = filteredRows.filter((r) => selectedIds.has(String(r.id)));
    if (!list.length) {
      showInfo("Sélectionnez au moins une facture à imprimer.");
      return;
    }
    try {
      exportFacturesPdf(list);
      showSuccess("PDF généré.");
    } catch (e) {
      console.error(e);
      showError("Erreur lors de la génération du PDF.");
    }
  };

  const handleExportCsv = () => {
    const list = filteredRows.filter((r) => selectedIds.has(String(r.id)));
    if (!list.length) {
      showInfo("Sélectionnez au moins une facture à exporter.");
      return;
    }
    try {
      exportFacturesCsv(list);
      showSuccess("Export CSV terminé.");
    } catch (e) {
      console.error(e);
      showError("Erreur lors de l'export CSV.");
    }
  };

  // --- AUTO-REMPLISSAGE DES VALEURS + FOURNISSEUR/CONTRAT ---
  useEffect(() => {
    if (!form.bon_livraison_ids.length) return;
    const selectedBLs = bonsLivraison.filter((bl) =>
      form.bon_livraison_ids.includes(String(bl.id))
    );
    if (!selectedBLs.length) return;

    const first = selectedBLs[0];
    const fournisseurId = asIdString(first.fournisseur_id ?? first.commande?.fournisseur_id);
    const contratId = asIdString(first.contrat_id ?? first.commande?.contrat_id);
    const totalQuantite = selectedBLs.reduce((sum, bl) => sum + bl.quantite_recue, 0);

    setForm((prev) => {
      const next = { ...prev };
      if (fournisseurId && prev.fournisseur_id !== fournisseurId) next.fournisseur_id = fournisseurId;
      if (contratId && prev.contrat_id !== contratId) next.contrat_id = contratId;
      if (!prev.montant_ht || prev.montant_ht === "0") {
        next.montant_ht = (totalQuantite * 100).toFixed(3);
      }
      return next;
    });
  }, [form.bon_livraison_ids, bonsLivraison]);

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

    let list = bonsLivraison.filter((b) => {
      const isSelected = form.bon_livraison_ids.includes(String(b.id));
      return b.numero_bl.toLowerCase().includes(s) && (!b.is_factured || isSelected);
    });

    if (form.fournisseur_id) {
      list = list.filter((b) => {
        const fid = asIdString(b.fournisseur_id ?? b.commande?.fournisseur_id);
        return fid === form.fournisseur_id;
      });
    }

    if (form.contrat_id) {
      list = list.filter((b) => {
        const cid = asIdString(b.contrat_id ?? b.commande?.contrat_id);
        return cid === form.contrat_id;
      });
    }

    // Si un BL est déjà sélectionné, on garde la contrainte "même commande"
    if (form.bon_livraison_ids.length > 0) {
      const firstBLId = form.bon_livraison_ids[0];
      const firstBL = bonsLivraison.find((b) => String(b.id) === firstBLId);
      if (!firstBL) return [];
      list = list.filter((b) => b.commande_id === firstBL.commande_id);
    }

    return list;
  }, [bonsLivraison, blSearch, form.bon_livraison_ids, form.fournisseur_id, form.contrat_id]);

  const toggleBL = (id: string) => {
    const bl = bonsLivraison.find((b) => String(b.id) === id);
    setForm((prev) => {
      if (prev.bon_livraison_ids.includes(id)) {
        return {
          ...prev,
          bon_livraison_ids: prev.bon_livraison_ids.filter((i) => i !== id),
        };
      }

      const fournisseurId = asIdString(bl?.fournisseur_id ?? bl?.commande?.fournisseur_id);
      const contratId = asIdString(bl?.contrat_id ?? bl?.commande?.contrat_id);

      return {
        ...prev,
        bon_livraison_ids: [...prev.bon_livraison_ids, id],
        fournisseur_id: prev.fournisseur_id || fournisseurId,
        contrat_id: prev.contrat_id || contratId,
      };
    });
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setBlSearch("");
    setIsDrawerOpen(true);
  };
  
  const openEdit = (item: TableFacture) => {
    setEditing(item);
    setForm({
      numero_facture: item.numero_facture || "",
      date_facture: formatDate(item.date_facture),
      montant_ht: String(item.montant_ht || ""),
      bon_livraison_ids: item.bon_livraisons?.map(bl => String(bl.id)) || [],
      fournisseur_id: asIdString(item.fournisseur_id ?? item.fournisseur?.id),
      contrat_id: asIdString(item.contrat_id ?? item.contrat?.id),
      statut: item.statut,
    });
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => { if (!submitLoading) { setIsDrawerOpen(false); setErrorMessage(""); } };

  const handleFournisseurChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      fournisseur_id: value,
      contrat_id: value ? prev.contrat_id : "",
      bon_livraison_ids: [],
    }));
  };

  const handleContratChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      contrat_id: value,
      bon_livraison_ids: [],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.bon_livraison_ids.length === 0) return setErrorMessage("Sélectionnez au moins un Bon de Livraison");
    if (!form.fournisseur_id || !form.contrat_id) {
      return setErrorMessage("Sélectionnez un fournisseur et un contrat, ou choisissez un BL pour auto-remplir.");
    }
    
    setSubmitLoading(true);
    try {
      if (editing) {
        const payload: UpdateFactureInput = {
          numero_facture: form.numero_facture,
          date_facture: form.date_facture,
          montant_ht: Number(form.montant_ht),
          bon_livraison_ids: form.bon_livraison_ids,
          statut: form.statut,
        };
        const res = await updateFacture(editing.id, payload);
        setRows(prev => prev.map(r => String(r.id) === String(editing.id) ? normalizeFacture(res.updateFacture) : r));
        showSuccess("Facture modifiée.");
      } else {
        const payload: CreateFactureInput = {
          numero_facture: form.numero_facture,
          date_facture: form.date_facture,
          montant_ht: Number(form.montant_ht),
          bon_livraison_ids: form.bon_livraison_ids,
          fournisseur_id: form.fournisseur_id || undefined,
          contrat_id: form.contrat_id || undefined,
          statut: form.statut,
        };
        const res = await createFacture(payload);
        setRows(prev => [normalizeFacture(res.createFacture), ...prev]);
        showSuccess("Facture créée.");
      }
      closeDrawer();
    } catch (err: unknown) {
      setErrorMessage(getActionErrorMessage(err));
    } finally { setSubmitLoading(false); }
  }

  function handleDelete(id: Id) {
    const row = rows.find((r) => String(r.id) === String(id));
    clearFeedback();
    openConfirm({
      title: "Supprimer cette facture ?",
      detail: row?.numero_facture ?? `#${id}`,
      description: "Cette action est irréversible.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await deleteFacture(id);
          setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(String(id));
            return next;
          });
          showSuccess("Facture supprimée.");
        }),
    });
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
      showSuccess("Statut de la facture mis à jour.");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError(getActionErrorMessage(error, "Erreur lors de la mise à jour du statut."));
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <>
      <div className="bg-[#F0F4F4] px-8 pt-4">
        <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      </div>
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
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

        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] font-black text-gray-400 uppercase block">Total Actif</span>
            <span className="text-2xl font-black text-gray-900 leading-none">{filteredRows.length} Factures</span>
          </div>
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={selectedCount === 0}
            className="flex items-center gap-2 border-2 border-[#00A09D] text-[#00A09D] px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00A09D] hover:text-white transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <Printer className="h-4 w-4" />
            Imprimer PDF
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={selectedCount === 0}
            className="flex items-center gap-2 border-2 border-gray-700 text-gray-800 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm disabled:opacity-40 disabled:pointer-events-none"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exporter CSV
            {selectedCount > 0 ? ` (${selectedCount})` : ""}
          </button>
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
                <th className="w-12 px-3 py-4 text-center text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-[#00A09D] focus:ring-[#00A09D] cursor-pointer"
                    checked={allFilteredSelected && filteredRows.length > 0}
                    ref={(el) => {
                      if (el) {
                        el.indeterminate =
                          selectedCount > 0 && !allFilteredSelected;
                      }
                    }}
                    onChange={toggleSelectAllFiltered}
                    disabled={filteredRows.length === 0}
                    title="Tout sélectionner sur cette vue"
                  />
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <FileText className="h-3 w-3" />
                  N° Facture
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <Calendar className="h-3 w-3" />
                  Date
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  Fournisseur
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  Contrat
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
                    <td
                      className="w-12 px-3 py-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-[#00A09D] focus:ring-[#00A09D] cursor-pointer"
                        checked={selectedIds.has(String(item.id))}
                        onChange={() => toggleSelectRow(item.id)}
                        aria-label={`Sélectionner la facture ${item.numero_facture}`}
                      />
                    </td>
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
                      <p className="text-sm font-semibold text-gray-900">
                        {item.fournisseur?.raison_sociale || "-"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.contrat?.numero_contrat || "-"}
                      </p>
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
                      <td colSpan={10} className="p-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Fournisseur</label>
                  <select
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-2 border-transparent focus:border-indigo-600 outline-none"
                    value={form.fournisseur_id}
                    onChange={(e) => handleFournisseurChange(e.target.value)}
                  >
                    <option value="">Choisir un fournisseur</option>
                    {fournisseurOptions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400">Contrat</label>
                  <select
                    className="w-full bg-gray-50 rounded-2xl p-4 text-sm font-bold border-2 border-transparent focus:border-indigo-600 outline-none"
                    value={form.contrat_id}
                    onChange={(e) => handleContratChange(e.target.value)}
                  >
                    <option value="">Choisir un contrat</option>
                    {contratOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                        <span>
                          {bl.numero_bl}
                          <span className="text-gray-400 ml-2">({bl.quantite_recue} reçus)</span>
                          <span className="block text-[10px] text-gray-400 font-semibold mt-1">
                            {bl.fournisseur_name || bl.commande?.fournisseur?.raison_sociale || "Fournisseur N/A"} - {bl.contrat_name || bl.commande?.contrat?.numero_contrat || "Contrat N/A"}
                          </span>
                        </span>
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