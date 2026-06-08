"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  createBonLivraisonWithFile,
  updateBonLivraison,
  deleteBonLivraison,
  normalizeBonLivraison,
} from "@/lib/bon-livraisons.api";
import {
  computeResteALivrer,
  isQuantiteRecueBLValide,
  MESSAGE_QUANTITE_BL_TROP_ELEVEE,
} from "@/lib/bon-livraisons.validation";
import { graphqlRequest } from "@/lib/graphqlClient";
import { useAuthStore } from "@/store/useAuthStore";
import {
  TableBonLivraison,
  BonLivraisonsPaginatorInfo,
  EmballageOption,
  EntrepotOption,
  CommandeOption,
} from "@/types/bon-livraison";
import { 
  X, FileText, Upload, Edit2, AlertCircle, ShoppingCart, Truck, CheckCircle2, Search, ArrowRight, Eye, Download
} from "lucide-react";
import { CommandeSearchablePicker } from "@/components/bon-livraisons/CommandeSearchablePicker";
import { formatNumber } from "@/lib/utils";
import { BonLivraisonDocumentModal } from "@/components/bon-livraisons/BonLivraisonDocumentModal";
import BonLivraisonDetailDrawer from "@/components/bon-livraisons/BonLivraisonDetailDrawer";
import {
  downloadBlob,
  fetchBonLivraisonDocument,
} from "@/lib/bon-livraisons.document";
import { UniteMesureSearchablePicker } from "@/components/unites-mesure/UniteMesureSearchablePicker";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import {
  convertQuantityBetweenUnites,
  formatQuantitePrincipale,
  normalizeUnitCode,
  unitCodesEqual,
  resolvePrincipalUnitCode,
  unitesCompatibleQuantiteCommande,
} from "@/lib/unite-conversion";
import type { UniteMesure } from "@/types/unite-mesure";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { useAppFeedback } from "@/hooks/useAppFeedback";
const PER_PAGE = 10;
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
// --- SOUS-COMPOSANT : TIMELINE BUS ---
const CommandeTimeline = ({
  total,
  dejaRecu,
  actuel,
  uniteCode,
}: {
  total: number;
  dejaRecu: number;
  actuel: number;
  /** Code unité principale (ex. KG) pour l'affichage */
  uniteCode?: string;
}) => {
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
            <span className="text-[10px] font-bold text-gray-400 uppercase">
              / {total} {uniteCode ? uniteCode : "—"}
            </span>
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
  statut: "VALIDE" | "ANNULE";
};

const emptyForm: BonLivraisonForm = {
  date_reception: new Date().toISOString().split("T")[0],
  emballage_id: "",
  quantite_recue: "",
  numero_commande: "",
  entrepot_id: "",
  statut: "VALIDE",
};

