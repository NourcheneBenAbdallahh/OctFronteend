"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createInventaire,
  deleteInventaire,
  genererInventaireEntrepot,
  listInventaires,
  normalizeInventaire,
  regulariserInventaire,
  regulariserInventaireSession,
  updateInventaire,
} from "@/lib/inventaire.api";
import { TableInventaire, InventaireFilters, InventaireCampaignContext } from "@/types/inventaire";
import {
  applyInventaireFilters,
  EMPTY_INVENTAIRE_FILTERS,
} from "@/lib/inventaire.filters";
import { exportInventaireCsv, exportInventairePdf } from "@/lib/inventaire.export";
import InventaireHeader from "@/components/inventaire/InventaireHeader";
import InventaireStats from "@/components/inventaire/InventaireStats";
import InventaireFiltersBar from "@/components/inventaire/InventaireFilters";
import InventaireCriticalPanel from "@/components/inventaire/InventaireCriticalPanel";
import InventaireAuditCards from "@/components/inventaire/InventaireAuditCards";
import InventaireFormDrawer from "@/components/inventaire/InventaireFormDrawer";
import InventaireContextBar from "@/components/inventaire/InventaireContextBar";
import {
  InventaireConfirmDeleteModal,
  InventaireConfirmRegulariserModal,
  InventaireConfirmRegulariserSessionModal,
  InventaireFeedbackBanner,
  type InventaireFeedback,
} from "@/components/inventaire/InventairePageAlerts";
import { getInventaireErrorMessage } from "@/lib/inventaire.errors";

import { listEmballages } from "@/lib/emballages.api";
import { fetchEntrepots } from "@/lib/entrepot.api";
import {
  currentYear,
  dayScopeBounds,
  normalizeIsoDay,
  todayIsoDay,
  yearScopeBounds,
} from "@/lib/inventaire.dates";
import { useAuthStore } from "@/store/useAuthStore";

