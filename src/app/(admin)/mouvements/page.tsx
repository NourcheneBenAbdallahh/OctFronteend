"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchMouvements,
  fetchMouvementById,
  fetchEmballages,
  fetchEntrepots,
  fetchGlobalStats,
  createMouvementDraft,
  validateMouvement,
  deleteMouvementDraft,
} from "@/lib/mouvement.api";
import { emptyForm, formatGraphQLDateTime, mouvementHasLot, validateForm } from "@/lib/mouvement.helpers";
import {
  MouvementStock,
  EmballageRef,
  EntrepotRef,
  MouvementFormState,
  MouvementsPageStats,
  PaginationInfo,
  MouvementFiltersState,
} from "@/types/mouvement";
import { EMPTY_MOUVEMENT_FILTERS } from "@/lib/mouvement.filters";
import { needsLot } from "@/lib/mouvement.config";

import MouvementsHeader from "@/components/mouvements/MouvementsHeader";
import MouvementsStats from "@/components/mouvements/MouvementsStats";
import MouvementsTable from "@/components/mouvements/MouvementsTable";
import MouvementDrawer from "@/components/mouvements/MouvementDrawer";
import MouvementsFilters from "@/components/mouvements/MouvementsFilters";
import { AppConfirmModal, AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

export default function MouvementsPage() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
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

  const [items, setItems] = useState<MouvementStock[]>([]);
  const [realStats, setRealStats] = useState<MouvementsPageStats | null>(null);
  const [emballages, setEmballages] = useState<EmballageRef[]>([]);
  const [entrepots, setEntrepots] = useState<EntrepotRef[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [filters, setFilters] = useState<MouvementFiltersState>(EMPTY_MOUVEMENT_FILTERS);
  const [page, setPage] = useState(1);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const [form, setForm] = useState<MouvementFormState>(emptyForm());
  const [focusedMouvement, setFocusedMouvement] = useState<MouvementStock | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    clearFeedback();

    try {
      const [mouvementsResult, embs, ents, statsData] = await Promise.all([
        fetchMouvements({
          search: filters.search,
          type: filters.type,
          statut: filters.statut,
          sort: filters.sort,
          page,
          first: 10,
        }),
        fetchEmballages(),
        fetchEntrepots(),
        fetchGlobalStats(),
      ]);
      setItems(mouvementsResult.data);
      setPagination(mouvementsResult.paginatorInfo);
      setEmballages(embs);
      setEntrepots(ents);
      setRealStats(statsData);
    } catch (e: any) {
      showError(getActionErrorMessage(e, "Erreur de chargement."));
    } finally {
      setLoading(false);
    }
  }, [filters, page, clearFeedback, showError]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [load]);

  useEffect(() => {
    if (!focusId) {
      setFocusedMouvement(null);
      return;
    }

    let cancelled = false;
    void fetchMouvementById(focusId)
      .then((mouvement) => {
        if (!cancelled) setFocusedMouvement(mouvement);
      })
      .catch(() => {
        if (!cancelled) setFocusedMouvement(null);
      });

    return () => {
      cancelled = true;
    };
  }, [focusId]);

  const displayItems = useMemo(() => {
    if (!focusId || !focusedMouvement) return items;
    if (items.some((item) => String(item.id) === String(focusId))) return items;
    return [focusedMouvement, ...items];
  }, [items, focusId, focusedMouvement]);

  useEffect(() => {
    if (!focusId || loading) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`mouvement-row-${focusId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [focusId, loading, displayItems]);

  const handleFiltersChange = (next: MouvementFiltersState) => {
    setFilters(next);
    setPage(1);
  };

  async function handleCreateDraft() {
    const validationMsg = validateForm(form);
    if (validationMsg) {
      showError(validationMsg);
      return;
    }

    setSaving(true);
    clearFeedback();
    try {
      await createMouvementDraft({
        type_mouvement: form.type,
        emballage_id: form.emballageId,
        lot_id: form.lotId || null,
        entrepot_source_id: form.sourceId || null,
        entrepot_destination_id: form.destId || null,
        quantite: Number(form.quantite),
        date_mouvement: form.dateMouvement ? formatGraphQLDateTime(form.dateMouvement) : null,
        motif: form.type === "PTE" ? form.motif.trim() : null,
      });
      setDrawerOpen(false);
      setForm(emptyForm());
      await load();
      showSuccess("Mouvement créé en brouillon.");
    } catch (e: unknown) {
      showError(getActionErrorMessage(e, "Erreur lors de la création."));
    } finally {
      setSaving(false);
    }
  }

  function handleValidate(item: MouvementStock) {
    if (item.type_mouvement === "PTE" && !item.motif?.trim()) {
      showError(
        "Ce brouillon de perte n'a pas de motif. Supprimez-le et recréez-le en indiquant la cause de la perte."
      );
      return;
    }

    if (needsLot(item.type_mouvement) && !mouvementHasLot(item)) {
      showError(
        "Ce brouillon n'a pas de lot associé. Supprimez-le et recréez-le en sélectionnant un lot disponible."
      );
      return;
    }

    if (
      item.type_mouvement === "CDD" &&
      item.entrepot_source_id &&
      item.entrepot_destination_id &&
      item.entrepot_source_id === item.entrepot_destination_id
    ) {
      showError("La source et la destination doivent être différentes pour un transfert.");
      return;
    }

    clearFeedback();
    queueMicrotask(() => {
      openConfirm({
        title: "Valider ce mouvement ?",
        detail: item.code_mouvement ?? `#${item.id}`,
        description: "Le mouvement sera appliqué au stock.",
        variant: "primary",
        confirmLabel: "Valider",
        onConfirm: () =>
          void runConfirmedAction(async () => {
            setBusyActionId(item.id);
            try {
              await validateMouvement(item.id);
              await load();
              showSuccess("Mouvement validé.");
            } finally {
              setBusyActionId(null);
            }
          }, { closeOnSuccess: true }),
      });
    });
  }

  function handleDelete(id: string) {
    clearFeedback();
    openConfirm({
      title: "Supprimer ce brouillon ?",
      detail: `Mouvement #${id}`,
      description: "Cette action est définitive.",
      variant: "danger",
      onConfirm: () =>
        void runConfirmedAction(async () => {
          setBusyActionId(id);
          try {
            await deleteMouvementDraft(id);
            await load();
            showSuccess("Mouvement supprimé.");
          } finally {
            setBusyActionId(null);
          }
        }, { closeOnSuccess: true }),
    });
  }

  return (
    <div className="p-4 mx-auto max-w-[1600px] lg:p-10 space-y-8">
      <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      <AppConfirmModal confirm={confirm} onClose={closeConfirm} />
      <MouvementsHeader
        onCreate={() => {
          setForm(emptyForm());
          setDrawerOpen(true);
        }}
      />

      {realStats && <MouvementsStats stats={realStats} />}

      <MouvementsFilters filters={filters} onChange={handleFiltersChange} />

      <div className="rounded-[35px] overflow-hidden border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
       <MouvementsTable
          items={displayItems}
          loading={loading}
          onValidate={handleValidate}
          onDelete={handleDelete}
          busyActionId={busyActionId}
          focusedId={focusId}
          currentPage={pagination?.currentPage ?? 1}
          totalPages={pagination?.lastPage ?? 1}
          totalItems={pagination?.total ?? 0}
          onPageChange={setPage}
        />
      </div>

      <MouvementDrawer
        open={drawerOpen}
        saving={saving}
        form={form}
        setForm={setForm}
        emballages={emballages}
        entrepots={entrepots}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleCreateDraft}
      />
    </div>
  );
}