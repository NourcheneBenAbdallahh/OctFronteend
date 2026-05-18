"use client";

import { useEffect, useState, useCallback } from "react";
import {
  fetchMouvements,
  fetchEmballages,
  fetchEntrepots,
  fetchGlobalStats,
  createMouvementDraft,
  validateMouvement,
  deleteMouvementDraft,
} from "@/lib/mouvement.api";
import { emptyForm, formatGraphQLDateTime, validateForm } from "@/lib/mouvement.helpers";
import {
  MouvementStock,
  EmballageRef,
  EntrepotRef,
  MouvementFormState,
  MouvementsPageStats,
  PaginationInfo,
} from "@/types/mouvement";
import { Search, Filter, X, ChevronDown } from "lucide-react";

import MouvementsHeader from "@/components/mouvements/MouvementsHeader";
import MouvementsStats from "@/components/mouvements/MouvementsStats";
import MouvementsTable from "@/components/mouvements/MouvementsTable";
import MouvementDrawer from "@/components/mouvements/MouvementDrawer";

export default function MouvementsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<MouvementStock[]>([]);
  const [realStats, setRealStats] = useState<MouvementsPageStats | null>(null);
  const [emballages, setEmballages] = useState<EmballageRef[]>([]);
  const [entrepots, setEntrepots] = useState<EntrepotRef[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statutFilter, setStatutFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const [form, setForm] = useState<MouvementFormState>(emptyForm());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [mouvementsResult, embs, ents, statsData] = await Promise.all([
        fetchMouvements({
          search,
          type: typeFilter,
          statut: statutFilter,
         
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
      setError(e?.message || "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, statutFilter, dateFrom, dateTo, page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      load();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [load]);

  // reset page quand filtre change
  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statutFilter, dateFrom, dateTo]);

  async function handleCreateDraft() {
    const validationMsg = validateForm(form);
    if (validationMsg) {
      setError(validationMsg);
      return;
    }

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
        date_mouvement: form.dateMouvement ? formatGraphQLDateTime(form.dateMouvement) : null,
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
    setBusyActionId(id);
    try {
      setError(null);
      await validateMouvement(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la validation.");
    } finally {
      setBusyActionId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyActionId(id);
    try {
      setError(null);
      await deleteMouvementDraft(id);
      await load();
    } catch (e: any) {
      setError(e?.message || "Erreur lors de la suppression.");
    } finally {
      setBusyActionId(null);
    }
  }

  return (
    <div className="p-4 mx-auto max-w-[1600px] lg:p-10 space-y-8">
      <MouvementsHeader
        onCreate={() => {
          setForm(emptyForm());
          setDrawerOpen(true);
        }}
      />

      {realStats && <MouvementsStats stats={realStats} />}

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#00A09D] transition-colors" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher sur toute la base (Code, Lot, Emballage, Entrepôt...)"
              className="w-full rounded-[22px] border-2 border-transparent bg-white px-14 py-4 shadow-sm outline-none transition-all focus:border-[#00A09D]/20 focus:ring-4 focus:ring-[#00A09D]/5"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-[22px] px-6 font-bold transition-all ${
              showFilters ? "bg-[#1C2434] text-white" : "bg-white text-[#1C2434] border border-gray-100 shadow-sm"
            }`}
          >
            {showFilters ? <X size={18} /> : <Filter size={18} />}
            <span>Filtres</span>
            <ChevronDown size={16} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">
                Type de Flux
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-[#1C2434] outline-none"
              >
                <option value="ALL">Tous les types</option>
                <option value="PRD">📦 Production</option>
                <option value="CDD">🔄 Transfert</option>
                <option value="PTE">⚠️ Perte</option>
                <option value="SPL">➕ Surplus</option>
                <option value="EMC">🏷️ EMC</option>
              </select>
            </div>

            <div className="bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">
                Statut
              </label>
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-[#1C2434] outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="BROUILLON">📝 Brouillon</option>
                <option value="VALIDE">✅ Validé</option>
              </select>
            </div>

            <div className="bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">
                Date début
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-[#1C2434] outline-none"
              />
            </div>

            <div className="bg-white p-4 rounded-[22px] border border-gray-100 shadow-sm">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">
                Date fin
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-[#1C2434] outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl font-bold border-l-4 border-red-500">
          Attention : {error}
        </div>
      )}

      <div className="rounded-[35px] overflow-hidden border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
       <MouvementsTable
          items={items}
          loading={loading}
          onValidate={handleValidate}
          onDelete={handleDelete}
          busyActionId={busyActionId}
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