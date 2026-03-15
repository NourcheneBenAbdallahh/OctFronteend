"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Button from "@/components/ui/button/Button";
import { toast } from "sonner";

import MouvementsModal from "@/components/mouvements/MouvementsModal";
import MouvementsTable from "@/components/mouvements/MouvementsTable";

import {
  createMouvementDraft,
  deleteMouvementDraft,
  fetchEntrepots,
  fetchLots,
  fetchMouvements,
  fetchEmballages,
  validateMouvement,
} from "@/lib/mouvement.api";

import type { MouvementStock, MouvementType } from "@/types/mouvement";
import type { Lot } from "@/types/mouvement";
import type { EmballageRef as Emballage } from "@/types/emballage";
import type { Entrepot } from "@/types/entrepot";

export default function MouvementsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<MouvementStock[]>([]);
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
const [lots, setLots] = useState<any[]>([]);
  const [emballages, setEmballages] = useState<Emballage[]>([]);

  const [page, setPage] = useState(1);
  const [first] = useState(10);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    type: "ENT" as MouvementType,
    emballageId: "",
    lotId: "",
    sourceId: "",
    destId: "",
    quantite: 0,
  });

  const load = useCallback(async () => {
  setLoading(true);
  setError(null);
  try {
    const [m, e, l, embs] = await Promise.all([
      fetchMouvements(page, first),
      fetchEntrepots(),
      fetchLots(),
      fetchEmballages(1, 200),
    ]);

    setItems(m.mouvementStocks.data);
    setLastPage(m.mouvementStocks.paginatorInfo.lastPage);
    setTotal(m.mouvementStocks.paginatorInfo.total);
    setEntrepots(e);
    setLots(l);

    setEmballages(embs);

  } catch (err: any) {
    setError(err?.message || "Erreur de chargement des données");
  } finally {
    setLoading(false);
  }
}, [page, first]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => 
      x.lot?.code_lot?.toLowerCase().includes(s) ||
      x.entrepotSource?.adresse?.toLowerCase().includes(s) ||
      x.entrepotDestination?.adresse?.toLowerCase().includes(s) ||
      x.code_mouvement?.toLowerCase().includes(s) ||
      x.statut.toLowerCase().includes(s)
    );
  }, [items, search]);

  // ----- Actions CRUD -----
  async function handleAction(promise: Promise<any>, successMsg: string) {
    setSaving(true);
    setError(null);
    try {
      await promise;
      await load();
      setIsOpen(false);
      toast.success(successMsg);
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue");
    } finally {
      setSaving(false);
    }
  }

  const onCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantite <= 0) return setError("La quantité doit être supérieure à 0");
    if (form.type === "CDD" && form.sourceId === form.destId) return setError("Source et destination identiques");

    handleAction(createMouvementDraft({
      type_mouvement: form.type,
      emballage_id: form.emballageId,
      lot_id: form.lotId || null,
      entrepot_source_id: form.sourceId || null,
      entrepot_destination_id: form.destId || null,
      quantite: form.quantite,
    }), "Brouillon créé avec succès");
  };

  return (
    <div className="space-y-6 p-4">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Flux de Stock</h1>
          <p className="text-sm text-gray-500">Gestion de la traçabilité des denrées alimentaires.</p>
        </div>
        <Button variant="primary" onClick={() => { setForm({ type: "ENT", emballageId: "", lotId: "", sourceId: "", destId: "", quantite: 0 }); setIsOpen(true); }}>
          + Nouveau mouvement
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un code, lot, entrepôt..."
          className="w-full sm:w-96 pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-800"
        />
        <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500">
          Total: {total}
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium animate-pulse">⚠️ {error}</div>}

      <MouvementsTable 
        items={filtered} 
        loading={loading} 
        onValidate={(id) => handleAction(validateMouvement(id), "Validé")} 
        onDelete={(id) => handleAction(deleteMouvementDraft(id), "Supprimé")} 
      />

      <div className="p-6 flex items-center justify-between text-xs font-bold text-gray-400">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
        <span>Page {page} sur {lastPage}</span>
        <Button variant="outline" size="sm" disabled={page >= lastPage} onClick={() => setPage(p => p + 1)}>Suivant</Button>
      </div>

      <MouvementsModal 
        isOpen={isOpen} 
        saving={saving}
        form={form} 
        setForm={setForm} 
        lots={lots} 
        emballages={emballages} 
        entrepots={entrepots} 
        onClose={() => setIsOpen(false)} 
        onSubmit={onCreateDraft} 
      />

    </div>
  );
}