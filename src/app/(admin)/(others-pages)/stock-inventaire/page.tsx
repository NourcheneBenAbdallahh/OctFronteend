"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createInventaire,
  deleteInventaire,
  listInventaires,
  normalizeInventaire,
  updateInventaire,
} from "@/lib/inventaire.api";
import { TableInventaire, InventaireFilters } from "@/types/inventaire";
import InventaireHeader from "@/components/inventaire/InventaireHeader";
import InventaireStats from "@/components/inventaire/InventaireStats";
import InventaireFiltersBar from "@/components/inventaire/InventaireFilters";
import InventaireCriticalPanel from "@/components/inventaire/InventaireCriticalPanel";
import InventaireAuditCards from "@/components/inventaire/InventaireAuditCards";
import InventaireDetailDrawer from "@/components/inventaire/InventaireDetailDrawer";
import InventaireFormDrawer from "@/components/inventaire/InventaireFormDrawer";

import { listEmballages } from "@/lib/emballages.api"; 
import { fetchEntrepots } from "@/lib/entrepot.api";   
import { useAuthStore } from "@/store/useAuthStore";

export default function InventairePage() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<TableInventaire[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [allEntrepots, setAllEntrepots] = useState<{id: string, label: string}[]>([]);
  const [allEmballages, setAllEmballages] = useState<{id: string, label: string}[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableInventaire | null>(null);

  const [selected, setSelected] = useState<TableInventaire | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [filters, setFilters] = useState<InventaireFilters>({
    search: "",
    status: "all",
    entrepot: "",
  });

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
        listEmballages(1, 100, { token }) 
      ]);

      setData(resInventaires.map(normalizeInventaire));
      
      setAllEntrepots(resEntrepots.map(e => ({ id: String(e.id), label: e.nom })));
      setAllEmballages(resEmballages.emballages.data.map(e => ({ id: String(e.id), label: e.name })));
      
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const handleNewAudit = () => {
    setEditing(null); 
    setFormOpen(true);
  };

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.emballage_name.toLowerCase().includes(q) ||
          r.entrepot_name.toLowerCase().includes(q)
      );
    }
    if (filters.entrepot) {
      rows = rows.filter((r) => r.entrepot_id === filters.entrepot);
    }
    if (filters.status === "perfect") {
      rows = rows.filter((r) => r.ecart === 0);
    } else if (filters.status === "negative") {
      rows = rows.filter((r) => r.ecart < 0);
    } else if (filters.status === "positive") {
      rows = rows.filter((r) => r.ecart > 0);
    }
    return rows.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));
  }, [data, filters]);

  const criticalCount = data.filter((i) => Math.abs(i.ecart) > 0).length;


  const handleCreate = async (payload: any) => {
    try {
      await createInventaire(payload);
      setFormOpen(false);
      await load();
    } catch (err) {
      alert("Erreur lors de la création de l'inventaire.");
    }
  };

  const handleEdit = async (payload: any) => {
    if (!editing) return;
    try {
      const { entrepot_id, emballage_id, ...payloadPourUpdate } = payload;
      
      await updateInventaire(editing.id, payloadPourUpdate);
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (err) {
      console.error("Erreur update:", err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet inventaire ?")) return;
    try {
      await deleteInventaire(id);
      await load();
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      
      <InventaireHeader
        loading={loading}
        onRefresh={load}
        onNew={handleNewAudit}
        total={data.length}
        criticalCount={criticalCount}
      />

      <InventaireStats data={data} />

      <InventaireFiltersBar
        data={data}
        filters={filters}
        onChange={setFilters}
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
        onView={(item) => {
          setSelected(item);
          setDetailOpen(true);
        }}
        onEdit={(item) => {
          setEditing(item);
          setFormOpen(true);
        }}
        onDelete={handleDelete}
      />

      <InventaireDetailDrawer
        item={selected}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
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
      />
    </div>
  );
}