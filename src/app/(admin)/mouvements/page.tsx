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
import { Search, Filter } from "lucide-react";

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

  useEffect(() => { load(); }, []);

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
    <div className="p-4 mx-auto max-w-[1600px] lg:p-10 space-y-10">
      
      {/* Header & Stats (Design déjà harmonisé) */}
      <MouvementsHeader
        onCreate={() => {
          setForm(emptyForm());
          setDrawerOpen(true);
        }}
      />

      <MouvementsStats stats={stats} />

      {/* Barre de Recherche et Filtres Style "TailAdmin Premium" */}
      <div className="rounded-[30px] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Input avec icône */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A09D] transition-colors" size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un code, un lot, un entrepôt..."
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 pl-12 pr-4 py-4 text-sm font-medium outline-none transition-all focus:border-[#00A09D] focus:ring-4 focus:ring-[#00A09D]/5 focus:bg-white"
              />
            </div>

            {/* Sélecteurs stylisés */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:w-1/3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-4 text-sm font-bold text-[#1C2434] outline-none transition-all focus:border-[#00A09D] focus:bg-white appearance-none cursor-pointer"
              >
                <option value="ALL">Tous les types</option>
                <option value="PRD">📦 Production</option>
                <option value="CDD">🔄 Transfert</option>
                <option value="PTE">⚠️ Perte</option>
                <option value="SPL">➕ Surplus</option>
              </select>

              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="rounded-2xl border border-gray-100 bg-gray-50/50 px-4 py-4 text-sm font-bold text-[#1C2434] outline-none transition-all focus:border-[#00A09D] focus:bg-white appearance-none cursor-pointer"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">📝 Brouillon</option>
                <option value="VALIDE">✅ Validé</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <Filter size={14} />
              Filtres actifs
            </div>
            <div className="rounded-full bg-[#00A09D]/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#00A09D]">
              {filtered.length} Flux détectés
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border-l-4 border-red-500 bg-red-50 px-6 py-4 text-sm font-bold text-red-700 shadow-md animate-in fade-in slide-in-from-top-2">
          Attention : {error}
        </div>
      )}

      {/* Table des mouvements avec arrondis amples */}
      <div className="rounded-[35px] overflow-hidden border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
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