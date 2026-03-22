"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createMouvementDraft,
  deleteMouvementDraft,
  fetchEmballages,
  fetchEntrepots,
  fetchMouvements,
  validateMouvement,
} from "@/lib/mouvement.api";
import {
  computeStats,
  emptyForm,
  filterMouvements,
  formatGraphQLDateTime,
} from "@/lib/mouvement.helpers";
import {
  EmballageRef,
  EntrepotRef,
  MouvementFormState,
  MouvementStock,
} from "@/types/mouvement";
import MouvementsHeader from "@/components/mouvements/MouvementsHeader";
import MouvementsStats from "@/components/mouvements/MouvementsStats";
import MouvementsTable from "@/components/mouvements/MouvementsTable";
import MouvementDrawer from "@/components/mouvements/MouvementDrawer";

export default function MouvementsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<MouvementStock[]>([]);
  const [emballages, setEmballages] = useState<EmballageRef[]>([]);
  const [entrepots, setEntrepots] = useState<EntrepotRef[]>([]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statutFilter, setStatutFilter] = useState("ALL");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<MouvementFormState>(emptyForm());

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const [mouvements, emballagesData, entrepotsData] = await Promise.all([
        fetchMouvements(),
        fetchEmballages(),
        fetchEntrepots(),
      ]);

      setItems(mouvements);
      setEmballages(emballagesData);
      setEntrepots(entrepotsData);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => filterMouvements(items, search, typeFilter, statutFilter),
    [items, search, typeFilter, statutFilter]
  );

  const stats = useMemo(() => computeStats(items), [items]);

  async function handleCreateDraft() {
    setSaving(true);
    setError(null);

    try {
      await createMouvementDraft({
        type_mouvement: form.type,
        emballage_id: form.emballageId,
        lot_id: form.lotId || null,
        entrepot_source_id: form.sourceId || null,
        entrepot_destination_id: form.destId || null,
        quantite: Number(form.quantite),
        date_mouvement: form.dateMouvement
          ? formatGraphQLDateTime(form.dateMouvement)
          : null,
      });

      setDrawerOpen(false);
      setForm(emptyForm());
      await load();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  async function handleValidate(id: string) {
    try {
      setError(null);
      await validateMouvement(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la validation.");
    }
  }

  async function handleDelete(id: string) {
    try {
      setError(null);
      await deleteMouvementDraft(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression.");
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <MouvementsHeader
          onCreate={() => {
            setForm(emptyForm());
            setDrawerOpen(true);
          }}
        />

        <MouvementsStats stats={stats} />

        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un code, un lot, un entrepôt..."
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="ALL">Tous les types</option>
                <option value="PRD">Production</option>
                <option value="CDD">Transfert</option>
                <option value="PTE">Perte</option>
                <option value="SPL">Surplus</option>
              </select>

              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="VALIDE">Validé</option>
              </select>
            </div>

            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-600">
              {filtered.length} mouvement(s) affiché(s)
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <MouvementsTable
          items={filtered}
          loading={loading}
          onValidate={handleValidate}
          onDelete={handleDelete}
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