export default function InventairePage() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<TableInventaire[]>([]);
  const [loading, setLoading] = useState(true);

  const [campaign, setCampaign] = useState<InventaireCampaignContext>({
    entrepot: "",
    date_mode: "day",
    pivot_day: todayIsoDay(),
    pivot_year: currentYear(),
  });

  const [allEntrepots, setAllEntrepots] = useState<{ id: string; label: string }[]>([]);
  const [allEmballages, setAllEmballages] = useState<{ id: string; label: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableInventaire | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [filters, setFilters] = useState<InventaireFilters>(EMPTY_INVENTAIRE_FILTERS);
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<InventaireFeedback>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteTargets, setDeleteTargets] = useState<TableInventaire[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regularizeTarget, setRegularizeTarget] = useState<TableInventaire | null>(null);
  const [regularizeOpen, setRegularizeOpen] = useState(false);
  const [regularizing, setRegularizing] = useState(false);
  const [sessionRegularizeOpen, setSessionRegularizeOpen] = useState(false);
  const [sessionRegularizing, setSessionRegularizing] = useState(false);
  const [generating, setGenerating] = useState(false);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
  };

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [resInventaires, resEntrepots, resEmballages] = await Promise.all([
        listInventaires({ token }),
        fetchEntrepots({ token }),
        listEmballages(1, 100, { token }),
      ]);

      setData(resInventaires.map(normalizeInventaire));
      setAllEntrepots(resEntrepots.map((e) => ({ id: String(e.id), label: e.nom })));
      setAllEmballages(resEmballages.emballages.data.map((e) => ({ id: String(e.id), label: e.name })));
    } catch (err) {
      console.error("Erreur chargement inventaire:", err);
      showFeedback(
        "error",
        getInventaireErrorMessage(err, "Impossible de charger les lignes d'inventaire.")
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => applyInventaireFilters(data, filters),
    [data, filters]
  );

  useEffect(() => {
    if (!focusId || loading || data.length === 0) return;

    const target = data.find((item) => String(item.id) === String(focusId));
    if (!target) return;

    const isVisible = filtered.some((item) => String(item.id) === String(focusId));
    if (!isVisible) {
      setFilters({
        ...EMPTY_INVENTAIRE_FILTERS,
        entrepot: target.entrepot_id,
      });
      return;
    }

    setExpandedId(String(target.id));

    const timer = window.setTimeout(() => {
      document
        .getElementById(`inventaire-row-${focusId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [focusId, loading, data, filtered]);

  const handleExportPdf = async () => {
    if (!filtered.length) {
      showFeedback("error", "Aucune ligne à exporter avec ces filtres.");
      return;
    }
    setExporting(true);
    try {
      await exportInventairePdf(filtered, filters);
    } catch (err) {
      console.error("Export PDF inventaire:", err);
      showFeedback("error", "Impossible de générer le PDF (logo ou export).");
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = () => {
    if (!filtered.length) {
      showFeedback("error", "Aucune ligne à exporter avec ces filtres.");
      return;
    }
    setExporting(true);
    try {
      exportInventaireCsv(filtered, filters);
    } finally {
      setExporting(false);
    }
  };

  const criticalCount = useMemo(
    () =>
      filtered.filter(
        (i) => i.statut !== "REGULARISEE" && Math.abs(i.ecart) >= 0.0001
      ).length,
    [filtered]
  );

  const deletableFiltered = useMemo(
    () => filtered.filter((i) => i.statut !== "REGULARISEE"),
    [filtered]
  );

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const every =
        deletableFiltered.length > 0 &&
        deletableFiltered.every((r) => next.has(r.id));
      if (every) {
        deletableFiltered.forEach((r) => next.delete(r.id));
      } else {
        deletableFiltered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const sessionCodes = useMemo(() => {
    const base = campaign.entrepot
      ? data.filter((d) => String(d.entrepot_id) === String(campaign.entrepot))
      : data;
    return Array.from(
      new Set(base.map((d) => d.code_session).filter(Boolean) as string[])
    );
  }, [data, campaign.entrepot]);

  const handleGenererCampagne = async () => {
    if (!campaign.entrepot) {
      showFeedback("error", "Choisissez d'abord un entrepôt dans le panneau ci-dessus.");
      return;
    }
    if (campaign.date_mode === "day" && !campaign.pivot_day?.trim()) {
      showFeedback(
        "error",
        "Choisissez une date d'inventaire avant de générer la campagne."
      );
      return;
    }
    const payload =
      campaign.date_mode === "year"
        ? (() => {
            const b = yearScopeBounds(campaign.pivot_year);
            return {
              entrepotId: campaign.entrepot,
              scope: "YEAR" as const,
              dateInventaire: b.dateInventaire,
              periodeDebut: b.periodeDebut,
              periodeFin: b.periodeFin,
            };
          })()
        : (() => {
            const b = dayScopeBounds(campaign.pivot_day);
            return {
              entrepotId: campaign.entrepot,
              scope: "DAY" as const,
              dateInventaire: b.dateInventaire,
            };
          })();

    await handleGenererConfirm(payload);
  };

  const handleGenererConfirm = async (payload: {
    entrepotId: string;
    scope: "DAY" | "YEAR";
    dateInventaire: string;
    periodeDebut?: string;
    periodeFin?: string;
  }) => {
    setGenerating(true);
    try {
      const lignes = await genererInventaireEntrepot(
        {
          entrepotId: payload.entrepotId,
          dateInventaire: payload.dateInventaire,
          scope: payload.scope,
          periodeDebut: payload.periodeDebut,
          periodeFin: payload.periodeFin,
        },
        { token }
      );
      const session = lignes[0]?.code_session ?? "";
      if (session) {
        setFilters((f) => ({ ...f, code_session: session }));
      }
      setCampaign((c) => ({
        ...c,
        entrepot: payload.entrepotId,
        date_mode: payload.scope === "YEAR" ? "year" : "day",
        pivot_day:
          payload.scope === "DAY" ? normalizeIsoDay(payload.dateInventaire) : c.pivot_day,
        pivot_year:
          payload.scope === "YEAR" ? payload.dateInventaire.slice(0, 4) : c.pivot_year,
      }));
      if (lignes.length > 0) {
        const normalized = lignes.map(normalizeInventaire);
        setData((prev) => {
          const ids = new Set(normalized.map((l) => l.id));
          return [...normalized, ...prev.filter((p) => !ids.has(p.id))];
        });
      }
      await load();
      showFeedback(
        "success",
        lignes.length > 0
          ? `${lignes.length} ligne(s) créée(s) — session ${lignes[0]?.code_session ?? ""}.`
          : "Aucune nouvelle ligne (déjà générées pour cette date ou cet entrepôt sans stock)."
      );
    } catch (err) {
      showFeedback(
        "error",
        getInventaireErrorMessage(err, "Erreur lors de la génération de l'inventaire.")
      );
    } finally {
      setGenerating(false);
    }
  };

  const activeSessionCode = filters.code_session;

  const sessionEligibleCount = useMemo(() => {
    if (!activeSessionCode) return 0;
    return data.filter(
      (d) =>
        d.code_session === activeSessionCode &&
        d.statut !== "REGULARISEE" &&
        !(d.statut === "BROUILLON" && d.stock_physique <= 0)
    ).length;
  }, [data, activeSessionCode]);

  const openRegulariserSessionConfirm = () => {
    setFeedback(null);
    setSessionRegularizeOpen(true);
  };

  const handleRegulariserSessionConfirm = async () => {
    const code = activeSessionCode;
    if (!code) {
      showFeedback("error", "Aucune session active. Générez d'abord un inventaire entrepôt.");
      setSessionRegularizeOpen(false);
      return;
    }

    setSessionRegularizing(true);
    try {
      const n = await regulariserInventaireSession(code);
      setSessionRegularizeOpen(false);
      await load();
      showFeedback(
        "success",
        n > 0
          ? `${n} ligne(s) régularisée(s) pour la session ${code}.`
          : `Aucune ligne à régulariser pour la session ${code}.`
      );
    } catch (err) {
      showFeedback(
        "error",
        getInventaireErrorMessage(err, "Erreur lors de la régularisation de la session.")
      );
    } finally {
      setSessionRegularizing(false);
    }
  };

  const openRegulariserConfirm = (item: TableInventaire) => {
    setFeedback(null);
    setRegularizeTarget(item);
    setRegularizeOpen(true);
  };

  const handleRegulariserConfirm = async () => {
    if (!regularizeTarget) return;

    setRegularizing(true);
    try {
      await regulariserInventaire(regularizeTarget.id);
      setRegularizeOpen(false);
      setRegularizeTarget(null);
      await load();
      showFeedback("success", "Stock régularisé : mouvement créé et ligne mise à jour.");
    } catch (err) {
      showFeedback(
        "error",
        getInventaireErrorMessage(err, "Erreur lors de la régularisation.")
      );
    } finally {
      setRegularizing(false);
    }
  };

  const handleCreate = async (payload: Parameters<typeof createInventaire>[0]) => {
    await createInventaire(payload);
    setFormOpen(false);
    await load();
    showFeedback("success", "Ligne d'inventaire créée.");
  };

  const handleEdit = async (payload: Parameters<typeof createInventaire>[0]) => {
    if (!editing) return;
    const { entrepot_id, emballage_id, ...rest } = payload;
    await updateInventaire(editing.id, rest);
    setFormOpen(false);
    setEditing(null);
    await load();
    showFeedback("success", "Ligne d'inventaire modifiée.");
  };

  const openDeleteConfirm = (item: TableInventaire) => {
    setFeedback(null);
    setDeleteTargets([item]);
    setDeleteOpen(true);
  };

  const openBulkDeleteConfirm = () => {
    const targets = deletableFiltered.filter((r) => selectedIds.has(r.id));
    if (!targets.length) {
      showFeedback("error", "Sélectionnez au moins une ligne à supprimer.");
      return;
    }
    setFeedback(null);
    setDeleteTargets(targets);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargets.length) return;

    const regularisees = deleteTargets.filter((t) => t.statut === "REGULARISEE");
    if (regularisees.length > 0) {
      showFeedback(
        "error",
        regularisees.length === 1
          ? "Impossible de supprimer une ligne déjà régularisée (mouvement stock déjà appliqué)."
          : `${regularisees.length} ligne(s) régularisée(s) ne peuvent pas être supprimées.`
      );
      setDeleteOpen(false);
      return;
    }

    setDeleting(true);
    try {
      const deletedIds = new Set(deleteTargets.map((t) => t.id));
      for (const target of deleteTargets) {
        await deleteInventaire(target.id);
      }
      setDeleteOpen(false);
      setDeleteTargets([]);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });
      if (expandedId && deletedIds.has(expandedId)) {
        setExpandedId(null);
      }
      await load();
      showFeedback(
        "success",
        deleteTargets.length > 1
          ? `${deleteTargets.length} ligne(s) d'inventaire supprimée(s).`
          : "Ligne d'inventaire supprimée."
      );
    } catch (err) {
      showFeedback(
        "error",
        getInventaireErrorMessage(err, "Erreur lors de la suppression.")
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <InventaireFeedbackBanner
        feedback={feedback}
        onDismiss={() => setFeedback(null)}
      />

      <InventaireConfirmDeleteModal
        items={deleteTargets}
        open={deleteOpen}
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTargets([]);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <InventaireConfirmRegulariserModal
        item={regularizeTarget}
        open={regularizeOpen}
        loading={regularizing}
        onClose={() => {
          if (regularizing) return;
          setRegularizeOpen(false);
          setRegularizeTarget(null);
        }}
        onConfirm={handleRegulariserConfirm}
      />

      <InventaireConfirmRegulariserSessionModal
        codeSession={activeSessionCode}
        eligibleCount={sessionEligibleCount}
        open={sessionRegularizeOpen}
        loading={sessionRegularizing}
        onClose={() => {
          if (sessionRegularizing) return;
          setSessionRegularizeOpen(false);
        }}
        onConfirm={handleRegulariserSessionConfirm}
      />

      <InventaireHeader
        loading={loading}
        onNew={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onRegulariserSession={openRegulariserSessionConfirm}
        hasActiveSession={!!filters.code_session}
        criticalCount={criticalCount}
      />

      <InventaireContextBar
        entrepots={allEntrepots}
        campaign={campaign}
        onChange={setCampaign}
        scopedCount={filtered.length}
        totalCount={data.length}
        onGenerer={handleGenererCampagne}
        loading={loading || generating}
      />

      {sessionCodes.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sessions :</span>
          <button
            type="button"
            onClick={() => setFilters((f) => ({ ...f, code_session: "" }))}
            className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
              !filters.code_session
                ? "bg-[#1C2434] text-white border-[#1C2434]"
                : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
            }`}
          >
            Toutes
          </button>
          {sessionCodes.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  code_session: f.code_session === code ? "" : code,
                }))
              }
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                filters.code_session === code
                  ? "bg-[#1C2434] text-white border-[#1C2434]"
                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      )}

      <InventaireStats data={filtered} />

      <InventaireFiltersBar
        data={data}
        entrepots={allEntrepots}
        filteredCount={filtered.length}
        filters={filters}
        onChange={setFilters}
        onExportPdf={handleExportPdf}
        onExportCsv={handleExportCsv}
        exporting={exporting}
      />

      <InventaireCriticalPanel
        data={filtered}
        onSelect={(item) => {
          setExpandedId(String(item.id));
          window.setTimeout(() => {
            document
              .getElementById(`inventaire-row-${item.id}`)
              ?.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 120);
        }}
      />

      <InventaireAuditCards
        data={filtered}
        focusedId={focusId}
        expandedId={expandedId}
        onToggleExpand={(id) => setExpandedId((prev) => (prev === id ? null : id))}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelectRow}
        onToggleSelectAll={toggleSelectAllFiltered}
        onBulkDelete={openBulkDeleteConfirm}
        onAdjust={async (id, val) => {
          await updateInventaire(id, { stock_physique: val });
          await load();
        }}
        onRegulariser={openRegulariserConfirm}
        onEdit={(item) => {
          setEditing(item);
          setFormOpen(true);
        }}
        onDelete={openDeleteConfirm}
      />

      <InventaireFormDrawer
        open={formOpen}
        item={editing}
        entrepots={allEntrepots}
        emballages={allEmballages}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleEdit : handleCreate}
        onValidationError={(message) => showFeedback("error", message)}
      />
    </div>
  );
}
