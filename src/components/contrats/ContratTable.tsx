"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ContratHeader } from "./ContratHeader";
import { ContratListView } from "./ContratListView";
import { ContratForm } from "./ContratForm";
import { listContrats, createContrat, updateContrat, deleteContrat, extractContratFromFile, uploadContratDocument } from "@/lib/contrats.api";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/useAuthStore";
import { listFournisseurs } from "@/lib/fournisseurs.api";
import { listEmballages } from "@/lib/emballages.api";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import { listCommandes, normalizeCommande } from "@/lib/commandes.api";
import { normalizeContrat, TableContrat } from "@/types/contrat";
import { TableEmballages } from "@/types/emballage";
import type { UniteMesure } from "@/types/unite-mesure";
import { TableFournisseur } from "@/types/fournisseur";
import { useSearchParams } from "next/navigation";
import { Calendar, RotateCcw, Filter, ChevronDown, ChevronUp, Download, FileSpreadsheet } from "lucide-react";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportContratsCsv, type ContratUsageHistoryCsvRow } from "@/lib/contrats.csv";
import { drawOctPdfHeader } from "@/lib/octPdfHeader";
import { downloadBlob, fetchContratDocument, openBlobInNewTab } from "@/lib/contrats.document";
import {
  computeContratDashboardStats,
  matchesContratInsightFilter,
  matchesMontantHtRange,
  type ContratInsightFilter,
} from "@/lib/contratAnalytics";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

// Sous-composant interne pour la pagination en français
const LocalPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (p: number) => void 
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

const CONTRAT_SORT_COLUMNS: Record<string, SortColumn<TableContrat>> = {
  numero: { accessor: (c) => c.numero_contrat, type: "string" },
  fournisseur: { accessor: (c) => c.fournisseur?.raison_sociale, type: "string" },
  montant_ht: { accessor: (c) => c.montant_ht, type: "number" },
  quantite: { accessor: (c) => c.quantite_contractuelle, type: "number" },
  progression: { accessor: (c) => c.quantite_realisee, type: "number" },
  statut: { accessor: (c) => c.statut, type: "string" },
};

