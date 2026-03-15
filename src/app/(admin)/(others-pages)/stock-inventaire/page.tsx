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

export default function InventairePage() {
  const [data, setData] = useState<TableInventaire[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<InventaireFilters>({
    search: "",
    status: "all",
    entrepot: "",
  });

  const [selected, setSelected] = useState<TableInventaire | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TableInventaire | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listInventaires();
      setData(res.map(normalizeInventaire));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const handleQuickAdjust = async (id: string, newVal: number) => {
    await updateInventaire(id, { stock_physique: newVal });
    await load();
  };

  const handleCreate = async (payload: any) => {
    await createInventaire(payload);
    await load();
  };

  const handleEdit = async (payload: any) => {
    if (!editing) return;
    await updateInventaire(editing.id, payload);
    await load();
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm("Supprimer cet inventaire ?");
    if (!ok) return;
    await deleteInventaire(id);
    await load();
  };

  const entrepots = Array.from(
    new Map(data.map((i) => [i.entrepot_id, i.entrepot_name])).entries()
  ).map(([id, label]) => ({ id, label }));

  const emballages = Array.from(
    new Map(data.map((i) => [i.emballage_id, i.emballage_name])).entries()
  ).map(([id, label]) => ({ id, label }));

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <InventaireHeader
          loading={loading}
          onRefresh={load}
          total={data.length}
          criticalCount={criticalCount}
        />

        <InventaireStats data={data} />

        <InventaireFiltersBar
          data={data}
          filters={filters}
          onChange={setFilters}
        />

        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="px-4 py-2 rounded-sm bg-[#00A09D] text-white font-medium"
          >
            + Nouvel inventaire
          </button>
        </div>

        <InventaireCriticalPanel
          data={filtered}
          onSelect={(item) => {
            setSelected(item);
            setDetailOpen(true);
          }}
        />

        <InventaireAuditCards
          data={filtered}
          onAdjust={handleQuickAdjust}
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
          entrepots={entrepots}
          emballages={emballages}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSubmit={editing ? handleEdit : handleCreate}
        />
      </div>
    </div>
  );
}