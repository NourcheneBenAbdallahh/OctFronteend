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

function formatForBackend(dateStr: string): string {
  let formatted = dateStr.replace("T", " ");
  if (formatted.length === 16) formatted = `${formatted}:00`;
  return formatted;
}

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
    search: "",
    status: "all",
    entrepot: "",
    code_session: "",
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

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.emballage_name.toLowerCase().includes(q) ||
          r.entrepot_name.toLowerCase().includes(q) ||
          (r.code_session || "").toLowerCase().includes(q)
      );
    }
    if (filters.entrepot) {
      rows = rows.filter((r) => r.entrepot_id === filters.entrepot);
    }
    if (filters.code_session) {
      rows = rows.filter((r) => r.code_session === filters.code_session);
    }
    if (filters.status === "perfect") {
      rows = rows.filter((r) => Math.abs(r.ecart) < 0.0001);
    } else if (filters.status === "negative") {
      rows = rows.filter((r) => r.ecart < 0);
    } else if (filters.status === "positive") {
      rows = rows.filter((r) => r.ecart > 0);
    } else if (filters.status === "non_regularise") {
      rows = rows.filter((r) => r.statut !== "REGULARISEE");
    }
    return rows.sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart));
  }, [data, filters]);

  const criticalCount = data.filter(
    (i) => i.statut !== "REGULARISEE" && Math.abs(i.ecart) >= 0.0001
  ).length;

  const sessionCodes = useMemo(
    () =>
      Array.from(
        new Set(data.map((d) => d.code_session).filter(Boolean) as string[])
      ),
    [data]
  );

  const handleGenererEntrepot = async () => {
    const entrepotId = filters.entrepot || allEntrepots[0]?.id;
    if (!entrepotId) {
      alert("Sélectionnez un entrepôt dans les filtres ou créez-en un.");
      return;
    }
    const date = formatForBackend(new Date().toISOString().slice(0, 16));
    if (!window.confirm(`Générer les lignes d'inventaire pour cet entrepôt à la date du jour ?`)) {
      return;
    }
    try {
      const lignes = await genererInventaireEntrepot(entrepotId, date);
      if (lignes.length > 0 && lignes[0].code_session) {
        setActiveSession(lignes[0].code_session!);
        setFilters((f) => ({ ...f, code_session: lignes[0].code_session! }));
      }
      await load();
      alert(`${lignes.length} ligne(s) créée(s).`);
    } catch {
      alert("Erreur lors de la génération.");
    }
  };

  const handleRegulariserSession = async () => {
    const code = activeSession || filters.code_session;
    if (!code) {
      alert("Aucune session active. Générez d'abord un inventaire entrepôt.");
      return;
    }
    if (!window.confirm(`Régulariser toutes les lignes comptées de la session ${code} ?`)) {
      return;
    }
    try {
      const n = await regulariserInventaireSession(code);
      await load();
      alert(`${n} ligne(s) régularisée(s).`);
    } catch {
      alert("Erreur lors de la régularisation.");
    }
  };

  const handleRegulariser = async (id: string) => {
    if (!window.confirm("Appliquer l'écart au stock système (mouvement tracé) ?")) return;
    try {
      await regulariserInventaire(id);
      await load();
    } catch {
      alert("Erreur lors de la régularisation.");
    }
  };

  const handleCreate = async (payload: Parameters<typeof createInventaire>[0]) => {
    await createInventaire(payload);
    setFormOpen(false);
    await load();
  };

  const handleEdit = async (payload: Parameters<typeof createInventaire>[0]) => {
    if (!editing) return;
    const { entrepot_id, emballage_id, ...rest } = payload;
    await updateInventaire(editing.id, rest);
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cet inventaire ?")) return;
    try {
      await deleteInventaire(id);
      await load();
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-6">
      <InventaireHeader
        loading={loading}
        onRefresh={load}
        onNew={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onGenererEntrepot={handleGenererEntrepot}
        onRegulariserSession={handleRegulariserSession}
        hasActiveSession={!!(activeSession || filters.code_session)}
        total={data.length}
        criticalCount={criticalCount}
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

      <InventaireStats data={data} />

      <InventaireFiltersBar data={data} filters={filters} onChange={setFilters} />

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
        onRegulariser={handleRegulariser}
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
        onRegulariser={selected ? () => handleRegulariser(selected.id) : undefined}
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