export default function ContratTable({ data }: { data?: TableContrat[] }) {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const token = useAuthStore((state) => state.token);
  const [rows, setRows] = useState<TableContrat[]>(data ? data.map(normalizeContrat) : []);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableContrat | null>(null);
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("TOUT");
  const [insightFilter, setInsightFilter] = useState<ContratInsightFilter>("");
  const [fournisseurFilter, setFournisseurFilter] = useState<string>("");
  const [emballageFilter, setEmballageFilter] = useState<string>("");
  const [fournisseurSearch, setFournisseurSearch] = useState<string>("");
  const [emballageSearch, setEmballageSearch] = useState<string>("");
  const [showFournisseurDropdown, setShowFournisseurDropdown] = useState(false);
  const [showEmballageDropdown, setShowEmballageDropdown] = useState(false);
  const [dateDebutFrom, setDateDebutFrom] = useState<string>("");
  const [dateDebutTo, setDateDebutTo] = useState<string>("");
  const [dateFinFrom, setDateFinFrom] = useState<string>("");
  const [dateFinTo, setDateFinTo] = useState<string>("");
  const [montantHtMin, setMontantHtMin] = useState<string>("");
  const [montantHtMax, setMontantHtMax] = useState<string>("");
  const [pendingDocumentFile, setPendingDocumentFile] = useState<File | null>(null);
  const [exportPeriodType, setExportPeriodType] = useState<"year" | "month">("year");
  const [exportYear, setExportYear] = useState<string>("");
  const [exportMonth, setExportMonth] = useState<string>("");
  const [exportContratId, setExportContratId] = useState<string>("");
  const [exportFournisseurId, setExportFournisseurId] = useState<string>("");
  const [exportEmballageId, setExportEmballageId] = useState<string>("");
  const [exportStatut, setExportStatut] = useState<string>("");
  const [exportContratSearch, setExportContratSearch] = useState<string>("");
  const [exportFournisseurSearch, setExportFournisseurSearch] = useState<string>("");
  const [exportEmballageSearch, setExportEmballageSearch] = useState<string>("");
  const [exportStatutSearch, setExportStatutSearch] = useState<string>("");
  const [showExportContratDropdown, setShowExportContratDropdown] = useState(false);
  const [showExportFournisseurDropdown, setShowExportFournisseurDropdown] = useState(false);
  const [showExportEmballageDropdown, setShowExportEmballageDropdown] = useState(false);
  const [showExportStatutDropdown, setShowExportStatutDropdown] = useState(false);
  const [showExportParams, setShowExportParams] = useState(false);
  const [showExportPeriodDropdown, setShowExportPeriodDropdown] = useState(false);
  const [showExportYearDropdown, setShowExportYearDropdown] = useState(false);
  const [showExportMonthDropdown, setShowExportMonthDropdown] = useState(false);
  const [exportYearSearch, setExportYearSearch] = useState<string>("");
  const [exportMonthSearch, setExportMonthSearch] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [focusPinned, setFocusPinned] = useState(Boolean(focusId));
  const [prevFocusId, setPrevFocusId] = useState(focusId);
  const itemsPerPage = 6;

  if (focusId !== prevFocusId) {
    setPrevFocusId(focusId);
    setFocusPinned(Boolean(focusId));
  }

  const [fournisseurs, setFournisseurs] = useState<TableFournisseur[]>([]);
  const [emballages, setEmballages] = useState<TableEmballages[]>([]);
  const [unitesMesure, setUnitesMesure] = useState<UniteMesure[]>([]);
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});

  const emptyForm: Partial<TableContrat> = {
    numero_contrat: "",
    date_debut: "",
    date_fin: "",
    quantite_contractuelle: 0,
    unite_quantite: "",
    taux_depassement_autorise: 0.2,
    quantite_realisee: 0,
    montant_cautionnement: undefined,
    statut: "ACTIF",
    note_statut: "",
    fournisseur_id: "",
    emballage_id: "",
  };
  const [form, setForm] = useState<Partial<TableContrat>>(emptyForm);

  const uniteLabelByCode = useMemo(() => {
    const m: Record<string, string> = {};
    for (const u of unitesMesure) {
      m[u.code] = u.label;
    }
    return m;
  }, [unitesMesure]);

  useEffect(() => {
    const loadRefs = async () => {
      if (!token) return;
      try {
        const [resF, resE, resU] = await Promise.all([
          listFournisseurs({ token }),
          listEmballages(1, 100, { token }),
          listUnitesMesure({ token }),
        ]);
        setFournisseurs(resF.fournisseurs || []);
        setEmballages(resE.emballages.data || []);
        setUnitesMesure(resU.unitesMesure || []);
      } catch (err) {
        console.error("Erreur de chargement des références", err);
      }
    };
    loadRefs();
  }, [token]);

  useEffect(() => {
    async function loadUsers() {
      if (!token) return;
      try {
        const res = await graphqlRequest<{ users: Array<{ id: string | number; name: string }> }>(
          `
            query ListUsersForContrats {
              users {
                id
                name
              }
            }
          `,
          {},
          { token }
        );
        const map: Record<string, string> = {};
        (res.users || []).forEach((u) => {
          map[String(u.id)] = u.name;
        });
        setUserNamesById(map);
      } catch {
        // fallback to IDs only in UI
      }
    }
    loadUsers();
  }, [token]);

  // Filtrage et Pagination combinés
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ACTIF: 0, EXPIRE: 0, SUSPENDU: 0 };
    rows.forEach((item) => {
      if (counts[item.statut] !== undefined) counts[item.statut]++;
    });
    return counts;
  }, [rows]);

  const filteredFournisseurs = useMemo(() => {
    const q = fournisseurSearch.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) => (f.raison_sociale || "").toLowerCase().includes(q));
  }, [fournisseurs, fournisseurSearch]);

  const filteredEmballages = useMemo(() => {
    const q = emballageSearch.trim().toLowerCase();
    if (!q) return emballages;
    return emballages.filter((e) => (e.name || "").toLowerCase().includes(q));
  }, [emballages, emballageSearch]);

  const selectedFournisseurLabel = useMemo(() => {
    if (!fournisseurFilter) return "Tous les fournisseurs";
    const selected = fournisseurs.find((f) => String(f.id) === fournisseurFilter);
    return selected?.raison_sociale || "Tous les fournisseurs";
  }, [fournisseurFilter, fournisseurs]);

  const selectedEmballageLabel = useMemo(() => {
    if (!emballageFilter) return "Tous les emballages";
    const selected = emballages.find((e) => String(e.id) === emballageFilter);
    return selected?.name || "Tous les emballages";
  }, [emballageFilter, emballages]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    rows.forEach((r) => {
      if (!r.date_debut) return;
      const y = new Date(r.date_debut).getFullYear();
      if (!Number.isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [rows]);

  const filteredExportContrats = useMemo(() => {
    const q = exportContratSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.numero_contrat || "").toLowerCase().includes(q));
  }, [rows, exportContratSearch]);

  const filteredExportFournisseurs = useMemo(() => {
    const q = exportFournisseurSearch.trim().toLowerCase();
    if (!q) return fournisseurs;
    return fournisseurs.filter((f) => (f.raison_sociale || "").toLowerCase().includes(q));
  }, [fournisseurs, exportFournisseurSearch]);

  const filteredExportEmballages = useMemo(() => {
    const q = exportEmballageSearch.trim().toLowerCase();
    if (!q) return emballages;
    return emballages.filter((e) => (e.name || "").toLowerCase().includes(q));
  }, [emballages, exportEmballageSearch]);

  const filteredExportStatuts = useMemo(() => {
    const allStatuts = ["ACTIF", "EXPIRE", "SUSPENDU"];
    const q = exportStatutSearch.trim().toLowerCase();
    if (!q) return allStatuts;
    return allStatuts.filter((s) => s.toLowerCase().includes(q));
  }, [exportStatutSearch]);

  const filteredExportYears = useMemo(() => {
    const q = exportYearSearch.trim().toLowerCase();
    const years = availableYears.map(String);
    if (!q) return years;
    return years.filter((y) => y.toLowerCase().includes(q));
  }, [availableYears, exportYearSearch]);

  const filteredExportMonths = useMemo(() => {
    const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    const q = exportMonthSearch.trim().toLowerCase();
    if (!q) return months;
    return months.filter((m) => monthLabel(m).toLowerCase().includes(q) || m.includes(q));
  }, [exportMonthSearch]);

  const selectedExportContratLabel = useMemo(() => {
    if (!exportContratId) return "Tous les contrats";
    return rows.find((r) => String(r.id) === exportContratId)?.numero_contrat || "Tous les contrats";
  }, [rows, exportContratId]);

  const selectedExportFournisseurLabel = useMemo(() => {
    if (!exportFournisseurId) return "Tous les fournisseurs";
    return fournisseurs.find((f) => String(f.id) === exportFournisseurId)?.raison_sociale || "Tous les fournisseurs";
  }, [fournisseurs, exportFournisseurId]);

  const selectedExportEmballageLabel = useMemo(() => {
    if (!exportEmballageId) return "Tous les emballages";
    return emballages.find((e) => String(e.id) === exportEmballageId)?.name || "Tous les emballages";
  }, [emballages, exportEmballageId]);

  const selectedExportPeriodLabel = exportPeriodType === "year" ? "Annee" : "Mois d'une annee";
  const selectedExportYearLabel = exportYear || "Toutes";
  const selectedExportMonthLabel = exportMonth ? monthLabel(exportMonth) : "Tous";

  const exportRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toDate = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startMin = toDate(dateDebutFrom);
    const startMax = toDate(dateDebutTo);
    const endMin = toDate(dateFinFrom);
    const endMax = toDate(dateFinTo);

    return rows.filter((r) => {
      const matchesText =
        !q ||
        r.numero_contrat?.toLowerCase().includes(q) ||
        r.fournisseur?.raison_sociale?.toLowerCase().includes(q);
      const matchesStatusTable = statusFilter === "TOUT" || r.statut === statusFilter;
      const matchesFournisseurTable =
        !fournisseurFilter || String(r.fournisseur_id ?? "") === fournisseurFilter;
      const matchesEmballageTable =
        !emballageFilter || String(r.emballage_id ?? "") === emballageFilter;

      const dateDebutTable = toDate(r.date_debut);
      const dateFinTable = toDate(r.date_fin);
      const matchesDateDebutFrom = !startMin || (dateDebutTable && dateDebutTable >= startMin);
      const matchesDateDebutTo = !startMax || (dateDebutTable && dateDebutTable <= startMax);
      const matchesDateFinFrom = !endMin || (dateFinTable && dateFinTable >= endMin);
      const matchesDateFinTo = !endMax || (dateFinTable && dateFinTable <= endMax);

      const dateDebut = r.date_debut ? new Date(r.date_debut) : null;
      const rowYear = dateDebut ? String(dateDebut.getFullYear()) : "";
      const rowMonth = dateDebut ? String(dateDebut.getMonth() + 1).padStart(2, "0") : "";

      const matchYear = !exportYear || rowYear === exportYear;
      const matchMonth = exportPeriodType === "year" || !exportMonth || rowMonth === exportMonth;
      const matchContrat = !exportContratId || String(r.id) === exportContratId;
      const matchFournisseur = !exportFournisseurId || String(r.fournisseur_id) === exportFournisseurId;
      const matchEmballage = !exportEmballageId || String(r.emballage_id) === exportEmballageId;
      const matchStatut = !exportStatut || r.statut === exportStatut;
      const matchesMontant = matchesMontantHtRange(r.montant_ht, montantHtMin, montantHtMax);

      const matchesAdvancedEntityParams =
        matchContrat && matchFournisseur && matchEmballage && matchStatut;

      return (
        matchesText &&
        matchesStatusTable &&
        matchesFournisseurTable &&
        matchesEmballageTable &&
        matchesDateDebutFrom &&
        matchesDateDebutTo &&
        matchesDateFinFrom &&
        matchesDateFinTo &&
        matchesMontant &&
        matchYear &&
        matchMonth &&
        matchesAdvancedEntityParams
      );
    });
  }, [
    rows,
    query,
    statusFilter,
    fournisseurFilter,
    emballageFilter,
    dateDebutFrom,
    dateDebutTo,
    dateFinFrom,
    dateFinTo,
    montantHtMin,
    montantHtMax,
    exportYear,
    exportMonth,
    exportPeriodType,
    exportContratId,
    exportFournisseurId,
    exportEmballageId,
    exportStatut,
  ]);

  const exportStats = useMemo(() => {
    const totalContrats = exportRows.length;
    const totalContractuel = exportRows.reduce((acc, r) => acc + Number(r.quantite_contractuelle || 0), 0);
    const totalRealise = exportRows.reduce((acc, r) => acc + Number(r.quantite_realisee || 0), 0);
    const totalRestant = totalContractuel - totalRealise;
    const tauxGlobal = totalContractuel > 0 ? (totalRealise / totalContractuel) * 100 : 0;
    return { totalContrats, totalContractuel, totalRealise, totalRestant, tauxGlobal };
  }, [exportRows]);

  function monthLabel(month: string) {
    const labels: Record<string, string> = {
      "01": "Janvier", "02": "Fevrier", "03": "Mars", "04": "Avril",
      "05": "Mai", "06": "Juin", "07": "Juillet", "08": "Aout",
      "09": "Septembre", "10": "Octobre", "11": "Novembre", "12": "Decembre",
    };
    return labels[month] || month;
  }

  async function getContratUsageHistory() {
    if (!exportContratId) return [];
    if (!token) return [];
    try {
      const res = await listCommandes(1, 1000, { token });
      const commandes = (res.commandes?.data || []).map(normalizeCommande);
      const linked = commandes
        .filter((c) => String(c.contrat_id ?? "") === exportContratId)
        .sort((a, b) => new Date(a.date_commande).getTime() - new Date(b.date_commande).getTime());

      let cumul = 0;
      return linked.map((c) => {
        const qteRecue = Number((c as any).quantite_recue_total ?? 0);
        cumul += qteRecue;
        return {
          date: c.date_commande || "-",
          numero: c.numero_commande || "-",
          statut: c.statut || "-",
          qteCommandee: Number(c.quantite ?? 0),
          qteRecue,
          cumulRealise: cumul,
          resteCommande: Number((c as any).reste ?? 0),
        };
      });
    } catch {
      return [];
    }
  }

  const handleExportPdf = async () => {
    if (!exportRows.length) {
      showInfo("Aucune donnée à exporter avec ces paramètres.");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    const period = exportPeriodType === "month" && exportMonth ? `${monthLabel(exportMonth)} ${exportYear || ""}` : (exportYear || "Toutes periodes");

    let y = await drawOctPdfHeader(doc, "Etat des contrats", 12);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Date export: ${new Date().toLocaleString("fr-FR")}`, 14, y);
    y += 6;
    doc.text(`Periode: ${period}`, 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [["Indicateur", "Valeur"]],
      body: [
        ["Nombre contrats", String(exportStats.totalContrats)],
        ["Quantite contractuelle", String(exportStats.totalContractuel)],
        ["Quantite realisee", String(exportStats.totalRealise)],
        ["Reste", String(exportStats.totalRestant)],
        ["Taux global (%)", exportStats.tauxGlobal.toFixed(2)],
      ],
      theme: "grid",
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      head: [["Contrat", "Fournisseur", "Emballage", "Debut", "Fin", "Contractuelle", "Realisee", "Reste", "Taux dep. %", "Reste + dep.", "Taux %", "Statut"]],
      body: exportRows.map((r) => {
        const qContractuelle = Number(r.quantite_contractuelle || 0);
        const qRealisee = Number(r.quantite_realisee || 0);
        const restant = qContractuelle - qRealisee;
        const rawRate = Number(r.taux_depassement_autorise ?? 0);
        const tauxDepassementPercent = rawRate <= 1 ? rawRate * 100 : rawRate;
        const restantAvecDepassement = restant + (restant * tauxDepassementPercent) / 100;
        const taux = qContractuelle > 0 ? (qRealisee / qContractuelle) * 100 : 0;
        return [
          r.numero_contrat || "-",
          r.fournisseur?.raison_sociale || "-",
          r.emballage?.name || "-",
          r.date_debut || "-",
          r.date_fin || "-",
          String(qContractuelle),
          String(qRealisee),
          String(restant),
          tauxDepassementPercent.toFixed(2),
          restantAvecDepassement.toFixed(2),
          taux.toFixed(2),
          r.statut,
        ];
      }),
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [28, 36, 52] },
      didParseCell: (hookData) => {
        if (hookData.section !== "body") return;
        const col = hookData.column.index;
        if (col !== 7 && col !== 9) return;
        const value = Number(String(hookData.cell.raw).replace(",", "."));
        if (Number.isNaN(value)) return;
        if (value < 0) hookData.cell.styles.textColor = [220, 38, 38];
        else if (value === 0) hookData.cell.styles.textColor = [22, 163, 74];
        else hookData.cell.styles.textColor = [217, 119, 6];
      },
    });

    if (exportContratId) {
      const history = await getContratUsageHistory();
      if (history.length) {
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 6,
          head: [["Historique qte realisee (contrat)", "", "", "", "", "", ""]],
          body: [],
          theme: "plain",
          styles: { fontSize: 9, fontStyle: "bold" },
        });
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 2,
          head: [["Date", "Commande", "Statut", "Qte commandee", "Qte recue", "Cumul realise", "Reste cmd"]],
          body: history.map((h) => [
            h.date,
            h.numero,
            h.statut,
            String(h.qteCommandee),
            String(h.qteRecue),
            String(h.cumulRealise),
            String(h.resteCommande),
          ]),
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [52, 73, 94] },
        });
      }
    }

    const filename = `etat-contrats-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  };

  const handleExport = async () => {
    if (exporting || exportingCsv) return;
    setExporting(true);
    try {
      await handleExportPdf();
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = async () => {
    if (!exportRows.length) {
      showInfo("Aucune donnée à exporter avec ces paramètres.");
      return;
    }
    if (exporting || exportingCsv) return;
    setExportingCsv(true);
    try {
      const period =
        exportPeriodType === "month" && exportMonth
          ? `${monthLabel(exportMonth)} ${exportYear || ""}`
          : exportYear || "Toutes periodes";

      let history: ContratUsageHistoryCsvRow[] = [];
      if (exportContratId) {
        const raw = await getContratUsageHistory();
        history = raw.map((h) => ({
          date: h.date,
          numero: h.numero,
          statut: h.statut,
          qteCommandee: h.qteCommandee,
          qteRecue: h.qteRecue,
          cumulRealise: h.cumulRealise,
          resteCommande: h.resteCommande,
        }));
      }

      exportContratsCsv(exportRows, exportStats, period, history);
    } catch (e) {
      console.error(e);
      showError("Erreur lors de l'export CSV.");
    } finally {
      setExportingCsv(false);
    }
  };

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(CONTRAT_SORT_COLUMNS);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const toDate = (value?: string | null) => {
      if (!value) return null;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const startMin = toDate(dateDebutFrom);
    const startMax = toDate(dateDebutTo);
    const endMin = toDate(dateFinFrom);
    const endMax = toDate(dateFinTo);

    return rows.filter((r) => {
      const matchesText =
        !q ||
        r.numero_contrat?.toLowerCase().includes(q) ||
        r.fournisseur?.raison_sociale?.toLowerCase().includes(q);

      const matchesStatus = statusFilter === "TOUT" || r.statut === statusFilter;
      const matchesFournisseur =
        !fournisseurFilter || String(r.fournisseur_id ?? "") === fournisseurFilter;
      const matchesEmballage =
        !emballageFilter || String(r.emballage_id ?? "") === emballageFilter;

      const dateDebut = toDate(r.date_debut);
      const dateFin = toDate(r.date_fin);

      const matchesDateDebutFrom = !startMin || (dateDebut && dateDebut >= startMin);
      const matchesDateDebutTo = !startMax || (dateDebut && dateDebut <= startMax);
      const matchesDateFinFrom = !endMin || (dateFin && dateFin >= endMin);
      const matchesDateFinTo = !endMax || (dateFin && dateFin <= endMax);
      const matchesMontant = matchesMontantHtRange(r.montant_ht, montantHtMin, montantHtMax);
      const matchesInsight = matchesContratInsightFilter(r, insightFilter);

      return (
        matchesText &&
        matchesStatus &&
        matchesFournisseur &&
        matchesEmballage &&
        matchesDateDebutFrom &&
        matchesDateDebutTo &&
        matchesDateFinFrom &&
        matchesDateFinTo &&
        matchesMontant &&
        matchesInsight
      );
    });
  }, [
    rows,
    query,
    statusFilter,
    insightFilter,
    fournisseurFilter,
    emballageFilter,
    dateDebutFrom,
    dateDebutTo,
    dateFinFrom,
    dateFinTo,
    montantHtMin,
    montantHtMax,
  ]);

  const sortedRows = useMemo(() => sortRows(filteredRows), [filteredRows, sortRows]);

  const totalPages = Math.ceil(sortedRows.length / itemsPerPage);

  const focusTargetPage = useMemo(() => {
    if (!focusId) return null;
    const targetIndex = sortedRows.findIndex((row) => String(row.id) === String(focusId));
    if (targetIndex === -1) return null;
    return Math.floor(targetIndex / itemsPerPage) + 1;
  }, [focusId, sortedRows, itemsPerPage]);

  const activePage =
    focusPinned && focusTargetPage !== null ? focusTargetPage : currentPage;

  const paginatedRows = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return sortedRows.slice(start, start + itemsPerPage);
  }, [sortedRows, activePage, itemsPerPage]);

  useEffect(() => {
    if (!focusId || focusTargetPage === null) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`contrat-row-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusId, focusTargetPage, sortedRows, activePage]);

  // Reset la page si on recherche
  useEffect(() => {
    setFocusPinned(false);
    setCurrentPage(1);
  }, [query, statusFilter, insightFilter, fournisseurFilter, emballageFilter, dateDebutFrom, dateDebutTo, dateFinFrom, dateFinTo, montantHtMin, montantHtMax, sortKey, sortDirection]);

  const handleInsightFilterChange = (filter: ContratInsightFilter) => {
    setInsightFilter(filter);
    if (filter) {
      setStatusFilter("TOUT");
      setShowFilters(true);
    }
    setCurrentPage(1);
    setFocusPinned(false);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    if (status !== "TOUT") setInsightFilter("");
    setCurrentPage(1);
    setFocusPinned(false);
  };

  const stats = useMemo(() => computeContratDashboardStats(rows), [rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. ON TRIE : On sépare ce qui est interdit de ce qui est autorisé
      // On retire id, fournisseur, emballage, created_at, updated_at, etc.
      const { 
        id, 
        fournisseur, 
        emballage, 
        created_at, 
        updated_at, 
        __typename, 
        ...fields 
      } = form as any;

      // 2. ON NETTOIE : On s'assure que les nombres sont bien des nombres
      const payload = {
        ...fields,
        numero_contrat: fields.numero_contrat || "",
        date_debut: fields.date_debut || "",
        date_fin: fields.date_fin || "",
        quantite_contractuelle: Number(fields.quantite_contractuelle) || 0,
        fournisseur_id: fields.fournisseur_id || "",
        emballage_id: fields.emballage_id || "",
      };

      let updated: TableContrat;
      if (editing) {
        const res = await updateContrat(editing.id, payload);
        updated = normalizeContrat(res.updateContrat);
      } else {
        const res = await createContrat(payload);
        updated = normalizeContrat(res.createContrat);
      }

      if (pendingDocumentFile) {
        const uploadRes = await uploadContratDocument(updated.id, pendingDocumentFile);
        updated = normalizeContrat(uploadRes.uploadContratDocument);
        setPendingDocumentFile(null);
      }

      updated.fournisseur = fournisseurs.find(f => String(f.id) === String(payload.fournisseur_id));
      updated.emballage = emballages.find(em => String(em.id) === String(payload.emballage_id));

      setRows(prev => editing ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev]);
      setIsOpen(false);
      setEditing(null);
      setForm(emptyForm);
      showSuccess(editing ? "Contrat modifié." : "Contrat créé.");
    } catch (err) {
      console.error(err);
      showError(getActionErrorMessage(err, "Erreur de sauvegarde : vérifiez les champs obligatoires."));
    } finally {
      setLoading(false);
    }
  };

  const handleExtractFromFile = async (file: File) => {
    setPendingDocumentFile(file);
    setExtracting(true);
    try {
      const res = await extractContratFromFile(file);
      const extracted = res.extractContratFromFile;
      console.log("[OCR] GraphQL extractContratFromFile response:", extracted);

      // Reload references because OCR may create a new fournisseur/emballage
      // that are not yet present in the current dropdown options.
      if (token) {
        const [resF, resE] = await Promise.all([
          listFournisseurs({ token }),
          listEmballages(1, 100, { token }),
        ]);
        setFournisseurs(resF.fournisseurs || []);
        setEmballages(resE.emballages.data || []);
      }

      setForm((prev) => ({
        ...prev,
        numero_contrat: extracted.numero_contrat || prev.numero_contrat || "",
        objet: extracted.objet || prev.objet || "",
        date_signature: extracted.date_signature || prev.date_signature || "",
        date_debut: extracted.date_debut || prev.date_debut || "",
        date_fin: extracted.date_fin || prev.date_fin || "",
        quantite_contractuelle: Number(extracted.quantite_contractuelle ?? prev.quantite_contractuelle ?? 0),
        unite_quantite: extracted.unite_quantite ?? prev.unite_quantite ?? "",
        montant_ht: extracted.montant_ht ?? prev.montant_ht ?? null,
        montant_tva: extracted.montant_tva ?? prev.montant_tva ?? 0,
        montant_cautionnement:
          extracted.montant_cautionnement !== undefined && extracted.montant_cautionnement !== null
            ? Number(extracted.montant_cautionnement)
            : prev.montant_cautionnement,
        taux_cautionnement:
          extracted.taux_cautionnement !== undefined && extracted.taux_cautionnement !== null
            ? Number(extracted.taux_cautionnement)
            : prev.taux_cautionnement,
        taux_penalite_retard:
          extracted.taux_penalite_retard !== undefined && extracted.taux_penalite_retard !== null
            ? Number(extracted.taux_penalite_retard)
            : prev.taux_penalite_retard,
        plafond_penalite:
          extracted.plafond_penalite !== undefined && extracted.plafond_penalite !== null
            ? Number(extracted.plafond_penalite)
            : prev.plafond_penalite,
        taux_depassement_autorise:
          extracted.taux_depassement_autorise !== undefined && extracted.taux_depassement_autorise !== null
            ? Number(extracted.taux_depassement_autorise)
            : prev.taux_depassement_autorise,
        statut: extracted.statut || prev.statut || "ACTIF",
        fournisseur_id: extracted.fournisseur_id || prev.fournisseur_id || "",
        emballage_id: extracted.emballage_id || prev.emballage_id || "",
      }));
      showSuccess("Extraction OCR terminée et formulaire pré-rempli.");
    } catch (error) {
      showError(getActionErrorMessage(error, "Extraction OCR impossible."));
    } finally {
      setExtracting(false);
    }
  };

  const requestDeleteContrat = (id: string | number) => {
    const item = rows.find((x) => String(x.id) === String(id));
    clearFeedback();
    openConfirm({
      title: "Supprimer ce contrat ?",
      detail: item?.numero_contrat ?? "",
      description: "Cette action est définitive.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await deleteContrat(id);
          setRows((r) => r.filter((x) => String(x.id) !== String(id)));
          showSuccess("Contrat supprimé.");
        }),
    });
  };

  const handleViewDocument = async (contrat: TableContrat) => {
    try {
      const { blob } = await fetchContratDocument(contrat.id, "inline", token || undefined);
      openBlobInNewTab(blob);
    } catch (err) {
      showError(getActionErrorMessage(err, "Impossible d'ouvrir le document."));
    }
  };

  const handleDownloadDocument = async (contrat: TableContrat) => {
    try {
      const { blob, filename } = await fetchContratDocument(contrat.id, "attachment", token || undefined);
      downloadBlob(blob, filename);
    } catch (err) {
      showError(getActionErrorMessage(err, "Impossible de télécharger le document."));
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[700px]">
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
      <ContratHeader
        query={query}
        setQuery={setQuery}
        onOpenNew={() => { setEditing(null); setForm(emptyForm); setPendingDocumentFile(null); setIsOpen(true); }}
        stats={stats}
        insightFilter={insightFilter}
        onInsightFilterChange={handleInsightFilterChange}
      />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 md:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              showFilters
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200"
            }`}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Masquer filtres" : "Afficher filtres"}
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setStatusFilter("TOUT");
              setInsightFilter("");
              setFournisseurFilter("");
              setEmballageFilter("");
              setDateDebutFrom("");
              setDateDebutTo("");
              setDateFinFrom("");
              setDateFinTo("");
              setMontantHtMin("");
              setMontantHtMax("");
              setFournisseurSearch("");
              setEmballageSearch("");
              setShowFournisseurDropdown(false);
              setShowEmballageDropdown(false);
              setQuery("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all"
          >
            <RotateCcw className="h-4 w-4" />
            Reset filtres
          </button>
        </div>

        {showFilters && (
        <>
        <div className="flex gap-3 overflow-x-auto pb-2 filter-bar-scroll items-center animate-in fade-in slide-in-from-top-2 duration-200">
          {["TOUT", "ACTIF", "EXPIRE", "SUSPENDU"].map((status) => {
            const isActive = statusFilter === status;
            const count = status === "TOUT" ? rows.length : statusCounts[status] || 0;
            return (
              <button
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                className={`group flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap border ${
                  isActive
                    ? "bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200 scale-105"
                    : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                {status}
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold transition-colors ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fournisseur</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowFournisseurDropdown((prev) => !prev);
                      setShowEmballageDropdown(false);
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm flex items-center justify-between"
                  >
                    <span className="truncate">{selectedFournisseurLabel}</span>
                    {showFournisseurDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {showFournisseurDropdown && (
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                      <input
                        type="text"
                        value={fournisseurSearch}
                        onChange={(e) => setFournisseurSearch(e.target.value)}
                        placeholder="Rechercher fournisseur..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                      <div className="mt-2 max-h-48 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setFournisseurFilter("");
                            setShowFournisseurDropdown(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                            fournisseurFilter === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Tous les fournisseurs
                        </button>
                        {filteredFournisseurs.map((f) => (
                          <button
                            key={String(f.id)}
                            type="button"
                            onClick={() => {
                              setFournisseurFilter(String(f.id));
                              setShowFournisseurDropdown(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                              fournisseurFilter === String(f.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {f.raison_sociale}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emballage</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmballageDropdown((prev) => !prev);
                      setShowFournisseurDropdown(false);
                    }}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm flex items-center justify-between"
                  >
                    <span className="truncate">{selectedEmballageLabel}</span>
                    {showEmballageDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </button>
                  {showEmballageDropdown && (
                    <div className="absolute z-20 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                      <input
                        type="text"
                        value={emballageSearch}
                        onChange={(e) => setEmballageSearch(e.target.value)}
                        placeholder="Rechercher emballage..."
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all"
                      />
                      <div className="mt-2 max-h-48 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEmballageFilter("");
                            setShowEmballageDropdown(false);
                          }}
                          className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                            emballageFilter === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Tous les emballages
                        </button>
                        {filteredEmballages.map((e) => (
                          <button
                            key={String(e.id)}
                            type="button"
                            onClick={() => {
                              setEmballageFilter(String(e.id));
                              setShowEmballageDropdown(false);
                            }}
                            className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition-all ${
                              emballageFilter === String(e.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {e.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date début - du</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateDebutFrom}
                  onChange={(e) => setDateDebutFrom(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                  title="Date début à partir de"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date début - au</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateDebutTo}
                  onChange={(e) => setDateDebutTo(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                  title="Date début jusqu'à"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date fin - du</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateFinFrom}
                  onChange={(e) => setDateFinFrom(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                  title="Date fin à partir de"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date fin - au</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={dateFinTo}
                  onChange={(e) => setDateFinTo(e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
                  title="Date fin jusqu'à"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant HT min (DT)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={montantHtMin}
                onChange={(e) => setMontantHtMin(e.target.value)}
                placeholder="Ex. 10000"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant HT max (DT)</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={montantHtMax}
                onChange={(e) => setMontantHtMax(e.target.value)}
                placeholder="Ex. 500000"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em]">Parametres export</h3>
          <div className="text-xs font-semibold text-gray-500">
            Lignes a exporter: <span className="text-gray-900">{exportRows.length}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowExportParams((prev) => !prev)}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${
              showExportParams
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200"
            }`}
          >
            <Filter className="h-4 w-4" />
            {showExportParams ? "Masquer export" : "Afficher export"}
            {showExportParams ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {showExportParams && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Periode</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportPeriodDropdown((v) => !v);
                  setShowExportYearDropdown(false);
                  setShowExportMonthDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedExportPeriodLabel}</span>
                {showExportPeriodDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportPeriodDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <div className="max-h-36 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportPeriodType("year"); setShowExportPeriodDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportPeriodType === "year" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Annee
                    </button>
                    <button
                      type="button"
                      onClick={() => { setExportPeriodType("month"); setShowExportPeriodDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportPeriodType === "month" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Mois d&apos;une annee
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Annee</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportYearDropdown((v) => !v);
                  setShowExportPeriodDropdown(false);
                  setShowExportMonthDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedExportYearLabel}</span>
                {showExportYearDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportYearDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportYearSearch}
                    onChange={(e) => setExportYearSearch(e.target.value)}
                    placeholder="Rechercher annee..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-44 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportYear(""); setShowExportYearDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportYear === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Toutes
                    </button>
                    {filteredExportYears.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => { setExportYear(year); setShowExportYearDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportYear === year ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mois</label>
            <div className="relative">
              <button
                type="button"
                disabled={exportPeriodType !== "month"}
                onClick={() => {
                  setShowExportMonthDropdown((v) => !v);
                  setShowExportPeriodDropdown(false);
                  setShowExportYearDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between disabled:opacity-40"
              >
                <span className="truncate">{selectedExportMonthLabel}</span>
                {showExportMonthDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportMonthDropdown && exportPeriodType === "month" && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportMonthSearch}
                    onChange={(e) => setExportMonthSearch(e.target.value)}
                    placeholder="Rechercher mois..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-44 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportMonth(""); setShowExportMonthDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportMonth === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Tous
                    </button>
                    {filteredExportMonths.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => { setExportMonth(m); setShowExportMonthDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportMonth === m ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {monthLabel(m)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contrat</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportContratDropdown((v) => !v);
                  setShowExportFournisseurDropdown(false);
                  setShowExportEmballageDropdown(false);
                  setShowExportStatutDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedExportContratLabel}</span>
                {showExportContratDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportContratDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportContratSearch}
                    onChange={(e) => setExportContratSearch(e.target.value)}
                    placeholder="Rechercher contrat..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-44 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportContratId(""); setShowExportContratDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportContratId === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Tous les contrats
                    </button>
                    {filteredExportContrats.map((r) => (
                      <button
                        key={String(r.id)}
                        type="button"
                        onClick={() => { setExportContratId(String(r.id)); setShowExportContratDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportContratId === String(r.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {r.numero_contrat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fournisseur</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportFournisseurDropdown((v) => !v);
                  setShowExportContratDropdown(false);
                  setShowExportEmballageDropdown(false);
                  setShowExportStatutDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedExportFournisseurLabel}</span>
                {showExportFournisseurDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportFournisseurDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportFournisseurSearch}
                    onChange={(e) => setExportFournisseurSearch(e.target.value)}
                    placeholder="Rechercher fournisseur..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-44 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportFournisseurId(""); setShowExportFournisseurDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportFournisseurId === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Tous les fournisseurs
                    </button>
                    {filteredExportFournisseurs.map((f) => (
                      <button
                        key={String(f.id)}
                        type="button"
                        onClick={() => { setExportFournisseurId(String(f.id)); setShowExportFournisseurDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportFournisseurId === String(f.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {f.raison_sociale}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emballage</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportEmballageDropdown((v) => !v);
                  setShowExportContratDropdown(false);
                  setShowExportFournisseurDropdown(false);
                  setShowExportStatutDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{selectedExportEmballageLabel}</span>
                {showExportEmballageDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportEmballageDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportEmballageSearch}
                    onChange={(e) => setExportEmballageSearch(e.target.value)}
                    placeholder="Rechercher emballage..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-44 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportEmballageId(""); setShowExportEmballageDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportEmballageId === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Tous les emballages
                    </button>
                    {filteredExportEmballages.map((e) => (
                      <button
                        key={String(e.id)}
                        type="button"
                        onClick={() => { setExportEmballageId(String(e.id)); setShowExportEmballageDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportEmballageId === String(e.id) ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowExportStatutDropdown((v) => !v);
                  setShowExportContratDropdown(false);
                  setShowExportFournisseurDropdown(false);
                  setShowExportEmballageDropdown(false);
                }}
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 shadow-sm flex items-center justify-between"
              >
                <span className="truncate">{exportStatut || "Tous les statuts"}</span>
                {showExportStatutDropdown ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showExportStatutDropdown && (
                <div className="absolute z-30 mt-2 w-full rounded-2xl border border-gray-200 bg-white shadow-xl p-2">
                  <input
                    type="text"
                    value={exportStatutSearch}
                    onChange={(e) => setExportStatutSearch(e.target.value)}
                    placeholder="Rechercher statut..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-600"
                  />
                  <div className="mt-2 max-h-40 no-scrollbar overflow-y-auto overscroll-contain space-y-1 pr-1">
                    <button
                      type="button"
                      onClick={() => { setExportStatut(""); setShowExportStatutDropdown(false); }}
                      className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportStatut === "" ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      Tous les statuts
                    </button>
                    {filteredExportStatuts.map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => { setExportStatut(status); setShowExportStatutDropdown(false); }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-xs font-semibold ${exportStatut === status ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-50"}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || exportingCsv}
            className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 text-white px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            {exporting ? "Export PDF..." : "Exporter PDF"}
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting || exportingCsv}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-gray-900 bg-white text-gray-900 px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-lg shadow-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportingCsv ? "Export CSV..." : "Exporter CSV"}
          </button>
        </div>
        </>
        )}
      </div>

      <div className="flex-1">
        <ContratListView
          rows={paginatedRows}
          focusedId={focusId}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={toggleSort}
          userNamesById={userNamesById}
          uniteLabelByCode={uniteLabelByCode}
          onEdit={(c) => { setEditing(c); setForm(c); setPendingDocumentFile(null); setIsOpen(true); }}
          onDelete={requestDeleteContrat}
          onViewDocument={handleViewDocument}
          onDownloadDocument={handleDownloadDocument}
        />
      </div>

      {/* FOOTER : Pagination en français */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <LocalPagination 
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setFocusPinned(false);
              setCurrentPage(page);
            }}
          />
        </div>
      )}

      <ContratForm
        isOpen={isOpen}
        editing={!!editing}
        form={form}
        setForm={setForm}
        onClose={() => { setIsOpen(false); setPendingDocumentFile(null); }}
        onSubmit={handleSubmit}
        loading={loading}
        extracting={extracting}
        onExtractFromFile={handleExtractFromFile}
        onDocumentFile={setPendingDocumentFile}
        hasPendingDocument={!!pendingDocumentFile}
        fournisseurs={fournisseurs}
        emballages={emballages}
        unitesMesure={unitesMesure}
      />
    </div>
  );
}