"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  cancelCommande,
  createCommande,
  dropCommande,
  fetchCommandeById,
  listCommandes,
  normalizeCommande,
  updateCommande,
} from "@/lib/commandes.api";
import {
  computeCommandeDashboardStats,
  computeCommandeStatusCounts,
  computeJoursRestants,
  filterCommandesByQuery,
  formatDelaiEcheanceLabel,
  isCommandeEnRetardTimeline,
} from "@/lib/commandes.helpers";
import {
  formatDateInputLocal,
  isDateLivraisonPrevueValide,
  MESSAGE_DATE_LIVRAISON_PASSEE,
} from "@/lib/commandes.validation";
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
import { EmballageSearchablePicker } from "@/components/emballages/EmballageSearchablePicker";
import { OptionSearchablePicker } from "@/components/ui/OptionSearchablePicker";
import { UniteMesureSearchablePicker } from "@/components/unites-mesure/UniteMesureSearchablePicker";
import {
  convertQuantityBetweenUnites,
  normalizeUnitCode,
  unitCodesEqual,
  resolvePrincipalUnitCode,
  formatQuantitePrincipale,
} from "@/lib/unite-conversion";
import type { UniteMesure } from "@/types/unite-mesure";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { ResponsiveTableWrap } from "@/components/ui/ResponsiveTableWrap";
import { SortableTh } from "@/components/ui/SortableTableHeader";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";
import { useTableSort } from "@/hooks/useTableSort";
import type { SortColumn } from "@/lib/tableSort";
import {
  X,
  Plus,
  Search,
  Edit2,
  Trash2,
  Ban,
  Package,
  Truck,
  Calendar,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Timer,
  History,
  CheckCircle2,
  ClipboardList,
  CalendarClock,
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
const OrderTimelineDetail = ({
  item,
  emballageLabel,
  emballageQuantiteUnite,
}: {
  item: TableCommande;
  emballageLabel?: string;
  emballageQuantiteUnite?: string;
}) => {
  const joursRestants = computeJoursRestants(item.date_livraison_prevue);

  // Utilisation de tes champs : quantite_recue_total et reste
  const qteTotale = Number(item.quantite || 0);
  const qteRecue = Number((item as any).quantite_recue_total || 0); 
  const resteARecevoir = Number((item as any).reste || 0);
  
  const ratio = qteTotale > 0 ? Math.min((qteRecue / qteTotale) * 100, 100) : 0;
  const estEnRetard = isCommandeEnRetardTimeline(joursRestants, item.statut);
  const labelEcheance = formatDelaiEcheanceLabel(joursRestants, item.statut);

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
                {labelEcheance}
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
                <div className="text-right">
                  <span className="text-gray-900">
                    {formatQuantitePrincipale(qteTotale)}
                    {emballageQuantiteUnite ? (
                      <span className="ml-1 font-black text-[#00A09D]">{emballageQuantiteUnite}</span>
                    ) : null}
                  </span>
                  {emballageLabel ? (
                    <div className="max-w-[14rem] truncate text-[9px] font-bold uppercase tracking-tight text-gray-400 mt-0.5">
                      {emballageLabel}
                    </div>
                  ) : null}
                </div>
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
  unitesMesure,
  entrepots,
  fournisseurs,
  contrats,
}: {
  data: TableCommande[];
  pagination: CommandesPaginatorInfo;
  emballages: EmballageOption[];
  unitesMesure: UniteMesure[];
  entrepots: EntrepotOption[];
  fournisseurs: FournisseurOption[];
  contrats: ContratForCommande[];
}) {
  const currentUser = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [rows, setRows] = useState<TableCommande[]>(data);
  /** Jeu élargi pour les cartes (toutes les commandes si possible). */
  const [statsRows, setStatsRows] = useState<TableCommande[]>(data);
  const [userNamesById, setUserNamesById] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<Id | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<TableCommande | null>(null);
  const [form, setForm] = useState<CommandeForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  /** Wizard : 1 = emballage + fournisseur + entrepôt, 2 = date + quantité + contrat, 3 = récapitulatif. */
  const [drawerStep, setDrawerStep] = useState<1 | 2 | 3>(1);
  const minDateLivraison = useMemo(() => formatDateInputLocal(new Date()), []);
  /** Unité dans laquelle l'utilisateur saisit la quantité (convertie vers l'unité emballage à l'enregistrement). */
  const [quantiteUniteSaisie, setQuantiteUniteSaisie] = useState("");
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

    const router = useRouter();
const searchParams = useSearchParams();
const pathname = usePathname();

const goToPage = (page: number) => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("page", String(page));
  router.push(`${pathname}?${params.toString()}`);
};

  const focusId = searchParams.get("focus");

  useEffect(() => {
    setRows(data);
  }, [data]);

  useEffect(() => {
    if (!token) {
      setStatsRows(rows);
      return;
    }

    const total = pagination.total ?? rows.length;
    if (total <= rows.length) {
      setStatsRows(rows);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const first = Math.min(total, 300);
        const res = await listCommandes(1, first, { token });
        if (!cancelled) {
          setStatsRows(res.commandes.data.map(normalizeCommande));
        }
      } catch {
        if (!cancelled) {
          setStatsRows(rows);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, pagination.total, rows]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!focusId) return;

    const scrollToFocusedRow = (id: Id) => {
      setExpandedId(id);
      const timer = window.setTimeout(() => {
        const el = document.getElementById(`commande-row-${id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 180);
      return timer;
    };

    const target = rows.find((r) => String(r.id) === String(focusId));
    if (target) {
      const timer = scrollToFocusedRow(target.id);
      return () => window.clearTimeout(timer);
    }

    if (!token) return;

    let cancelled = false;
    void fetchCommandeById(focusId, { token }).then((response) => {
      if (cancelled || !response.commande) return;
      const normalized = normalizeCommande(response.commande);
      setRows((prev) =>
        prev.some((row) => String(row.id) === String(normalized.id))
          ? prev
          : [normalized, ...prev]
      );
      scrollToFocusedRow(normalized.id);
    });

    return () => {
      cancelled = true;
    };
  }, [focusId, rows, token]);

  useEffect(() => {
    if (searchParams.get("nouveau") !== "1") return;

    const emballageId = searchParams.get("emballage_id");
    const quantite = searchParams.get("quantite");
    const entrepotId = searchParams.get("entrepot_id");
    const dateLivraison = searchParams.get("date_livraison");

    if (!emballageId && !quantite) return;

    const emb = emballageId
      ? emballages.find((e) => String(e.id) === String(emballageId))
      : null;
    const principal = emb
      ? resolvePrincipalUnitCode(emb.capacity_unit ?? null, unitesMesure)
      : "";

    setEditing(null);
    setForm({
      ...emptyForm,
      emballage_id: emballageId ?? "",
      quantite: quantite ?? "",
      entrepot_id: entrepotId ?? "",
      date_livraison_prevue: dateLivraison ?? "",
    });
    setQuantiteUniteSaisie(principal);
    setErrorMessage("");
    setDrawerStep(1);
    setIsDrawerOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("nouveau");
    params.delete("emballage_id");
    params.delete("quantite");
    params.delete("entrepot_id");
    params.delete("date_livraison");
    params.delete("couverture_jours");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, emballages, unitesMesure, pathname, router]);

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
  const emballagePrincipalUnitById = useMemo(() => {
    const m = new Map<string, string>();
    for (const x of emballages) {
      m.set(String(x.id), resolvePrincipalUnitCode(x.capacity_unit, unitesMesure));
    }
    return m;
  }, [emballages, unitesMesure]);
  const entrepotsMap = useMemo(() => new Map(entrepots.map((x) => [String(x.id), x.label])), [entrepots]);
  const fournisseursMap = useMemo(() => new Map(fournisseurs.map((x) => [String(x.id), x.label])), [fournisseurs]);

  const selectedEmballage = useMemo(
    () =>
      form.emballage_id
        ? emballages.find((e) => String(e.id) === String(form.emballage_id)) ?? null
        : null,
    [form.emballage_id, emballages]
  );

  const principalUnitCode = useMemo(
    () => resolvePrincipalUnitCode(selectedEmballage?.capacity_unit ?? null, unitesMesure),
    [selectedEmballage, unitesMesure]
  );

  const unitesSaisieOptions = useMemo(
    () =>
      [...unitesMesure].sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label, "fr")
      ),
    [unitesMesure]
  );

  const principalUnitLabel = useMemo(() => {
    const urow = unitesMesure.find((u) => unitCodesEqual(u.code, principalUnitCode));
    return urow ? `${urow.label} (${urow.code})` : principalUnitCode;
  }, [unitesMesure, principalUnitCode]);

  const quantiteEnPrincipal = useMemo(() => {
    const raw = String(form.quantite).trim();
    if (!form.emballage_id || raw === "") {
      return null;
    }
    const q = Number(raw.replace(",", "."));
    if (!Number.isFinite(q)) {
      return null;
    }
    const fromU = normalizeUnitCode(quantiteUniteSaisie) || principalUnitCode;
    if (unitCodesEqual(fromU, principalUnitCode)) {
      return q;
    }
    return convertQuantityBetweenUnites(q, fromU, principalUnitCode, unitesMesure);
  }, [form.emballage_id, form.quantite, quantiteUniteSaisie, principalUnitCode, unitesMesure]);

  useEffect(() => {
    if (!form.emballage_id || !unitesSaisieOptions.length) {
      return;
    }
    const ok = unitesSaisieOptions.some(
      (u) => unitCodesEqual(u.code, quantiteUniteSaisie)
    );
    if (!ok) {
      setQuantiteUniteSaisie(principalUnitCode);
    }
  }, [form.emballage_id, principalUnitCode, unitesSaisieOptions, quantiteUniteSaisie]);

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
    if (!activeContract) {
      return null;
    }
    const total = Number(activeContract.quantite_contractuelle || 0);
    const realise = Number(activeContract.quantite_realisee || 0);
    const saisie =
      quantiteEnPrincipal != null && Number.isFinite(quantiteEnPrincipal)
        ? quantiteEnPrincipal
        : Number.NaN;
    const restant = total - realise;
    const pourcentage = Math.min(((realise + saisie) / total) * 100, 100);

    const surplus = saisie - restant;

    return { total, realise, restant, pourcentage, depasse: saisie > restant, surplus };
  }, [activeContract, quantiteEnPrincipal]);


  // --- ACTIONS ---
  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setQuantiteUniteSaisie("");
    setErrorMessage("");
    setDrawerStep(1);
    setIsDrawerOpen(true);
  };
  const openEdit = (item: TableCommande) => {
    setEditing(item);
    const emb = emballages.find((e) => String(e.id) === String(item.emballage_id));
    const principal = resolvePrincipalUnitCode(emb?.capacity_unit ?? null, unitesMesure);
    setQuantiteUniteSaisie(principal);
    setForm({
      date_livraison_prevue: formatDate(item.date_livraison_prevue),
      emballage_id: String(item.emballage_id ?? ""),
      quantite: String(item.quantite ?? ""),
      fournisseur_id: String(item.fournisseur_id ?? ""),
      entrepot_id: String(item.entrepot_id ?? ""),
      statut: item.statut,
    });
    setDrawerStep(1);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (!submitLoading) {
      setIsDrawerOpen(false);
      setErrorMessage("");
      setDrawerStep(1);
    }
  };

  const goDrawerNext = () => {
    setErrorMessage("");
    if (drawerStep === 1) {
      if (!form.emballage_id.trim()) {
        setErrorMessage("Choisissez un type d'emballage.");
        return;
      }
      if (!form.fournisseur_id.trim()) {
        setErrorMessage("Choisissez un fournisseur autorisé.");
        return;
      }
      if (!form.entrepot_id.trim()) {
        setErrorMessage("Choisissez un entrepôt de destination.");
        return;
      }
      setDrawerStep(2);
      return;
    }
    if (drawerStep === 2) {
      if (!form.date_livraison_prevue.trim()) {
        setErrorMessage("Indiquez la date de livraison prévue.");
        return;
      }
      if (!isDateLivraisonPrevueValide(form.date_livraison_prevue)) {
        setErrorMessage(MESSAGE_DATE_LIVRAISON_PASSEE);
        return;
      }
      if (contractStats?.depasse) {
        setErrorMessage("Quantité supérieure au reste du contrat !");
        return;
      }
      if (
        quantiteEnPrincipal == null ||
        !Number.isFinite(quantiteEnPrincipal) ||
        quantiteEnPrincipal < 0
      ) {
        setErrorMessage(
          "Quantité ou unité invalide : impossible de convertir vers l'unité de l'emballage. Vérifiez la saisie."
        );
        return;
      }
      setDrawerStep(3);
    }
  };

  function handleCancel(id: Id) {
    const row = rows.find((r) => String(r.id) === String(id));
    clearFeedback();
    openConfirm({
      title: "Annuler cette commande ?",
      detail: row?.numero_commande ?? `#${id}`,
      description: "La commande passera au statut annulé.",
      variant: "warning",
      confirmLabel: "Annuler la commande",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          const res = await cancelCommande(id);
          const updated = normalizeCommande(res.cancelCommande);
          setRows((prev) => prev.map((r) => (String(r.id) === String(updated.id) ? updated : r)));
          showSuccess("Commande annulée.");
        }),
    });
  }

  function handleDrop(id: Id) {
    const row = rows.find((r) => String(r.id) === String(id));
    clearFeedback();
    openConfirm({
      title: "Supprimer cette commande ?",
      detail: row?.numero_commande ?? `#${id}`,
      description: "Cette action est définitive.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          await dropCommande(id);
          setRows((prev) => prev.filter((r) => String(r.id) !== String(id)));
          showSuccess("Commande supprimée.");
        }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (drawerStep !== 3) return;
    if (!form.emballage_id.trim()) {
      setErrorMessage("Choisissez un type d'emballage.");
      return;
    }
    if (!form.fournisseur_id.trim()) {
      setErrorMessage("Choisissez un fournisseur autorisé.");
      return;
    }
    if (!form.entrepot_id.trim()) {
      setErrorMessage("Choisissez un entrepôt de destination.");
      return;
    }
    if (!form.date_livraison_prevue.trim()) {
      setErrorMessage("Indiquez la date de livraison prévue.");
      return;
    }
    if (!isDateLivraisonPrevueValide(form.date_livraison_prevue)) {
      setErrorMessage(MESSAGE_DATE_LIVRAISON_PASSEE);
      return;
    }
    if (contractStats?.depasse) { setErrorMessage("Quantité supérieure au reste du contrat !"); return; }
    if (quantiteEnPrincipal == null || !Number.isFinite(quantiteEnPrincipal) || quantiteEnPrincipal < 0) {
      setErrorMessage(
        "Quantité ou unité invalide : impossible de convertir vers l'unité de l'emballage. Vérifiez la saisie."
      );
      return;
    }
    setSubmitLoading(true);
    try {
      const payloadBase = {
        date_livraison_prevue: form.date_livraison_prevue,
        emballage_id: form.emballage_id,
        quantite: quantiteEnPrincipal,
        fournisseur_id: form.fournisseur_id,
        entrepot_id: form.entrepot_id,
      };

      if (editing) {
        const updatePayload: UpdateCommandeInput = { ...payloadBase, statut: form.statut };
        const res = await updateCommande(editing.id, updatePayload);
        const updated = normalizeCommande(res.updateCommande);
        setRows((prev) => prev.map((r) => String(r.id) === String(updated.id) ? updated : r));
        showSuccess("Commande modifiée.");
      } else {
        const res = await createCommande(payloadBase as any);
        const created = normalizeCommande(res.createCommande);
        setRows((prev) => [created, ...prev]);
        showSuccess("Commande créée.");
      }
      closeDrawer();
    } catch (err: unknown) {
      setErrorMessage(getActionErrorMessage(err, "Erreur lors de l'enregistrement"));
    } finally { setSubmitLoading(false); }
  }

const statusCounts = useMemo(() => computeCommandeStatusCounts(rows), [rows]);

const dashboardStats = useMemo(
  () => computeCommandeDashboardStats(statsRows),
  [statsRows]
);

const filteredRows = useMemo(
  () => filterCommandesByQuery(rows, query, fournisseursMap),
  [rows, query, fournisseursMap]
);

const toggleQuickFilter = (filterKey: string) => {
  setQuery((prev) => (prev === filterKey ? "" : filterKey));
};

  const commandeSortColumns = useMemo<Record<string, SortColumn<TableCommande>>>(
    () => ({
      reference: { accessor: (c) => c.numero_commande, type: "string" },
      date: { accessor: (c) => c.date_commande, type: "date" },
      logistique: {
        accessor: (c) => fournisseursMap.get(String(c.fournisseur_id)),
        type: "string",
      },
      quantite: { accessor: (c) => c.quantite, type: "number" },
      statut: { accessor: (c) => c.statut, type: "string" },
    }),
    [fournisseursMap]
  );

  const { sortKey, sortDirection, toggleSort, sortRows } = useTableSort(commandeSortColumns);
  const sortedRows = useMemo(
    () => sortRows(filteredRows),
    [filteredRows, sortRows]
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8 font-sans">
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
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
             > Ajouter
          </button>
        </div>
      </div>

{/* INDICATEURS — cliquables pour filtrer le tableau */}
<div className="mb-2 flex flex-wrap items-center justify-between gap-2">
  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
    Vue d&apos;ensemble
    {statsRows.length < (pagination.total ?? statsRows.length)
      ? ` (${statsRows.length} / ${pagination.total} commandes)`
      : ` (${statsRows.length} commande${statsRows.length > 1 ? "s" : ""})`}
  </p>
  <p className="text-[10px] font-medium text-gray-400 italic">Cliquez sur une carte pour filtrer</p>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
  <button
    type="button"
    onClick={() => toggleQuickFilter("ACTIVES")}
    className={`bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md ${
      query === "ACTIVES"
        ? "border-indigo-300 ring-2 ring-indigo-500/20"
        : "border-gray-100"
    }`}
  >
    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
      <ClipboardList className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En cours</p>
      <p className="text-xl font-black text-gray-900">{dashboardStats.actives}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
        hors réceptionnées / annulées
      </p>
    </div>
  </button>

  <button
    type="button"
    onClick={() => toggleQuickFilter("EN_RETARD")}
    className={`bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md ${
      query === "EN_RETARD"
        ? "border-red-300 ring-2 ring-red-500/20"
        : "border-gray-100"
    }`}
  >
    <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
      <AlertCircle className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En retard</p>
      <p className="text-xl font-black text-red-600">{dashboardStats.enRetard}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">échéance dépassée</p>
    </div>
  </button>

  <button
    type="button"
    onClick={() => toggleQuickFilter("PROCHAINES_7J")}
    className={`bg-white p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 text-left transition-all hover:shadow-md ${
      query === "PROCHAINES_7J"
        ? "border-amber-300 ring-2 ring-amber-500/20"
        : "border-gray-100"
    }`}
  >
    <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
      <CalendarClock className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">À livrer (7 j)</p>
      <p className="text-xl font-black text-amber-600">{dashboardStats.livraisons7j}</p>
      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">livraisons imminentes</p>
    </div>
  </button>

  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
    <div className="h-12 w-12 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
      <CheckCircle2 className="h-6 w-6" />
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Couverture</p>
      <p className="text-xl font-black text-green-700">{dashboardStats.couverture}%</p>
      <p className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">
        reste {dashboardStats.reliquat.toLocaleString("fr-FR")} · {dashboardStats.commandesOuvertes} ouvertes
      </p>
    </div>
  </div>
</div>

{/* FILTRES RAPIDES AVEC BADGES */}
<div className="flex gap-3 mb-8 overflow-x-auto pb-4 filter-bar-scroll items-center">
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
        <ResponsiveTableWrap>
          <table className="w-full min-w-[1050px] text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <th className="px-8 py-6 w-10"></th>
                <SortableTh columnKey="reference" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-6">Référence</SortableTh>
                <SortableTh columnKey="logistique" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-6">Logistique</SortableTh>
                <SortableTh columnKey="quantite" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-6" align="center">Quantité</SortableTh>
                <th className="px-6 py-6">Créé par</th>
                <SortableTh columnKey="statut" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} className="px-6 py-6">Statut</SortableTh>
                <th className="px-6 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedRows.map((item) => (
                <React.Fragment key={item.id}>
                  <tr 
                    id={`commande-row-${item.id}`}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    className={`group cursor-pointer transition-all ${
                      String(focusId ?? "") === String(item.id)
                        ? "bg-indigo-50 ring-2 ring-indigo-300"
                        : expandedId === item.id
                        ? "bg-indigo-50/40"
                        : "hover:bg-gray-50/50"
                    }`}
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
                      <div className="inline-flex flex-col items-center gap-0.5">
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1 font-black text-sm text-gray-800">
                          <span>{formatQuantitePrincipale(Number(item.quantite || 0))}</span>
                          <span className="text-xs font-black text-[#00A09D]">
                            {emballagePrincipalUnitById.get(String(item.emballage_id)) ?? ""}
                          </span>
                        </div>
                        <div className="text-[10px] mt-0.5 text-gray-400 font-bold uppercase max-w-[10rem] truncate">
                          {emballagesMap.get(String(item.emballage_id))}
                        </div>
                      </div>
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
                            emballageQuantiteUnite={emballagePrincipalUnitById.get(String(item.emballage_id))}
                          />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </ResponsiveTableWrap>
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
                      {editing ? "Mise à jour" : "Nouvelle commande"}
                    </h2>
                    <div className="mt-2 h-1.5 w-12 rounded-full bg-indigo-600 shadow-lg shadow-indigo-100" />
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                      Étape {drawerStep} sur 3 —{" "}
                      {drawerStep === 1
                        ? "Emballage, fournisseur & entrepôt"
                        : drawerStep === 2
                          ? "Date, quantité & contrat"
                          : "Récapitulatif & validation"}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${drawerStep >= 1 ? "bg-indigo-600" : "bg-gray-100"}`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${drawerStep >= 2 ? "bg-indigo-600" : "bg-gray-100"}`}
                      />
                      <div
                        className={`h-1.5 flex-1 rounded-full transition-colors ${drawerStep >= 3 ? "bg-indigo-600" : "bg-gray-100"}`}
                      />
                    </div>
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

              <form
                className="flex min-h-0 flex-1 flex-col"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (drawerStep === 3) void handleSubmit(e);
                }}
              >
                <div className="form-scroll min-h-0 flex-1 px-8 py-5 sm:px-10 sm:py-6">
                  <div
                    className={
                      drawerStep === 1 ? "space-y-5" : drawerStep === 2 ? "space-y-6" : "space-y-5"
                    }
                  >
                    {errorMessage && (
                      <div className="flex items-center gap-3 rounded-3xl border-2 border-red-100 bg-red-50 p-5 text-[11px] font-black uppercase tracking-wider text-red-600 animate-shake">
                        <AlertCircle className="h-5 w-5 shrink-0" /> {errorMessage}
                      </div>
                    )}

                    {drawerStep === 1 ? (
                      <>
                        <div className="space-y-3">
                          <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            📦 Type d&apos;emballage
                          </label>
                          <EmballageSearchablePicker
                            value={form.emballage_id}
                            onChange={(id) => {
                              const emb = emballages.find((e) => String(e.id) === String(id));
                              const principal = resolvePrincipalUnitCode(
                                emb?.capacity_unit ?? null,
                                unitesMesure
                              );
                              setQuantiteUniteSaisie(principal);
                              setForm({ ...form, emballage_id: id, fournisseur_id: "" });
                            }}
                            emballages={emballages}
                            placeholder="Rechercher ou choisir un emballage…"
                          />
                        </div>

                        <div
                          className={`space-y-3 rounded-[1.75rem] border border-gray-100/90 bg-gradient-to-br from-white to-indigo-50/20 p-5 shadow-sm transition-all duration-500 ${
                            !form.emballage_id
                              ? "pointer-events-none scale-[0.98] opacity-40"
                              : "scale-100 opacity-100"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                              🤝 Fournisseur autorisé
                            </label>
                            {form.emballage_id && filteredFournisseurs.length > 0 ? (
                              <span className="text-[9px] font-bold uppercase tracking-tight text-indigo-500">
                                {filteredFournisseurs.length} choix
                              </span>
                            ) : null}
                          </div>
                          <OptionSearchablePicker
                            value={form.fournisseur_id}
                            onChange={(id) => setForm({ ...form, fournisseur_id: id })}
                            options={filteredFournisseurs}
                            disabled={!form.emballage_id}
                            placeholder={
                              form.emballage_id
                                ? "Rechercher ou choisir un fournisseur…"
                                : "Sélectionnez d'abord un emballage"
                            }
                            searchPlaceholder="Rechercher par nom ou n°…"
                            emptyOptionsText="Aucun fournisseur avec contrat actif pour cet emballage."
                            noResultsText="Aucun fournisseur ne correspond à la recherche."
                          />
                        </div>

                        <div className="space-y-3 rounded-[1.75rem] border border-gray-100/90 bg-gradient-to-br from-white to-slate-50/40 p-5 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                              🏠 Entrepôt de destination
                            </label>
                            {entrepots.length > 0 ? (
                              <span className="text-[9px] font-bold uppercase tracking-tight text-slate-500">
                                {entrepots.length} entrepôt{entrepots.length !== 1 ? "s" : ""}
                              </span>
                            ) : null}
                          </div>
                          <OptionSearchablePicker
                            value={form.entrepot_id}
                            onChange={(id) => setForm({ ...form, entrepot_id: id })}
                            options={entrepots}
                            placeholder="Rechercher ou choisir un entrepôt…"
                            searchPlaceholder="Rechercher un entrepôt…"
                            emptyOptionsText="Aucun entrepôt disponible."
                            noResultsText="Aucun entrepôt ne correspond à la recherche."
                            selectedOptionClassName="bg-slate-800/10 text-slate-900"
                          />
                        </div>
                      </>
                    ) : drawerStep === 2 ? (
                      <>
                        {activeContract && contractStats && (
                          <div
                            className={`space-y-4 rounded-[1.75rem] border-2 p-6 shadow-inner transition-all duration-500 ${
                              contractStats.depasse
                                ? "border-red-100 bg-red-50/50"
                                : "border-indigo-50 bg-indigo-50/40"
                            }`}
                          >
                            <div className="flex items-end justify-between gap-4">
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest ${
                                  contractStats.depasse ? "text-red-600" : "text-indigo-600"
                                }`}
                              >
                                Capacité du contrat
                              </span>
                              <span
                                className={`text-2xl font-black tabular-nums leading-none ${
                                  contractStats.depasse ? "text-red-600" : "text-indigo-900"
                                }`}
                              >
                                {contractStats.total > 0
                                  ? (
                                      ((contractStats.realise +
                                        (quantiteEnPrincipal != null &&
                                        Number.isFinite(quantiteEnPrincipal)
                                          ? quantiteEnPrincipal
                                          : 0)) /
                                        contractStats.total) *
                                      100
                                    ).toFixed(0)
                                  : "0"}
                                %
                              </span>
                            </div>

                            <div className="h-3 w-full overflow-hidden rounded-full border border-indigo-100/60 bg-white">
                              <div
                                className={`h-full transition-all duration-1000 ${contractStats.depasse ? "bg-red-500" : "bg-indigo-600"}`}
                                style={{
                                  width: `${Math.min(
                                    contractStats.total > 0
                                      ? ((contractStats.realise +
                                          (quantiteEnPrincipal != null &&
                                          Number.isFinite(quantiteEnPrincipal)
                                            ? quantiteEnPrincipal
                                            : 0)) /
                                          contractStats.total) *
                                        100
                                      : 0,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>

                            {contractStats.depasse ? (
                              <div className="flex gap-3 rounded-xl bg-red-100/40 p-3">
                                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                <p className="text-xs font-semibold leading-relaxed text-red-800">
                                  Vous dépassez la limite du contrat de{" "}
                                  <span className="font-black underline">
                                    {formatQuantitePrincipale(contractStats.surplus)} {principalUnitCode}
                                  </span>
                                  . Réduisez la quantité ci-dessous ou ajustez le contrat.
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-wrap justify-between gap-3 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                                <span>
                                  Reste disponible : {formatQuantitePrincipale(contractStats.restant)}{" "}
                                  {principalUnitCode}
                                </span>
                                <span>
                                  Plafond : {formatQuantitePrincipale(contractStats.total)} {principalUnitCode}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
                          <div className="space-y-3">
                            <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                              🗓️ Livraison prévue
                            </label>
                            <input
                              type="date"
                              value={form.date_livraison_prevue}
                              min={minDateLivraison}
                              onChange={(e) =>
                                setForm({ ...form, date_livraison_prevue: e.target.value })
                              }
                              className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/30 p-4 text-sm font-black shadow-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
                              required
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-3">
                              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                🔢 Quantité saisie
                              </label>
                              <input
                                type="text"
                                inputMode="decimal"
                                value={form.quantite}
                                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
                                className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50/30 p-4 font-mono text-sm font-black shadow-sm outline-none transition-all focus:border-indigo-500 focus:bg-white"
                                placeholder="Ex. 10000"
                                required
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="ml-1 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                ⚖️ Unité de saisie
                              </label>
                              {form.emballage_id && unitesSaisieOptions.length > 0 ? (
                                <UniteMesureSearchablePicker
                                  value={quantiteUniteSaisie}
                                  onChange={(code) => setQuantiteUniteSaisie(code)}
                                  unites={unitesSaisieOptions}
                                  placeholder={"Choisir l'unité…"}
                                  allowEmpty={false}
                                  dropdownZClassName="z-[1200]"
                                />
                              ) : (
                                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/80 p-4 text-sm font-semibold text-gray-500">
                                  {form.emballage_id
                                    ? `Unité de référence : ${principalUnitLabel}`
                                    : "Choisissez d'abord un emballage à l'étape 1."}
                                </div>
                              )}
                            </div>
                            {form.emballage_id ? (
                              <p className="rounded-xl bg-gray-50/80 px-3 py-2 text-xs font-medium leading-relaxed text-gray-600">
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
                      </>
                    ) : (
                      <>
                        <p className="text-center text-sm font-medium text-gray-600">
                          Vérifiez les informations puis validez la commande.
                        </p>
                        <div className="rounded-2xl border border-indigo-100/90 bg-indigo-50/50 p-5 text-sm shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
                            Récapitulatif
                          </p>
                          <p className="mt-3 font-semibold leading-snug text-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Emballage
                            </span>
                            <br />
                            <span className="mt-0.5 block text-sm font-bold">
                              {emballagesMap.get(String(form.emballage_id)) ?? "—"}
                            </span>
                          </p>
                          <p className="mt-4 font-semibold leading-snug text-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Fournisseur
                            </span>
                            <br />
                            <span className="mt-0.5 block text-sm font-bold">
                              {fournisseursMap.get(String(form.fournisseur_id)) ?? "—"}
                            </span>
                          </p>
                          <p className="mt-4 font-semibold leading-snug text-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Entrepôt
                            </span>
                            <br />
                            <span className="mt-0.5 block text-sm font-bold">
                              {entrepotsMap.get(String(form.entrepot_id)) ?? "—"}
                            </span>
                          </p>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-white/90 p-4 text-sm shadow-sm">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Livraison & quantité
                          </p>
                          <p className="mt-2 font-semibold leading-snug text-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Date prévue
                            </span>
                            <br />
                            <span className="mt-0.5 block text-sm font-bold">
                              {form.date_livraison_prevue
                                ? new Date(
                                    `${form.date_livraison_prevue}T12:00:00`
                                  ).toLocaleDateString("fr-FR", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })
                                : "—"}
                            </span>
                          </p>
                          <p className="mt-3 font-semibold leading-snug text-gray-900">
                            <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                              Quantité ({principalUnitLabel})
                            </span>
                            <br />
                            <span className="mt-0.5 block font-mono text-sm font-black text-gray-900">
                              {quantiteEnPrincipal != null && Number.isFinite(quantiteEnPrincipal)
                                ? `${formatQuantitePrincipale(quantiteEnPrincipal)} ${principalUnitCode}`
                                : "—"}
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="shrink-0 border-t border-gray-50 bg-white/95 px-6 py-5 backdrop-blur-md sm:px-10 sm:py-6">
                  {drawerStep === 1 ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="flex-1 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 transition-all hover:text-gray-900"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={goDrawerNext}
                        className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-gray-200 transition-all hover:bg-indigo-600"
                      >
                        Continuer
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ) : drawerStep === 2 ? (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerStep(1);
                          setErrorMessage("");
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 transition-all hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="flex-1 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 transition-all hover:text-gray-900"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={goDrawerNext}
                        className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gray-900 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-gray-200 transition-all hover:bg-indigo-600"
                      >
                        Continuer
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerStep(2);
                          setErrorMessage("");
                        }}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-gray-100 bg-gray-50 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 transition-all hover:bg-gray-100"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                        Retour
                      </button>
                      <button
                        type="button"
                        onClick={closeDrawer}
                        className="flex-1 rounded-2xl py-4 text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 transition-all hover:text-gray-900"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={
                          submitLoading ||
                          contractStats?.depasse ||
                          !form.emballage_id.trim() ||
                          !form.fournisseur_id.trim() ||
                          !form.entrepot_id.trim() ||
                          !form.date_livraison_prevue.trim() ||
                          quantiteEnPrincipal == null ||
                          !Number.isFinite(quantiteEnPrincipal) ||
                          quantiteEnPrincipal < 0
                        }
                        className="flex-[2] rounded-2xl bg-gray-900 py-4 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-gray-200 transition-all hover:bg-indigo-600 disabled:bg-gray-100 disabled:text-gray-300 sm:min-w-0"
                      >
                        {submitLoading ? "Envoi en cours…" : editing ? "Confirmer la modification" : "Lancer la commande"}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}