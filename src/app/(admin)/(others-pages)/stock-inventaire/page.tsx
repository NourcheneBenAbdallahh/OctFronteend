"use client";

import { useEffect, useMemo, useState } from "react";
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
import { TableInventaire, InventaireFilters } from "@/types/inventaire";
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
import InventaireDetailDrawer from "@/components/inventaire/InventaireDetailDrawer";
import InventaireFormDrawer from "@/components/inventaire/InventaireFormDrawer";
import InventaireContextBar from "@/components/inventaire/InventaireContextBar";
import InventaireGenererEntrepotModal from "@/components/inventaire/InventaireGenererEntrepotModal";
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
import { currentYear, todayIsoDay } from "@/lib/inventaire.dates";
import { useAuthStore } from "@/store/useAuthStore";

export default function InventairePage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<TableInventaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<string>("");

  const [allEntrepots, setAllEntrepots] = useState<{ id: string; label: string }[]>([]);
  const [allEmballages, setAllEmballages] = useState<{ id: string; label: string }[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableInventaire | null>(null);
  const [selected, setSelected] = useState<TableInventaire | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState<InventaireFilters>({
    ...EMPTY_INVENTAIRE_FILTERS,
    date_mode: "day",
    pivot_day: todayIsoDay(),
    pivot_year: currentYear(),
  });
  const [exporting, setExporting] = useState(false);
  const [feedback, setFeedback] = useState<InventaireFeedback>(null);
  const [deleteTarget, setDeleteTarget] = useState<TableInventaire | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [regularizeTarget, setRegularizeTarget] = useState<TableInventaire | null>(null);
  const [regularizeOpen, setRegularizeOpen] = useState(false);
  const [regularizing, setRegularizing] = useState(false);
  const [sessionRegularizeOpen, setSessionRegularizeOpen] = useState(false);
  const [sessionRegularizing, setSessionRegularizing] = useState(false);
  const [genererOpen, setGenererOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
  };

  const load = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const filtered = useMemo(
    () => applyInventaireFilters(data, filters),
    [data, filters]
  );

  const handleExportPdf = () => {
    if (!filtered.length) {
      showFeedback("error", "Aucune ligne à exporter avec ces filtres.");
      return;
    }
    setExporting(true);
    try {
      exportInventairePdf(filtered, filters);
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

  const sessionCodes = useMemo(() => {
    const base = filters.entrepot
      ? data.filter((d) => d.entrepot_id === filters.entrepot)
      : data;
    return Array.from(
      new Set(base.map((d) => d.code_session).filter(Boolean) as string[])
    );
  }, [data, filters.entrepot]);

  const openGenererModal = () => {
    if (!filters.entrepot) {
      showFeedback("error", "Choisissez d'abord un entrepôt dans le panneau ci-dessus.");
      return;
    }
    setGenererOpen(true);
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
      const lignes = await genererInventaireEntrepot({
        entrepotId: payload.entrepotId,
        dateInventaire: payload.dateInventaire,
        scope: payload.scope,
        periodeDebut: payload.periodeDebut,
        periodeFin: payload.periodeFin,
      });
      setGenererOpen(false);
      if (lignes.length > 0 && lignes[0].code_session) {
        const session = lignes[0].code_session!;
        setActiveSession(session);
        setFilters((f) => ({
          ...f,
          entrepot: payload.entrepotId,
          code_session: session,
          date_mode: payload.scope === "YEAR" ? "year" : "day",
          pivot_day: payload.scope === "DAY" ? payload.dateInventaire.slice(0, 10) : f.pivot_day,
          pivot_year:
            payload.scope === "YEAR"
              ? payload.dateInventaire.slice(0, 4)
              : f.pivot_year,
        }));
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

  const activeSessionCode = activeSession || filters.code_session;

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
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.statut === "REGULARISEE") {
      showFeedback(
        "error",
        "Impossible de supprimer une ligne déjà régularisée (mouvement stock déjà appliqué)."
      );
      setDeleteOpen(false);
      return;
    }

    setDeleting(true);
    try {
      await deleteInventaire(deleteTarget.id);
      setDeleteOpen(false);
      setDeleteTarget(null);
      if (selected?.id === deleteTarget.id) {
        setDetailOpen(false);
        setSelected(null);
      }
      await load();
      showFeedback("success", "Ligne d'inventaire supprimée.");
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
        item={deleteTarget}
        open={deleteOpen}
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteTarget(null);
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

      <InventaireGenererEntrepotModal
        open={genererOpen}
        entrepots={allEntrepots}
        initialEntrepotId={filters.entrepot}
        initialMode={filters.date_mode === "year" ? "year" : "day"}
        initialDay={filters.pivot_day}
        initialYear={filters.pivot_year}
        loading={generating}
        onClose={() => {
          if (generating) return;
          setGenererOpen(false);
        }}
        onConfirm={handleGenererConfirm}
      />

      <InventaireHeader
        loading={loading}
        onRefresh={load}
        onNew={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onGenererEntrepot={openGenererModal}
        onRegulariserSession={openRegulariserSessionConfirm}
        hasActiveSession={!!(activeSession || filters.code_session)}
        total={filtered.length}
        criticalCount={criticalCount}
      />

      <InventaireContextBar
        entrepots={allEntrepots}
        filters={filters}
        onChange={setFilters}
        scopedCount={filtered.length}
        totalCount={data.length}
        onGenerer={openGenererModal}
        loading={loading}
      />

      {sessionCodes.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sessions :</span>
          {sessionCodes.map((code) => (
            <button
              key={code}
              onClick={() => {
                setActiveSession(code);
                setFilters((f) => ({ ...f, code_session: f.code_session === code ? "" : code }));
              }}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                filters.code_session === code
                  ? "bg-[#1C2434] text-white border-[#1C2434]"
                  : "bg-white text-gray-500 border-gray-100"
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
          setSelected(item);
          setDetailOpen(true);
        }}
      />

      <InventaireAuditCards
        data={filtered}
        onAdjust={async (id, val) => {
          await updateInventaire(id, { stock_physique: val });
          await load();
        }}
        onRegulariser={openRegulariserConfirm}
        onView={(item) => {
          setSelected(item);
          setDetailOpen(true);
        }}
        onEdit={(item) => {
          setEditing(item);
          setFormOpen(true);
        }}
        onDelete={openDeleteConfirm}
      />

      <InventaireDetailDrawer
        item={selected}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
        onRegulariser={selected ? () => openRegulariserConfirm(selected) : undefined}
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
