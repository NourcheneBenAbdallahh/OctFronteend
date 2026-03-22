"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLotsDisponibles } from "@/lib/mouvement.api";
import { MOUVEMENT_TYPES, needsDestination, needsLot, needsSource } from "@/lib/mouvement.config";
import {
  buildSummary,
  formatQuantity,
  getSelectedLotAvailable,
  validateForm,
  validateQuantityAgainstLot,
} from "@/lib/mouvement.helpers";
import {
  EmballageRef,
  EntrepotRef,
  LotDisponible,
  MouvementFormState,
  MouvementType,
} from "@/types/mouvement";
import { inputClass, Label, SectionCard, selectClass, TypeBadge } from "./mouvement-ui";

export default function MouvementDrawer({
  open,
  saving,
  form,
  setForm,
  emballages,
  entrepots,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  form: MouvementFormState;
  setForm: React.Dispatch<React.SetStateAction<MouvementFormState>>;
  emballages: EmballageRef[];
  entrepots: EntrepotRef[];
  onClose: () => void;
  onSubmit: () => void;
}) {
  const [lots, setLots] = useState<LotDisponible[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotsError, setLotsError] = useState<string | null>(null);

  const selectedLotAvailable = useMemo(
    () => getSelectedLotAvailable(lots, form.lotId),
    [lots, form.lotId]
  );

  useEffect(() => {
    if (!open) return;

    setLots([]);
    setLotsError(null);

    const typeNeedsSource = needsSource(form.type);

    if (!form.emballageId) {
      setForm((prev) => ({ ...prev, lotId: "" }));
      return;
    }

    if (typeNeedsSource && !form.sourceId) {
      setForm((prev) => ({ ...prev, lotId: "" }));
      return;
    }

    if (!typeNeedsSource) {
      return;
    }

    let mounted = true;
    setLotsLoading(true);

    fetchLotsDisponibles(form.sourceId, form.emballageId)
      .then((data) => {
        if (!mounted) return;
        setLots(data);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setLots([]);
        setLotsError(e?.message || "Erreur de chargement des lots.");
      })
      .finally(() => {
        if (!mounted) return;
        setLotsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open, form.type, form.sourceId, form.emballageId, setForm]);

  useEffect(() => {
    if (!open) return;

    setForm((prev) => {
      const next = { ...prev };

      if (!needsSource(prev.type)) next.sourceId = "";
      if (!needsDestination(prev.type)) next.destId = "";
      if (!needsLot(prev.type) && prev.type !== "SPL") next.lotId = "";
      if (prev.type === "SPL" && !prev.emballageId) next.lotId = "";

      return next;
    });
  }, [form.type, open, setForm]);

  const formError = useMemo(() => validateForm(form), [form]);
  const qtyError = useMemo(
    () => validateQuantityAgainstLot(form, selectedLotAvailable),
    [form, selectedLotAvailable]
  );

  const summary = useMemo(
    () => buildSummary(form, emballages, entrepots, lots),
    [form, emballages, entrepots, lots]
  );

  const availableDestinations = useMemo(() => {
    if (form.type !== "CDD" || !form.sourceId) return entrepots;
    return entrepots.filter((e) => e.id !== form.sourceId);
  }, [entrepots, form.type, form.sourceId]);

  const submitDisabled = !!formError || !!qtyError || saving;

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-gray-950/30 backdrop-blur-[2px]"
        onClick={saving ? undefined : onClose}
      />

      <aside className="fixed right-0 top-0 z-50 flex h-screen w-full max-w-[680px] flex-col border-l border-gray-200 bg-[#f7f8fc] shadow-2xl">
        <div className="border-b border-gray-200 bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">
                Création contrôlée
              </div>
              <h2 className="text-2xl font-black tracking-tight text-gray-950">
                Nouveau mouvement manuel
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Production, transfert, perte et surplus. Les lots sont filtrés selon
                l’emballage et l’entrepôt source.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <SectionCard
              title="Type de mouvement"
              subtitle="Choisissez le scénario métier à exécuter."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {(Object.keys(MOUVEMENT_TYPES) as MouvementType[]).map((type) => {
                  const meta = MOUVEMENT_TYPES[type];
                  const active = form.type === type;

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          type,
                          sourceId: "",
                          destId: "",
                          lotId: "",
                        }))
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? `${meta.cardClass} shadow-sm ring-2 ring-indigo-500/20`
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-2xl">{meta.icon}</div>
                        <TypeBadge type={type} />
                      </div>
                      <div className="mt-4 text-sm font-bold text-gray-950">{meta.label}</div>
                      <div className="mt-1 text-xs leading-5 text-gray-500">
                        {meta.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard
              title="Article"
              subtitle="Sélection d'emballage concerné par le mouvement."
            >
              <div>
                <Label>Emballage</Label>
                <select
                  value={form.emballageId}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      emballageId: e.target.value,
                      lotId: "",
                    }))
                  }
                  className={selectClass}
                >
                  <option value="">Sélectionner un emballage</option>
                  {emballages.map((emb) => (
                    <option key={emb.id} value={emb.id}>
                      {emb.code} · {emb.name}
                    </option>
                  ))}
                </select>
              </div>
            </SectionCard>

            <SectionCard
              title="Flux logistique"
              subtitle="La source et la destination dépendent du type de mouvement."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {needsSource(form.type) && (
                  <div>
                    <Label>Entrepôt source</Label>
                    <select
                      value={form.sourceId}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          sourceId: e.target.value,
                          lotId: "",
                        }))
                      }
                      className={selectClass}
                    >
                      <option value="">Sélectionner la source</option>
                      {entrepots.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.adresse}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {needsDestination(form.type) && (
                  <div>
                    <Label>Entrepôt destination</Label>
                    <select
                      value={form.destId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, destId: e.target.value }))
                      }
                      className={selectClass}
                    >
                      <option value="">Sélectionner la destination</option>
                      {availableDestinations.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.adresse}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </SectionCard>

            {(needsLot(form.type) || form.type === "SPL") && (
              <SectionCard
                title="Lot"
                subtitle={
                  form.type === "SPL"
                    ? "Vous pouvez rattacher le surplus à un lot existant ou laisser vide pour créer un nouveau lot."
                    : "Le lot disponible est filtré automatiquement selon l’entrepôt source et l’emballage."
                }
              >
                <div>
                  <Label>{form.type === "SPL" ? "Lot existant (optionnel)" : "Lot disponible"}</Label>

                  {needsSource(form.type) ? (
                    <select
                      value={form.lotId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, lotId: e.target.value }))
                      }
                      className={selectClass}
                      disabled={!form.emballageId || !form.sourceId || lotsLoading}
                    >
                      <option value="">
                        {lotsLoading
                          ? "Chargement des lots..."
                          : !form.emballageId
                          ? "Choisir d'abord un emballage"
                          : !form.sourceId
                          ? "Choisir d'abord un entrepôt source"
                          : "Sélectionner un lot"}
                      </option>
{lots.map((row) => (
  <option key={row.lot_id ?? "none"} value={row.lot_id ?? ""}>
    {row.code_lot} · disponible {formatQuantity(row.stock_disponible)}
  </option>
))}
                    </select>
                  ) : (
                    <input
                      value={form.lotId}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, lotId: e.target.value }))
                      }
                      className={inputClass}
                      placeholder="Laisser vide pour créer automatiquement un nouveau lot"
                    />
                  )}

                  {lotsError ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {lotsError}
                    </div>
                  ) : null}

                  {selectedLotAvailable != null ? (
                    <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                      Stock disponible sur le lot sélectionné :{" "}
                      <b>{formatQuantity(selectedLotAvailable)}</b>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            )}

            <SectionCard
              title="Quantité et date"
              subtitle="Informations quantitatives et horodatage du mouvement."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Quantité</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.quantite}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        quantite: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label>Date mouvement</Label>
                  <input
                    type="datetime-local"
                    value={form.dateMouvement}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, dateMouvement: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Résumé"
              subtitle="Vérification finale avant la création du brouillon."
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SummaryItem label="Type" value={summary.typeLabel} />
                <SummaryItem label="Emballage" value={summary.emballageLabel} />
                <SummaryItem label="Lot" value={summary.lotLabel} />
                <SummaryItem label="Quantité" value={summary.quantiteLabel} />
                <SummaryItem label="Source" value={summary.sourceLabel} />
                <SummaryItem label="Destination" value={summary.destLabel} />
              </div>

              {formError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              ) : null}

              {qtyError ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {qtyError}
                </div>
              ) : null}
            </SectionCard>
          </div>
        </div>

        <div className="border-t border-gray-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={submitDisabled}
              className="rounded-2xl bg-gray-950 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-950/10 transition hover:-translate-y-0.5 hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Création..." : "Créer le brouillon"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-900">{value}</div>
    </div>
  );
}