export default function BonLivraisonsTable({
  data,
  pagination,
  emballages,
  commandes,
  entrepots,
  unitesMesure,
  readOnly = false,
}: {
  data: TableBonLivraison[];
  pagination: BonLivraisonsPaginatorInfo;
  emballages: EmballageOption[];
  commandes: CommandeOption[];
  entrepots: EntrepotOption[];
  unitesMesure: UniteMesure[];
  /** Agent Finance : consultation sans création ni édition. */
  readOnly?: boolean;
}) {
  const token = useAuthStore((state) => state.token);
  const [rows, setRows] = useState<TableBonLivraison[]>(data);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableBonLivraison | null>(null);
  const [form, setForm] = useState<BonLivraisonForm>(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [quantiteUniteSaisie, setQuantiteUniteSaisie] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TOUS" | "VALIDE" | "ANNULE">("TOUS");
  const isEditMode = Boolean(editing);
  const lockLogisticsFields = isEditMode || Boolean(form.numero_commande);
  const isCancelledBL = isEditMode && editing?.statut === "ANNULE";
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const {
    feedback,
    confirm,
    showSuccess,
    showError,
    clearFeedback,
    openConfirm,
    closeConfirm,
    runConfirmedAction,
  } = useAppFeedback();

  const [currentPage, setCurrentPage] = useState(1);
  const [documentViewerBl, setDocumentViewerBl] = useState<TableBonLivraison | null>(null);
  const [detailBl, setDetailBl] = useState<TableBonLivraison | null>(null);
  const [documentDownloadLoadingId, setDocumentDownloadLoadingId] = useState<string | null>(null);

  useEffect(() => setRows(data), [data]);

  const handleDownloadDocument = async (bl: TableBonLivraison) => {
    if (!bl.document_bl) return;
    setDocumentDownloadLoadingId(String(bl.id));
    try {
      const result = await fetchBonLivraisonDocument(bl.id, "attachment", token ?? undefined);
      downloadBlob(result.blob, result.filename);
      showSuccess("Justificatif téléchargé.");
    } catch (e: unknown) {
      showError(e instanceof Error ? e.message : "Téléchargement impossible.");
    } finally {
      setDocumentDownloadLoadingId(null);
    }
  };

  useEffect(() => {
    async function loadUsers() {
      if (!token) return;
      try {
        const res = await graphqlRequest<{ users: Array<{ id: string | number; name: string }> }>(
          `
            query ListUsersForBL {
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
        // silent fallback: UI keeps IDs if users query unavailable
      }
    }
    loadUsers();
  }, [token]);

  const commandesEnAttente = useMemo(() => {
    return commandes.filter((c: any) => c.statut !== "RECEPTIONNEE");
  }, [commandes]);

  const commandesPourPicker = useMemo(() => {
    if (isEditMode && editing) {
      const cur = commandes.find((c) => c.numero_commande === editing.numero_commande);
      const ids = new Set(commandesEnAttente.map((c) => String(c.id)));
      if (cur && !ids.has(String(cur.id))) {
        return [cur, ...commandesEnAttente];
      }
    }
    return commandesEnAttente;
  }, [isEditMode, editing, commandes, commandesEnAttente]);

  const selectedCommande = useMemo(
    () => commandes.find((c) => c.numero_commande === form.numero_commande),
    [commandes, form.numero_commande]
  );

  const selectedCommandeForForm = useMemo(() => {
    if (selectedCommande) return selectedCommande;
    if (!editing) return null;
    return commandes.find((c) => c.numero_commande === editing.numero_commande) || null;
  }, [selectedCommande, editing, commandes]);
  const isCommandeFullyReceived = selectedCommandeForForm?.statut === "RECEPTIONNEE";

  const entrepotNomPourAnnulation = useMemo(() => {
    if (!editing) return "l'entrepôt";
    const id = String(editing.entrepot_id ?? form.entrepot_id ?? "");
    return entrepots.find((e) => String(e.id) === id)?.label ?? "l'entrepôt";
  }, [editing, form.entrepot_id, entrepots]);

  const dejaRecu = useMemo(() => {
    if (!selectedCommandeForForm) return 0;
    return Number(selectedCommandeForForm.quantite_recue_total ?? 0);
  }, [selectedCommandeForForm]);

  const remainingQuantity = useMemo(() => {
    if (!selectedCommandeForForm) return 0;
    if (selectedCommandeForForm.reste !== undefined && selectedCommandeForForm.reste !== null) {
      return Number(selectedCommandeForForm.reste);
    }
    return computeResteALivrer(
      Number(selectedCommandeForForm.quantite),
      Number(selectedCommandeForForm.quantite_recue_total ?? 0)
    );
  }, [selectedCommandeForForm]);

  const commandeUnitByNumero = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of commandes) {
      const emb = emballages.find((e) => String(e.id) === String(c.emballage_id));
      m.set(c.numero_commande, resolvePrincipalUnitCode(emb?.capacity_unit ?? null, unitesMesure));
    }
    return m;
  }, [commandes, emballages, unitesMesure]);

  const principalUnitCode = useMemo(() => {
    if (!selectedCommandeForForm) return "";
    const emb = emballages.find((e) => String(e.id) === String(selectedCommandeForForm.emballage_id));
    return resolvePrincipalUnitCode(emb?.capacity_unit ?? null, unitesMesure);
  }, [selectedCommandeForForm, emballages, unitesMesure]);

  const principalUnitLabel = useMemo(() => {
    if (!principalUnitCode) return "";
    const urow = unitesMesure.find((u) => unitCodesEqual(u.code, principalUnitCode));
    return urow ? `${urow.label} (${urow.code})` : principalUnitCode;
  }, [unitesMesure, principalUnitCode]);

  const unitesQuantiteCompat = useMemo(
    () => (principalUnitCode ? unitesCompatibleQuantiteCommande(principalUnitCode, unitesMesure) : []),
    [principalUnitCode, unitesMesure]
  );

  const quantiteEnPrincipal = useMemo(() => {
    const raw = String(form.quantite_recue).trim();
    if (!selectedCommandeForForm || raw === "") {
      return null;
    }
    const q = Number(raw.replace(",", "."));
    if (!Number.isFinite(q)) {
      return null;
    }
    if (!principalUnitCode) {
      return null;
    }
    const fromU = normalizeUnitCode(quantiteUniteSaisie) || principalUnitCode;
    if (unitCodesEqual(fromU, principalUnitCode)) {
      return q;
    }
    return convertQuantityBetweenUnites(q, fromU, principalUnitCode, unitesMesure);
  }, [selectedCommandeForForm, form.quantite_recue, quantiteUniteSaisie, principalUnitCode, unitesMesure]);

  useEffect(() => {
    if (!selectedCommandeForForm || !unitesQuantiteCompat.length) {
      return;
    }
    const ok = unitesQuantiteCompat.some(
      (u) => unitCodesEqual(u.code, quantiteUniteSaisie)
    );
    if (!ok) {
      setQuantiteUniteSaisie(principalUnitCode);
    }
  }, [selectedCommandeForForm, principalUnitCode, unitesQuantiteCompat, quantiteUniteSaisie]);

  const handleSelectCommande = (c: CommandeOption) => {
    const emb = emballages.find((e) => String(e.id) === String(c.emballage_id));
    const principal = resolvePrincipalUnitCode(emb?.capacity_unit ?? null, unitesMesure);
    setQuantiteUniteSaisie(principal);
    setForm((prev) => ({
      ...prev,
      numero_commande: c.numero_commande,
      emballage_id: c.emballage_id ? String(c.emballage_id) : "",
      entrepot_id: c.entrepot_id ? String(c.entrepot_id) : "",
      quantite_recue: "",
    }));
    setErrorMessage("");
  };

  const stats = useMemo(() => {
    const totalCommande = commandes.reduce((acc, c) => acc + Number(c.quantite || 0), 0);
    const totalRecuValide = commandes.reduce((acc, c) => acc + Number(c.quantite_recue_total ?? 0), 0);
    const reliquatGlobal = commandesEnAttente.reduce(
      (acc, curr) => acc + Number(curr.reste ?? (Number(curr.quantite) - Number(curr.quantite_recue_total ?? 0))),
      0
    );
    const commandesOuvertes = commandes.filter((c) => Number(c.reste ?? 0) > 0).length;
    const couverture = totalCommande > 0 ? Math.round((totalRecuValide / totalCommande) * 100) : 0;

    return {
      totalCommande,
      totalRecuValide,
      reliquatGlobal,
      commandesOuvertes,
      couverture,
    };
  }, [commandes, commandesEnAttente]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((bl) => {
      const matchesStatus = statusFilter === "TOUS" ? true : bl.statut === statusFilter;
      const matchesQuery =
        q === "" ||
        String(bl.numero_bl || "").toLowerCase().includes(q) ||
        String(bl.numero_commande || "").toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [rows, query, statusFilter]);

  const blSortColumns = useMemo<Record<string, SortColumn<TableBonLivraison>>>(
    () => ({
      numero_bl: { accessor: (bl) => bl.numero_bl, type: "string" },
      commande: { accessor: (bl) => bl.numero_commande, type: "string" },
      quantite: { accessor: (bl) => bl.quantite_recue, type: "number" },
      statut: { accessor: (bl) => bl.statut, type: "string" },
    }),
    []
  );

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(blSortColumns);
  const sortedRows = useMemo(
    () => sortRows(filteredRows),
    [filteredRows, sortRows]
  );

  const getFriendlyErrorMessage = (err: any): string => {
    const raw = String(err?.message || "");
    const concise = raw.split("\nDetails:")[0].trim();

    if (raw.includes("Impossible d'annuler ce BL: la commande est déjà totalement réceptionnée.")) {
      return "Action refusée: cette commande est totalement réceptionnée, le statut du BL est verrouillé.";
    }
    if (raw.includes("Impossible de revalider un BL déjà annulé.")) {
      return "Action refusée: un bon de livraison annulé ne peut pas être revalidé.";
    }
    if (raw.includes("Unauthenticated")) {
      return "Session expirée. Merci de vous reconnecter.";
    }
    if (raw.includes("Validation")) {
      return concise || "Données invalides. Vérifiez les informations saisies.";
    }
    return concise || "Une erreur est survenue.";
  };

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PER_PAGE));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PER_PAGE;
    return sortedRows.slice(start, start + PER_PAGE);
  }, [sortedRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, statusFilter, sortKey, sortDirection]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);


  async function performEditUpdate(payload: {
    statut?: "VALIDE" | "ANNULE";
    quantite_recue: number;
    date_reception?: string;
    emballage_id?: string;
    numero_commande?: string;
    entrepot_id?: string;
  }) {
    if (!editing) return;
    const res = await updateBonLivraison(editing.id, payload);
    setRows((prev) =>
      prev.map((r) =>
        String(r.id) === String(editing.id) ? normalizeBonLivraison(res.updateBonLivraison) : r
      )
    );
    showSuccess("Bon de livraison modifié.");
    setIsDrawerOpen(false);
    setForm(emptyForm);
    setQuantiteUniteSaisie("");
    setFile(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing && !file) { setErrorMessage("Le document BL est obligatoire"); return; }
    const maxAllowed = selectedCommandeForForm ? remainingQuantity : Number.POSITIVE_INFINITY;
    const qPrincipal = quantiteEnPrincipal;
    if (!editing) {
      if (qPrincipal == null || !Number.isFinite(qPrincipal) || qPrincipal < 0) {
        setErrorMessage("Indiquez une quantité reçue valide et une unité compatible avec l'emballage.");
        return;
      }
      const dejaRecuForm = Number(selectedCommandeForForm?.quantite_recue_total ?? 0);
      const qteCmd = Number(selectedCommandeForForm?.quantite ?? 0);
      if (
        !isQuantiteRecueBLValide(qPrincipal, qteCmd, dejaRecuForm)
      ) {
        setErrorMessage(
          qPrincipal > maxAllowed
            ? `La quantité convertie (${formatQuantitePrincipale(qPrincipal)} ${principalUnitCode}) dépasse le reste à livrer (${formatQuantitePrincipale(maxAllowed)} ${principalUnitCode}).`
            : MESSAGE_QUANTITE_BL_TROP_ELEVEE
        );
        return;
      }
    }

    const qSave =
      quantiteEnPrincipal != null && Number.isFinite(quantiteEnPrincipal)
        ? quantiteEnPrincipal
        : Number(String(form.quantite_recue).replace(",", "."));
    const payload = { ...form, quantite_recue: qSave };

    const isCancelling =
      Boolean(editing) && form.statut === "ANNULE" && editing?.statut !== "ANNULE";

    if (isCancelling) {
      clearFeedback();
      const q = Number(editing?.quantite_recue ?? qSave);
      openConfirm({
        title: "Annuler ce bon de livraison ?",
        detail: editing?.numero_bl,
        description: `Cette annulation retirera ${formatQuantitePrincipale(q)} du stock de l'entrepôt ${entrepotNomPourAnnulation}.`,
        variant: "danger",
        confirmLabel: "Confirmer l'annulation",
        onConfirm: () =>
          void runConfirmedAction(async () => {
            setSubmitLoading(true);
            try {
              await performEditUpdate(payload);
            } catch (err: unknown) {
              setErrorMessage(getFriendlyErrorMessage(err));
              throw err;
            } finally {
              setSubmitLoading(false);
            }
          }, { closeOnSuccess: true }),
      });
      return;
    }

    setSubmitLoading(true);
    try {
      if (editing) {
        await performEditUpdate(payload);
      } else {
        const createPayload = {
          date_reception: payload.date_reception,
          emballage_id: payload.emballage_id,
          quantite_recue: payload.quantite_recue,
          numero_commande: payload.numero_commande,
          entrepot_id: payload.entrepot_id,
        };
        const created = await createBonLivraisonWithFile(createPayload as any, file!);
        setRows((prev) => [normalizeBonLivraison(created), ...prev]);
        showSuccess("Bon de livraison créé.");
        setIsDrawerOpen(false);
        setForm(emptyForm);
        setQuantiteUniteSaisie("");
        setFile(null);
      }
    } catch (err: unknown) {
      setErrorMessage(getFriendlyErrorMessage(err));
    } finally {
      setSubmitLoading(false);
    }
  }

  function openEdit(bl: TableBonLivraison) {
    setEditing(bl);
    const cmd = commandes.find((c) => c.numero_commande === bl.numero_commande);
    const emb = cmd
      ? emballages.find((e) => String(e.id) === String(cmd.emballage_id))
      : null;
    setQuantiteUniteSaisie(
      resolvePrincipalUnitCode(emb?.capacity_unit ?? null, unitesMesure)
    );
    setForm({
      date_reception: bl.date_reception?.split("T")[0] || "",
      emballage_id: String(bl.emballage_id),
      quantite_recue: String(bl.quantite_recue),
      numero_commande: bl.numero_commande,
      entrepot_id: String(bl.entrepot_id),
      statut: bl.statut || "VALIDE",
    });
    setIsDrawerOpen(true);
  }

  function getEmballageLabel(bl: TableBonLivraison) {
    const fromCmd = bl.commande?.emballage;
    if (fromCmd?.code || fromCmd?.name) {
      return `${fromCmd.code ?? ""} — ${fromCmd.name ?? ""}`.trim();
    }
    const emb = emballages.find((e) => String(e.id) === String(bl.emballage_id));
    return emb?.label ?? "";
  }

  function getEntrepotLabel(bl: TableBonLivraison) {
    return entrepots.find((e) => String(e.id) === String(bl.entrepot_id))?.label ?? "";
  }

  function getUnitCode(bl: TableBonLivraison) {
    const fromCmd = bl.commande?.emballage?.capacity_unit;
    if (fromCmd) {
      return resolvePrincipalUnitCode(fromCmd, unitesMesure);
    }
    return commandeUnitByNumero.get(bl.numero_commande) ?? "";
  }

  function handleDelete(id: Id) {
    const row = rows.find((r) => String(r.id) === String(id));
    clearFeedback();
    openConfirm({
      title: "Supprimer ce bon de livraison ?",
      detail: row?.numero_bl ?? `#${id}`,
      description: "Cette action est définitive.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await deleteBonLivraison(id);
          setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          showSuccess("Bon de livraison supprimé.");
        }),
    });
  }

  return (
    <div className="min-w-0 font-sans">
    <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
    <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
    {/* HEADER SECTION */}
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3 flex-wrap">
          Flux Réceptions
          {readOnly ? (
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Lecture seule
            </span>
          ) : null}
        </h1>
        <p className="text-sm text-gray-500 font-medium italic mt-1">
          {readOnly
            ? "Consultation des bons de livraison (lecture seule)"
            : "Gestion des bons de livraison et entrées en stock"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher BL ou commande..."
            className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 md:w-80 transition-all shadow-sm"
          />
        </div>
        {!readOnly ? (
          <button
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setQuantiteUniteSaisie("");
              setIsDrawerOpen(true);
            }}
            className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
          >
            NOUVEAU
          </button>
        ) : null}
      </div>
    </div>   

    {/* STATS CARDS */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {/* Widget 1: Total commandé */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <ShoppingCart className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Commandé</span>
          <span className="text-xl font-black text-gray-900">{formatNumber(stats.totalCommande)}</span>
        </div>
      </div>

      {/* Widget 2: Quantité validée */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <ArrowRight className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reçu Validé</span>
          <span className="text-xl font-black text-amber-600">{formatNumber(stats.totalRecuValide)}</span>
        </div>
      </div>

      {/* Widget 3: Reliquat */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Reste à Recevoir</span>
          <span className="text-xl font-black text-red-600">{formatNumber(stats.reliquatGlobal)}</span>
          <span className="block text-[10px] text-gray-400 font-bold uppercase">{stats.commandesOuvertes} commandes ouvertes</span>
        </div>
      </div>

      {/* Widget 4: Couverture réception */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Couverture Réception</span>
          <span className="text-xl font-black text-green-700">{stats.couverture}%</span>
        </div>
      </div>
    </div>
    <div className="flex gap-3 mb-8 overflow-x-auto pb-4 filter-bar-scroll items-center">
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Filtrer par :</div>
      {(["TOUS", "VALIDE", "ANNULE"] as const).map((status) => {
        const isActive = statusFilter === status;
        const count = status === "TOUS" ? rows.length : rows.filter((r) => r.statut === status).length;
        return (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`group flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all whitespace-nowrap border ${
              isActive
                ? "bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200 scale-105"
                : "bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {status}
            <span
              className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[9px] font-bold transition-colors ${
                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>

      {/* TABLEAU DESIGN */}
<div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
        <ResponsiveTableWrap>
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <SortableTh columnKey="numero_bl" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Référence BL</SortableTh>
              <SortableTh columnKey="commande" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400" align="center">Commande</SortableTh>
              <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400" align="center">Quantité Reçue</SortableTh>
              <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400" align="center">Justificatif</SortableTh>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedRows.map((bl) => (
              <tr key={bl.id} className="hover:bg-indigo-50/10 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block text-sm font-black text-gray-800">{bl.numero_bl || "En attente"}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter italic">{bl.date_reception?.split("T")[0]}</span>
                      <div className="mt-1 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                        <span>Créé par: {bl.created_by ? (userNamesById[String(bl.created_by)] || `#${bl.created_by}`) : "-"}</span>
                        <span className="mx-2">•</span>
                        <span>Modifié par: {bl.modified_by ? (userNamesById[String(bl.modified_by)] || `#${bl.modified_by}`) : "-"}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-100">
                    <ShoppingCart className="h-3 w-3" /> {bl.numero_commande}
                  </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="text-sm font-black text-gray-700">
                    {formatQuantitePrincipale(Number(bl.quantite_recue || 0))}
                  </span>
                  <span className="text-[10px] ml-1 font-black text-[#00A09D] uppercase">
                    {commandeUnitByNumero.get(bl.numero_commande) ?? ""}
                  </span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${
                      bl.statut === "VALIDE"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}>
                      {bl.statut}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  {bl.document_bl ? (
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        title="Visualiser le justificatif"
                        onClick={() => setDocumentViewerBl(bl)}
                        className="p-2.5 text-gray-400 transition-all rounded-xl hover:bg-white hover:text-indigo-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Télécharger le justificatif"
                        disabled={documentDownloadLoadingId === String(bl.id)}
                        onClick={() => handleDownloadDocument(bl)}
                        className="p-2.5 text-gray-400 transition-all rounded-xl hover:bg-white hover:text-amber-600 disabled:opacity-40"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="block text-center text-[10px] font-bold uppercase tracking-widest text-gray-300">
                      —
                    </span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      title="Voir le détail"
                      aria-label={`Voir le détail du BL ${bl.numero_bl || bl.id}`}
                      onClick={() => setDetailBl(bl)}
                      className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {!readOnly ? (
                      <button
                        type="button"
                        title="Modifier"
                        onClick={() => openEdit(bl)}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </ResponsiveTableWrap>
      </div>

{totalPages > 1 && (
  <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
    <LocalPagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  </div>
)}

      <BonLivraisonDocumentModal
        open={Boolean(documentViewerBl)}
        onClose={() => setDocumentViewerBl(null)}
        bonLivraisonId={documentViewerBl?.id ?? null}
        numeroBl={documentViewerBl?.numero_bl}
      />

      <BonLivraisonDetailDrawer
        bl={detailBl}
        open={Boolean(detailBl)}
        onClose={() => setDetailBl(null)}
        emballageLabel={detailBl ? getEmballageLabel(detailBl) : ""}
        entrepotLabel={detailBl ? getEntrepotLabel(detailBl) : ""}
        unitCode={detailBl ? getUnitCode(detailBl) : ""}
        userNamesById={userNamesById}
        documentDownloadLoading={
          detailBl != null && documentDownloadLoadingId === String(detailBl.id)
        }
        onViewDocument={
          detailBl?.document_bl
            ? () => setDocumentViewerBl(detailBl)
            : undefined
        }
        onDownloadDocument={
          detailBl?.document_bl ? () => handleDownloadDocument(detailBl) : undefined
        }
        onEdit={
          !readOnly && detailBl
            ? () => {
                const target = detailBl;
                setDetailBl(null);
                openEdit(target);
              }
            : undefined
        }
      />

      {/* DRAWER DESIGN */}
      {!readOnly && isDrawerOpen && (
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

            <form onSubmit={handleSubmit} className="form-scroll flex-1 space-y-6 px-10 py-6">
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-black flex items-center gap-3 rounded-2xl uppercase tracking-wider">
                  <AlertCircle className="h-4 w-4" /> {errorMessage}
                </div>
              )}

              {/* STEP 1: COMMANDE SELECTION */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Référence Commande</label>
                <CommandeSearchablePicker
                  value={form.numero_commande}
                  onSelect={handleSelectCommande}
                  commandes={commandesPourPicker}
                  disabled={isEditMode}
                  placeholder="Rechercher ou choisir une commande…"
                  listMaxHeightClassName="max-h-[min(10.5rem,34vh)] sm:max-h-40"
                  dropdownZClassName="z-[250]"
                />
              </div>

              {/* VISUELLE PAR COMMANDE (TIMELINE) */}
              {selectedCommandeForForm && (
                <CommandeTimeline
                  total={selectedCommandeForForm.quantite}
                  dejaRecu={dejaRecu}
                  actuel={
                    isEditMode
                      ? Number(form.quantite_recue) || 0
                      : quantiteEnPrincipal != null && Number.isFinite(quantiteEnPrincipal)
                        ? quantiteEnPrincipal
                        : 0
                  }
                  uniteCode={principalUnitCode}
                />
              )}

              {/* FORM FIELDS */}
              <div className={`space-y-6 transition-all duration-700 ${!selectedCommandeForForm ? "opacity-20 pointer-events-none" : ""}`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Emballage</label>
                    <select value={form.emballage_id} onChange={(e) => setForm({...form, emballage_id: e.target.value})} disabled={lockLogisticsFields} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                      <option value="">N/A</option>
                      {emballages.map(e => <option key={e.id} value={String(e.id)}>{e.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Destination</label>
                    <select value={form.entrepot_id} onChange={(e) => setForm({...form, entrepot_id: e.target.value})} disabled={lockLogisticsFields} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed">
                      <option value="">N/A</option>
                      {entrepots.map(e => <option key={e.id} value={String(e.id)}>{e.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Date d&apos;Arrivée</label>
                    <input type="date" value={form.date_reception} onChange={(e) => setForm({...form, date_reception: e.target.value})} readOnly={isEditMode} className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all read-only:opacity-70 read-only:cursor-not-allowed" required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">
                      Quantité reçue (max : {formatQuantitePrincipale(remainingQuantity)} {principalUnitCode})
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={form.quantite_recue}
                        onChange={(e) => setForm({ ...form, quantite_recue: e.target.value })}
                        readOnly={isEditMode}
                        className="w-full rounded-2xl border-2 border-gray-100 p-4 text-xs font-black outline-none focus:border-indigo-600 transition-all placeholder:text-gray-200 read-only:opacity-70 read-only:cursor-not-allowed font-mono"
                        placeholder="Ex. 10000"
                        required
                      />
                      {selectedCommandeForForm && unitesQuantiteCompat.length > 0 && !isEditMode ? (
                        <UniteMesureSearchablePicker
                          value={quantiteUniteSaisie}
                          onChange={(code) => setQuantiteUniteSaisie(code)}
                          unites={unitesQuantiteCompat}
                          placeholder="Unité de saisie…"
                          allowEmpty={false}
                          listMaxHeightClassName="max-h-[min(9rem,28vh)] sm:max-h-32"
                          dropdownZClassName="z-[250]"
                        />
                      ) : (
                        <div className="flex items-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-xs font-bold text-gray-400">
                          {isEditMode
                            ? `Unité : ${principalUnitLabel}`
                            : principalUnitLabel
                              ? `Réf. : ${principalUnitLabel}`
                              : "—"}
                        </div>
                      )}
                    </div>
                    {!isEditMode && selectedCommandeForForm ? (
                      <p className="text-[10px] font-bold text-gray-500">
                        Enregistrement en{" "}
                        <span className="font-black text-[#00A09D]">{principalUnitLabel}</span>
                        {quantiteEnPrincipal != null && Number.isFinite(quantiteEnPrincipal) ? (
                          <>
                            {" "}
                            →{" "}
                            <span className="font-mono font-black text-gray-900">
                              {formatQuantitePrincipale(quantiteEnPrincipal)} {principalUnitCode}
                            </span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1">Statut du BL</label>
                  <select
                    value={form.statut}
                    onChange={(e) => setForm({ ...form, statut: e.target.value as "VALIDE" | "ANNULE" })}
                    disabled={isCommandeFullyReceived || isCancelledBL}
                    className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 p-4 text-xs font-black outline-none focus:border-indigo-200 focus:bg-white transition-all appearance-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="VALIDE">VALIDE</option>
                    <option value="ANNULE">ANNULE</option>
                  </select>
                  {isCommandeFullyReceived && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Commande totalement réceptionnée: statut verrouillé.
                    </p>
                  )}
                  {isCancelledBL && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Ce BL est annulé: revalidation impossible.
                    </p>
                  )}
                  {isEditMode && form.statut === "ANNULE" && editing?.statut !== "ANNULE" && (
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                      Cette annulation retirera {formatQuantitePrincipale(Number(editing?.quantite_recue ?? 0))} du stock de l&apos;entrepôt {entrepotNomPourAnnulation}.
                    </p>
                  )}
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
                disabled={
                  submitLoading ||
                  !selectedCommandeForForm ||
                  (!editing &&
                    (quantiteEnPrincipal == null ||
                      !Number.isFinite(quantiteEnPrincipal) ||
                      quantiteEnPrincipal < 0))
                }
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