"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Facture, FactureStatut, TableFacture, FacturesPaginatorInfo, BonLivraisonOption, UpdateFactureInput, CreateFactureInput } from "@/types/facture";
import { 
  updateFacture,
  createFacture,
  deleteFacture,
  listAllFactures,
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
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";
import { formatNumber } from "@/lib/utils";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import { BreadcrumbNav } from "@/components/common/BreadcrumbNav";
import { BREADCRUMBS } from "@/lib/breadcrumbs";
import { useAuthStore } from "@/store/useAuthStore";

// Helper functions
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/** Valeur pour `<input type="date">` (yyyy-mm-dd, fuseau local). */
const toDateInputValue = (date: string | Date) => {
  if (!date) return new Date().toISOString().split("T")[0];
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatMoney = (amount: number | string) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return num.toFixed(3).replace(".", ",");
};

const asIdString = (value?: string | number | null) =>
  value === undefined || value === null ? "" : String(value);

const blFournisseurId = (bl: BonLivraisonOption) =>
  asIdString(bl.fournisseur_id ?? bl.commande?.fournisseur_id);

const blContratId = (bl: BonLivraisonOption) =>
  asIdString(bl.contrat_id ?? bl.commande?.contrat_id);

const isBlAvailable = (bl: BonLivraisonOption) =>
  !Boolean(bl.is_factured);

const TVA_RATE = 0.19;

function unitPriceFromContrat(
  contrat?: { montant_ht?: number; quantite_contractuelle?: number }
): number {
  const montant = Number(contrat?.montant_ht ?? 0);
  const qte = Number(contrat?.quantite_contractuelle ?? 0);
  if (montant > 0 && qte > 0) return montant / qte;
  return 10;
}

function estimateFactureAmounts(bls: BonLivraisonOption[]): { ht: number; ttc: number } {
  if (!bls.length) return { ht: 0, ttc: 0 };
  const unitPrice = unitPriceFromContrat(bls[0].commande?.contrat);
  const totalQte = bls.reduce((sum, bl) => sum + Number(bl.quantite_recue || 0), 0);
  const ht = Math.round(totalQte * unitPrice * 100) / 100;
  const ttc = Math.round(ht * (1 + TVA_RATE) * 100) / 100;
  return { ht, ttc };
}

function validateurLabel(facture: TableFacture): string | null {
  if (facture.valide_par && typeof facture.valide_par === "object") {
    return facture.valide_par.name;
  }
  return null;
}

function createurLabel(facture: TableFacture): string | null {
  if (facture.created_by && typeof facture.created_by === "object") {
    return facture.created_by.name;
  }
  return null;
}

function isFactureDeletable(facture: TableFacture): boolean {
  return facture.statut === "BROUILLON";
}

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

const STATUT_STYLES: Record<FactureStatut, string> = {
  BROUILLON: "bg-amber-50 text-amber-700 border-amber-200",
  VALIDE: "bg-blue-50 text-blue-700 border-blue-200",
  PAYE: "bg-green-50 text-green-700 border-green-200",
  ANNULE: "bg-red-50 text-red-700 border-red-200",
};

const STATUT_LABELS: Record<FactureStatut, string> = {
  BROUILLON: "Brouillon",
  VALIDE: "Validée",
  PAYE: "Payée",
  ANNULE: "Annulée",
};

const TERMINAL_STATUTS: FactureStatut[] = ["PAYE", "ANNULE"];

function getStatutOptions(current: FactureStatut): FactureStatut[] {
  switch (current) {
    case "BROUILLON":
      return ["BROUILLON", "VALIDE", "ANNULE"];
    case "VALIDE":
      return ["VALIDE", "PAYE", "ANNULE"];
    default:
      return [current];
  }
}


export default function FacturesTable({
  data,
  pagination,
  bonsLivraison,
}: {
  data: TableFacture[];
  pagination: FacturesPaginatorInfo;
  bonsLivraison: BonLivraisonOption[];
}) {
  const token = useAuthStore((state) => state.token);
  const [rows, setRows] = useState<TableFacture[]>([]);
  /** Jeu complet pour recherche / filtres statut. */
  const [allRows, setAllRows] = useState<TableFacture[]>([]);
  const [blOptions, setBlOptions] = useState<BonLivraisonOption[]>(bonsLivraison);
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
  useEffect(() => {
    setBlOptions(bonsLivraison.filter(isBlAvailable));
  }, [bonsLivraison]);

  useEffect(() => {
    if (!token) {
      setAllRows(rows);
      return;
    }

    const total = pagination.total ?? rows.length;
    if (total <= rows.length) {
      setAllRows(rows);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const all = await listAllFactures({ token });
        if (!cancelled) {
          setAllRows(all.map(normalizeFacture));
        }
      } catch {
        if (!cancelled) {
          setAllRows(rows);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, pagination.total, rows]);

  const markBlsAsFactured = (ids: string[]) => {
    const idSet = new Set(ids.map(String));
    setBlOptions((prev) =>
      prev.map((bl) =>
        idSet.has(String(bl.id)) ? { ...bl, is_factured: true } : bl
      )
    );
  };

  const markBlsAsAvailable = (ids: string[]) => {
    const idSet = new Set(ids.map(String));
    setBlOptions((prev) =>
      prev.map((bl) =>
        idSet.has(String(bl.id)) ? { ...bl, is_factured: false } : bl
      )
    );
  };

// 1. Calculer le nombre d'éléments par statut pour les badges
const statusCounts = useMemo(() => {
  const counts: Record<string, number> = {
    BROUILLON: 0,
    VALIDE: 0,
    PAYE: 0,
    ANNULE: 0,
  };
  
  allRows.forEach((item) => {
    if (counts[item.statut] !== undefined) {
      counts[item.statut]++;
    }
  });
  
  return counts;
}, [allRows]);

const isSearchActive = query.trim() !== "";

// 2. Sans filtre : page serveur. Avec recherche/filtre : toute la liste.
const filteredRows = useMemo(() => {
  const source = isSearchActive ? allRows : rows;
  const q = query.trim().toUpperCase();
  if (!q) return source;

  const statusList = ['BROUILLON', 'VALIDE', 'PAYE', 'ANNULE'];

  if (statusList.includes(q)) {
    return source.filter(r => r.statut === q);
  }

  return source.filter(r => 
    r.numero_facture?.toLowerCase().includes(query.toLowerCase()) ||
    r.fournisseur?.raison_sociale?.toLowerCase().includes(query.toLowerCase()) ||
    r.contrat?.numero_contrat?.toLowerCase().includes(query.toLowerCase())
  );
}, [isSearchActive, allRows, rows, query]);

  const factureSortColumns = useMemo<Record<string, SortColumn<TableFacture>>>(
    () => ({
      numero: { accessor: (f) => f.numero_facture, type: "string" },
      date: { accessor: (f) => f.date_facture, type: "date" },
      fournisseur: { accessor: (f) => f.fournisseur?.raison_sociale, type: "string" },
      contrat: { accessor: (f) => f.contrat?.numero_contrat, type: "string" },
      montant_ht: { accessor: (f) => f.montant_ht, type: "number" },
      montant_ttc: { accessor: (f) => f.montant_ttc, type: "number" },
      statut: { accessor: (f) => f.statut, type: "string" },
    }),
    []
  );

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(factureSortColumns);
  const sortedRows = useMemo(
    () => sortRows(filteredRows),
    [filteredRows, sortRows]
  );

  const blLookupById = useMemo(() => {
    const map = new Map<string, BonLivraisonOption>();
    blOptions.forEach((bl) => map.set(String(bl.id), bl));
    editing?.bon_livraisons?.forEach((bl) => map.set(String(bl.id), bl));
    return map;
  }, [blOptions, editing]);

  const selectedBls = useMemo(() => {
    return form.bon_livraison_ids
      .map((id) => blLookupById.get(id))
      .filter((bl): bl is BonLivraisonOption => Boolean(bl));
  }, [form.bon_livraison_ids, blLookupById]);

  const fournisseurOptions = useMemo(() => {
    const map = new Map<string, string>();
    blOptions.forEach((bl) => {
      const fid = asIdString(bl.fournisseur_id ?? bl.commande?.fournisseur_id);
      const name = bl.fournisseur_name ?? bl.commande?.fournisseur?.raison_sociale;
      if (fid && name && !map.has(fid)) map.set(fid, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [blOptions]);

  const contratOptions = useMemo(() => {
    const map = new Map<string, string>();
    blOptions.forEach((bl) => {
      const cid = asIdString(bl.contrat_id ?? bl.commande?.contrat_id);
      const name = bl.contrat_name ?? bl.commande?.contrat?.numero_contrat;
      const fid = asIdString(bl.fournisseur_id ?? bl.commande?.fournisseur_id);
      if (!cid || !name) return;
      if (form.fournisseur_id && fid !== form.fournisseur_id) return;
      if (!map.has(cid)) map.set(cid, name);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [blOptions, form.fournisseur_id]);

  const fournisseurPickerOptions = useMemo(
    () => fournisseurOptions.map((f) => ({ id: f.id, label: f.name })),
    [fournisseurOptions]
  );

  const contratPickerOptions = useMemo(
    () => contratOptions.map((c) => ({ id: c.id, label: c.name })),
    [contratOptions]
  );

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
    if (!selectedBls.length) return;

    const first = selectedBls[0];
    const fournisseurId = asIdString(first.fournisseur_id ?? first.commande?.fournisseur_id);
    const contratId = asIdString(first.contrat_id ?? first.commande?.contrat_id);

    const { ht } = estimateFactureAmounts(selectedBls);

    setForm((prev) => {
      const next = { ...prev };
      if (fournisseurId && prev.fournisseur_id !== fournisseurId) next.fournisseur_id = fournisseurId;
      if (contratId && prev.contrat_id !== contratId) next.contrat_id = contratId;
      if (!editing) {
        next.montant_ht = ht.toFixed(3);
      }
      return next;
    });
  }, [form.bon_livraison_ids, selectedBls, editing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setBlDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const estimatedAmounts = useMemo(() => {
    return estimateFactureAmounts(selectedBls);
  }, [selectedBls]);

  const filteredBL = useMemo(() => {
    const s = blSearch.trim().toLowerCase();

    let list = blOptions.filter((b) => {
      if (!isBlAvailable(b)) return false;
      return b.numero_bl.toLowerCase().includes(s);
    });

    if (form.fournisseur_id) {
      list = list.filter((b) => blFournisseurId(b) === form.fournisseur_id);
    }

    if (form.contrat_id) {
      list = list.filter((b) => blContratId(b) === form.contrat_id);
    }

    // Si un BL est déjà sélectionné, limiter au même fournisseur/contrat
    if (form.bon_livraison_ids.length > 0) {
      const firstBL = blOptions.find(
        (b) => String(b.id) === form.bon_livraison_ids[0]
      );
      if (firstBL) {
        const firstFournisseurId = blFournisseurId(firstBL);
        const firstContratId = blContratId(firstBL);
        list = list.filter(
          (b) =>
            blFournisseurId(b) === firstFournisseurId &&
            blContratId(b) === firstContratId
        );
      }
    }

    return list;
  }, [blOptions, blSearch, form.bon_livraison_ids, form.fournisseur_id, form.contrat_id]);

  const toggleBL = (id: string) => {
    const bl = blOptions.find((b) => String(b.id) === id);
    if (!bl) return;

    setForm((prev) => {
      if (prev.bon_livraison_ids.includes(id)) {
        return {
          ...prev,
          bon_livraison_ids: prev.bon_livraison_ids.filter((i) => i !== id),
        };
      }

      if (!isBlAvailable(bl)) {
        setErrorMessage(`Le BL ${bl.numero_bl} est déjà rattaché à une facture.`);
        return prev;
      }

      const fournisseurId = blFournisseurId(bl);
      const contratId = blContratId(bl);

      if (prev.bon_livraison_ids.length > 0) {
        const firstBL = blOptions.find(
          (b) => String(b.id) === prev.bon_livraison_ids[0]
        );
        if (
          firstBL &&
          (blFournisseurId(firstBL) !== fournisseurId ||
            blContratId(firstBL) !== contratId)
        ) {
          setErrorMessage(
            "Tous les BL d'une facture doivent appartenir au même fournisseur et contrat."
          );
          return prev;
        }
      }

      return {
        ...prev,
        bon_livraison_ids: [...prev.bon_livraison_ids, id],
        fournisseur_id: prev.fournisseur_id || fournisseurId,
        contrat_id: prev.contrat_id || contratId,
      };
    });
    setErrorMessage("");
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
      date_facture: toDateInputValue(item.date_facture),
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
        const updated = normalizeFacture(res.updateFacture);
        setRows(prev => prev.map(r => String(r.id) === String(editing.id) ? updated : r));
        setAllRows(prev => prev.map(r => String(r.id) === String(editing.id) ? updated : r));
        showSuccess("Facture modifiée.");
      } else {
        const payload: CreateFactureInput = {
          numero_facture: form.numero_facture,
          date_facture: form.date_facture,
          bon_livraison_ids: form.bon_livraison_ids,
          fournisseur_id: form.fournisseur_id || undefined,
          contrat_id: form.contrat_id || undefined,
          statut: "VALIDE",
        };
        const res = await createFacture(payload);
        const created = normalizeFacture(res.createFacture);
        setRows(prev => [created, ...prev]);
        setAllRows(prev => [created, ...prev]);
        markBlsAsFactured(form.bon_livraison_ids);
        router.refresh();
        showSuccess("Facture validée.");
      }
      closeDrawer();
    } catch (err: unknown) {
      setErrorMessage(getActionErrorMessage(err));
    } finally { setSubmitLoading(false); }
  }

  function handleDelete(id: Id) {
    const row = allRows.find((r) => String(r.id) === String(id))
      ?? rows.find((r) => String(r.id) === String(id));
    if (row && !isFactureDeletable(row)) {
      showError("Impossible de supprimer une facture validée ou clôturée.");
      return;
    }
    clearFeedback();
    const blIds =
      row?.bon_livraisons?.map((bl) => String(bl.id)) ?? [];

    openConfirm({
      title: "Supprimer cette facture ?",
      detail: row?.numero_facture ?? `#${id}`,
      description:
        blIds.length > 0
          ? "Cette action est irréversible. Les bons de livraison associés seront détachés et pourront être refacturés."
          : "Cette action est irréversible.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await deleteFacture(id);
          setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          setAllRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(String(id));
            return next;
          });
          if (blIds.length) {
            markBlsAsAvailable(blIds);
          }
          router.refresh();
          showSuccess("Facture supprimée.");
        }),
    });
  }

  const handleStatusChange = async (id: string | number, newStatut: FactureStatut) => {
    setUpdatingStatus(id);
    try {
      const currentFacture =
        allRows.find((r) => String(r.id) === String(id)) ??
        rows.find((r) => String(r.id) === String(id));
      if (!currentFacture) return;

      const allowed = getStatutOptions(currentFacture.statut);
      if (!allowed.includes(newStatut)) return;
      
      const res = await updateFacture(id, { 
        statut: newStatut,
        bon_livraison_ids: currentFacture.bon_livraisons.map(bl => bl.id)
      });
      const updated = normalizeFacture(res.updateFacture);
      setRows((prev) =>
        prev.map((row) =>
          String(row.id) === String(id) ? updated : row
        )
      );
      setAllRows((prev) =>
        prev.map((row) =>
          String(row.id) === String(id) ? updated : row
        )
      );
      showSuccess(
        newStatut === "VALIDE"
          ? "Facture validée."
          : "Statut de la facture mis à jour."
      );
      router.refresh();
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
            <BreadcrumbNav items={BREADCRUMBS.factures} />
          </div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
            Factures<span className="text-[#00A09D]">.</span>
          </h1>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
      
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
          Toutes ({pagination.total ?? allRows.length})
        </button>
        {Object.entries(statusCounts).map(([statut, count]) => (
          <button
            key={statut}
            onClick={() => setQuery(statut)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              query === statut 
                ? `${STATUT_STYLES[statut as FactureStatut]} shadow-lg` 
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {STATUT_LABELS[statut as FactureStatut]} ({count})
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl backdrop-blur-sm">
          <ResponsiveTableWrap>
          <table className="w-full min-w-[1100px]">
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
                <SortableTh columnKey="numero" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3" />N° Facture</span>
                </SortableTh>
                <SortableTh columnKey="date" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />Date</span>
                </SortableTh>
                <SortableTh columnKey="fournisseur" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  Fournisseur
                </SortableTh>
                <SortableTh columnKey="contrat" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  Contrat
                </SortableTh>
                <SortableTh columnKey="montant_ht" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <span className="inline-flex items-center gap-1"><Banknote className="h-3 w-3" />Montant HT</span>
                </SortableTh>
                <SortableTh columnKey="montant_ttc" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <span className="inline-flex items-center gap-1"><TrendingUp className="h-3 w-3" />Montant TTC</span>
                </SortableTh>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <User className="h-3 w-3" />
                  Validé par
                </th>
                <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-left text-[10px] font-black uppercase text-gray-500 tracking-wider">
                  <span className="inline-flex items-center gap-1"><AlertCircle className="h-3 w-3" />Statut</span>
                </SortableTh>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase text-gray-500 tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedRows.map((item) => (
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
                      {validateurLabel(item) ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                            <User className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {validateurLabel(item)}
                            </p>
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
                      ) : TERMINAL_STATUTS.includes(item.statut) ? (
                        <span className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black border uppercase shadow-sm ${STATUT_STYLES[item.statut]}`}>
                          {STATUT_LABELS[item.statut]}
                        </span>
                      ) : (
                        <div className="relative">
                          <select
                            value={item.statut}
                            onChange={(e) => handleStatusChange(item.id, e.target.value as FactureStatut)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black border uppercase cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none pr-8 shadow-sm transition-all hover:shadow-md ${STATUT_STYLES[item.statut]}`}
                          >
                            {getStatutOptions(item.statut).map((statut) => (
                              <option key={statut} value={statut}>
                                {STATUT_LABELS[statut].toUpperCase()}
                              </option>
                            ))}
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
                        {isFactureDeletable(item) ? (
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="group p-2.5 bg-red-50 rounded-xl hover:bg-red-100 transition-all duration-200 transform hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4 text-red-600 group-hover:rotate-12 transition-transform" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                  {expandedId === item.id && (
                    <tr className="bg-gray-50/80">
                      <td colSpan={10} className="border-t border-gray-100 px-6 py-10 sm:px-12 sm:py-14">
                        <div className="mx-auto max-w-6xl space-y-10 animate-in fade-in duration-300">
                          <div className="flex flex-wrap items-center gap-5">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200/60">
                              <FileText className="h-5 w-5" aria-hidden />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Détail facture
                              </p>
                              <h4 className="mt-1 text-xl font-black tracking-tight text-gray-900 sm:text-2xl">
                                #{item.numero_facture}
                              </h4>
                            </div>
                            <span className="ml-auto rounded-full border border-indigo-100 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wide text-indigo-700 shadow-sm">
                              {item.bon_livraisons?.length || 0} bon
                              {(item.bon_livraisons?.length || 0) > 1 ? "s" : ""} de livraison
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-12">
                            <div className="space-y-5 lg:col-span-3">
                              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                <Truck className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
                                Réceptions liées
                              </p>
                              <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">
                                {item.bon_livraisons?.length ? (
                                  <ul className="divide-y divide-gray-50">
                                    {item.bon_livraisons.map((bl: { id: Id; numero_bl: string; date_reception: string; quantite_recue: number }) => (
                                      <li
                                        key={bl.id}
                                        className="flex flex-col gap-4 px-6 py-6 transition-colors hover:bg-gray-50/80 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-7"
                                      >
                                        <div className="flex min-w-0 items-center gap-4">
                                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                            <Truck className="h-5 w-5" aria-hidden />
                                          </div>
                                          <div className="min-w-0">
                                            <p className="truncate font-bold text-gray-900">{bl.numero_bl}</p>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                              Réception le {formatDate(bl.date_reception)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="shrink-0 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-3 text-right sm:min-w-[8.5rem]">
                                          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-500">
                                            Quantité reçue
                                          </p>
                                          <p className="mt-0.5 font-mono text-lg font-black tabular-nums text-indigo-900">
                                            {formatNumber(bl.quantite_recue)}
                                          </p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="px-8 py-12 text-center text-sm font-medium text-gray-400">
                                    Aucun bon de livraison associé.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-5 lg:col-span-2">
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Informations
                              </p>
                              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-5">
                                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Créé par
                                  </span>
                                  <span className="text-sm font-semibold text-gray-900">
                                    {createurLabel(item) ?? "—"}
                                  </span>
                                </div>
                                {validateurLabel(item) ? (
                                  <div className="flex items-center justify-between gap-4 pt-5">
                                    <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                      Validé par
                                    </span>
                                    <span className="text-sm font-semibold text-green-700">
                                      {validateurLabel(item)}
                                    </span>
                                  </div>
                                ) : null}
                              </div>

                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                Synthèse financière
                              </p>
                              <div className="space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                                <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-5">
                                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    Montant HT
                                  </span>
                                  <span className="font-mono text-base font-bold tabular-nums text-gray-900 sm:text-lg">
                                    {formatMoney(item.montant_ht)} DT
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-4 border-b border-gray-50 pb-5">
                                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    TVA (19 %)
                                  </span>
                                  <span className="font-mono text-base font-semibold tabular-nums text-gray-600">
                                    {formatMoney(Number(item.montant_ht) * 0.19)} DT
                                  </span>
                                </div>
                                {(item.montant_penalites || 0) > 0 && (
                                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-red-100 bg-red-50/80 px-4 py-4">
                                    <span className="text-xs font-bold uppercase tracking-wide text-red-600">
                                      Pénalités
                                    </span>
                                    <span className="font-mono text-base font-bold tabular-nums text-red-700">
                                      −{formatMoney(item.montant_penalites || 0)} DT
                                    </span>
                                  </div>
                                )}
                                <div className="mt-2 rounded-[1.5rem] border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/80 to-white px-5 py-6 sm:px-6 sm:py-7">
                                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-600">
                                    Net à payer (TTC)
                                  </p>
                                  <p className="mt-2 font-mono text-2xl font-black tabular-nums tracking-tight text-indigo-950 sm:text-3xl">
                                    {formatMoney(item.montant_ttc)} DT
                                  </p>
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
        </ResponsiveTableWrap>
        
        {/* PAGINATION */}
        <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
          {isSearchActive ? (
            <p className="text-center text-sm text-gray-600">
              <span className="font-medium text-gray-900">{filteredRows.length}</span> résultat
              {filteredRows.length !== 1 ? "s" : ""} sur{" "}
              <span className="font-medium text-gray-900">{allRows.length}</span> facture
              {allRows.length !== 1 ? "s" : ""}
            </p>
          ) : (
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
          )}
        </div>
      </div>

      {/* DRAWER FORM */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[1000] bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={closeDrawer}
            aria-hidden
          />
          <div className="fixed inset-y-0 right-0 z-[1001] flex h-full max-h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-l-[3.5rem] border-l border-gray-100 bg-white shadow-[-30px_0_80px_rgba(0,0,0,0.1)] transition-transform duration-500 ease-out">
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0 border-b border-gray-50 px-8 pb-5 pt-8 sm:px-10 sm:pt-10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-black text-gray-900">
                      {editing ? "Modifier facture" : "Nouvelle facture"}
                    </h2>
                    <div className="mt-2 h-1.5 w-12 rounded-full bg-indigo-600 shadow-lg shadow-indigo-100" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Fournisseur, contrat & bons de livraison
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-all hover:bg-gray-100"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="form-scroll min-h-0 flex-1 space-y-5 px-8 py-5 sm:px-10 sm:py-6">
                  {errorMessage && (
                    <div className="flex items-center gap-3 rounded-3xl border-2 border-red-100 bg-red-50 p-5 text-[11px] font-black uppercase tracking-wider text-red-600">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {errorMessage}
                    </div>
                  )}

                  <div className="space-y-3 rounded-[1.75rem] border border-gray-100/90 bg-gradient-to-br from-white to-indigo-50/20 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Fournisseur
                      </label>
                      {fournisseurPickerOptions.length > 0 ? (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-500">
                          {fournisseurPickerOptions.length} choix
                        </span>
                      ) : null}
                    </div>
                    <OptionSearchablePicker
                      value={form.fournisseur_id}
                      onChange={handleFournisseurChange}
                      options={fournisseurPickerOptions}
                      placeholder="Rechercher ou choisir un fournisseur…"
                      searchPlaceholder="Rechercher par nom…"
                      emptyOptionsText="Aucun fournisseur lié aux BL disponibles."
                      noResultsText="Aucun fournisseur ne correspond à la recherche."
                      dropdownZClassName="z-[10050]"
                    />
                  </div>

                  <div
                    className={`space-y-3 rounded-[1.75rem] border border-gray-100/90 bg-gradient-to-br from-white to-slate-50/40 p-5 shadow-sm transition-all duration-300 ${
                      !form.fournisseur_id ? "pointer-events-none scale-[0.98] opacity-45" : "opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Contrat
                      </label>
                      {form.fournisseur_id && contratPickerOptions.length > 0 ? (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-slate-500">
                          {contratPickerOptions.length} contrat{contratPickerOptions.length !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>
                    <OptionSearchablePicker
                      value={form.contrat_id}
                      onChange={handleContratChange}
                      options={contratPickerOptions}
                      disabled={!form.fournisseur_id}
                      placeholder={
                        form.fournisseur_id
                          ? "Rechercher ou choisir un contrat…"
                          : "Sélectionnez d'abord un fournisseur"
                      }
                      searchPlaceholder="Rechercher un n° de contrat…"
                      emptyOptionsText="Aucun contrat pour ce fournisseur."
                      noResultsText="Aucun contrat ne correspond à la recherche."
                      dropdownZClassName="z-[10050]"
                      selectedOptionClassName="bg-slate-800/10 text-slate-900"
                    />
                  </div>

                  <div
                    className="space-y-3 rounded-[1.75rem] border border-gray-100/90 bg-gradient-to-br from-white to-gray-50/60 p-5 shadow-sm"
                    ref={dropdownRef}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        Bons de livraison
                      </label>
                      {form.bon_livraison_ids.length > 0 ? (
                        <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-600">
                          {form.bon_livraison_ids.length} sélectionné{form.bon_livraison_ids.length !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    {form.bon_livraison_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {form.bon_livraison_ids.map((id) => {
                          const bl = blLookupById.get(id);
                          return (
                            <div
                              key={id}
                              className="flex items-center gap-2 rounded-full bg-indigo-600 px-3 py-1.5 text-[10px] font-black text-white"
                            >
                              {bl?.numero_bl}
                              <button
                                type="button"
                                onClick={() => toggleBL(id)}
                                className="rounded-full p-0.5 hover:bg-white/20"
                                aria-label={`Retirer ${bl?.numero_bl}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="relative">
                      <Truck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/90 p-4 pl-12 text-sm font-black text-gray-900 outline-none transition-all hover:border-indigo-200 hover:bg-white focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                        placeholder="Rechercher un bon de livraison…"
                        value={blSearch}
                        onFocus={() => setBlDropdownOpen(true)}
                        onChange={(e) => setBlSearch(e.target.value)}
                      />
                    </div>

                    {blDropdownOpen && (
                      <div className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-xl ring-1 ring-black/5">
                        <div className="border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white px-3 py-2">
                          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            {filteredBL.length} BL disponible{filteredBL.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <ul className="role-picker-scroll max-h-52 overflow-y-auto overscroll-contain p-1.5">
                          {filteredBL.length > 0 ? (
                            filteredBL.map((bl) => {
                              const selected = form.bon_livraison_ids.includes(String(bl.id));
                              return (
                                <li key={bl.id}>
                                  <button
                                    type="button"
                                    onClick={() => toggleBL(String(bl.id))}
                                    className={`mb-1 flex w-full items-start justify-between gap-2 rounded-xl p-3 text-left text-xs font-bold transition-colors ${
                                      selected
                                        ? "bg-indigo-600/10 text-indigo-800"
                                        : "text-gray-800 hover:bg-indigo-50/60"
                                    }`}
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span className="font-black">{bl.numero_bl}</span>
                                      <span className="ml-2 font-semibold text-gray-400">
                                        ({bl.quantite_recue} reçus)
                                      </span>
                                      <span className="mt-1 block text-[10px] font-semibold text-gray-400">
                                        {bl.fournisseur_name ||
                                          bl.commande?.fournisseur?.raison_sociale ||
                                          "Fournisseur N/A"}{" "}
                                        —{" "}
                                        {bl.contrat_name ||
                                          bl.commande?.contrat?.numero_contrat ||
                                          "Contrat N/A"}
                                      </span>
                                    </span>
                                    {selected ? (
                                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })
                          ) : (
                            <li className="rounded-xl px-3 py-6 text-center text-xs font-black uppercase text-gray-400">
                              Aucun BL disponible
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      N° facture fournisseur
                    </label>
                    <input
                      className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/90 p-4 text-sm font-black outline-none transition-all focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                      required
                      value={form.numero_facture}
                      onChange={(e) => setForm({ ...form, numero_facture: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Date facture
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-2xl border-2 border-gray-100 bg-gray-50/90 p-4 text-sm font-bold outline-none focus:border-indigo-600 focus:bg-white"
                        value={form.date_facture}
                        onChange={(e) => setForm({ ...form, date_facture: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                        Montant HT (auto)
                      </label>
                      <div className="relative">
                        <Banknote className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                        <input
                          type="text"
                          readOnly
                          className="w-full cursor-default rounded-2xl border-2 border-indigo-100 bg-indigo-50/50 p-4 pl-12 text-sm font-black text-indigo-700 outline-none"
                          value={editing ? form.montant_ht : estimatedAmounts.ht.toFixed(3)}
                        />
                      </div>
                      {!editing ? (
                        <p className="ml-1 text-[10px] text-gray-400">
                          Calculé depuis le contrat et les quantités reçues des BL.
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-700 to-cyan-600 p-8 text-white shadow-xl">
                    <div className="relative z-10 flex items-center justify-between">
                      <div>
                        <p className="mb-1 text-[10px] font-black uppercase text-indigo-200">
                          Total estimé (TVA 19 %)
                        </p>
                        <p className="text-3xl font-black tabular-nums">
                          {(editing
                            ? Math.round(Number(form.montant_ht) * (1 + TVA_RATE) * 100) / 100
                            : estimatedAmounts.ttc
                          ).toFixed(3)}{" "}
                          <span className="text-sm font-medium">DT</span>
                        </p>
                      </div>
                      <TrendingUp className="h-10 w-10 text-white/40" />
                    </div>
                  </div>
                </div>

                <div className="shrink-0 border-t border-gray-50 bg-white/95 px-6 py-5 backdrop-blur-md sm:px-10 sm:py-6">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-indigo-600 py-5 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {submitLoading ? (
                      "Synchronisation…"
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        {editing ? "Enregistrer" : "Valider la facture"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}