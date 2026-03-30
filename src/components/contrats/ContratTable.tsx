"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ContratHeader } from "./ContratHeader";
import { ContratListView } from "./ContratListView";
import { ContratForm } from "./ContratForm";
import { listContrats, createContrat, updateContrat, deleteContrat } from "@/lib/contrats.api";
import { listFournisseurs } from "@/lib/fournisseurs.api";
import { listEmballages } from "@/lib/emballages.api";
import { normalizeContrat, TableContrat } from "@/types/contrat";
import { TableEmballages } from "@/types/emballage";
import { TableFournisseur } from "@/types/fournisseur";

// Sous-composant interne pour la pagination en français
const LocalPagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (p: number) => void 
}) => (
  <div className="flex items-center gap-4">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Précédent
    </button>
    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-x px-6 border-gray-100">
      Page {currentPage} sur {totalPages}
    </div>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Suivant
    </button>
  </div>
);

export default function ContratTable({ data }: { data?: TableContrat[] }) {
  const [rows, setRows] = useState<TableContrat[]>(data ? data.map(normalizeContrat) : []);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableContrat | null>(null);
  const [query, setQuery] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [fournisseurs, setFournisseurs] = useState<TableFournisseur[]>([]);
  const [emballages, setEmballages] = useState<TableEmballages[]>([]);

  const emptyForm: Partial<TableContrat> = {
    numero_contrat: "",
    date_debut: "",
    date_fin: "",
    quantite_contractuelle: 0,
    taux_depassement_autorise: 0.2,
    quantite_realisee: 0,
    statut: "ACTIF",
    fournisseur_id: "",
    emballage_id: "",
  };
  const [form, setForm] = useState<Partial<TableContrat>>(emptyForm);

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [resF, resE] = await Promise.all([
          listFournisseurs(),
          listEmballages(1, 100)
        ]);
        setFournisseurs(resF.fournisseurs || []);
        setEmballages(resE.emballages.data || []);
      } catch (err) {
        console.error("Erreur de chargement des références", err);
      }
    };
    loadRefs();
  }, []);

  // Filtrage et Pagination combinés
  const filteredRows = useMemo(() => {
    return rows.filter(r =>
      r.numero_contrat.toLowerCase().includes(query.toLowerCase()) ||
      r.fournisseur?.raison_sociale?.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  // Reset la page si on recherche
  useEffect(() => { setCurrentPage(1); }, [query]);

  const stats = useMemo(() => {
    const total = rows.length;
    const totalV = rows.reduce((acc, c) => acc + (c.quantite_contractuelle || 0), 0);
    const totalR = rows.reduce((acc, c) => acc + (c.quantite_realisee || 0), 0);
    return {
      total,
      actifs: rows.filter(r => r.statut === "ACTIF").length,
      realisation: totalV > 0 ? Math.round((totalR / totalV) * 100) : 0
    };
  }, [rows]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        numero_contrat: form.numero_contrat || "",
        date_debut: form.date_debut || "",
        date_fin: form.date_fin || "",
        quantite_contractuelle: Number(form.quantite_contractuelle) || 0,
        fournisseur_id: form.fournisseur_id || "",
        emballage_id: form.emballage_id || "",
      } as any;

      let updated: TableContrat;
      if (editing) {
        const res = await updateContrat(editing.id, payload);
        updated = normalizeContrat(res.updateContrat);
      } else {
        const res = await createContrat(payload);
        updated = normalizeContrat(res.createContrat);
      }

      updated.fournisseur = fournisseurs.find(f => String(f.id) === String(payload.fournisseur_id));
      updated.emballage = emballages.find(em => String(em.id) === String(payload.emballage_id));

      setRows(prev => editing ? prev.map(r => r.id === updated.id ? updated : r) : [updated, ...prev]);
      setIsOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      console.error(err);
      alert("Erreur de sauvegarde : Vérifiez les champs obligatoires.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 min-h-[700px]">
      <ContratHeader
        query={query}
        setQuery={setQuery}
        onOpenNew={() => { setEditing(null); setForm(emptyForm); setIsOpen(true); }}
        stats={stats}
      />

      <div className="flex-1">
        <ContratListView
          rows={paginatedRows}
          onEdit={(c) => { setEditing(c); setForm(c); setIsOpen(true); }}
          onDelete={async (id) => {
            if (confirm("Voulez-vous vraiment supprimer ce contrat ?")) {
              await deleteContrat(id);
              setRows(r => r.filter(x => x.id !== id));
            }
          }}
        />
      </div>

      {/* FOOTER : Pagination en français */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <LocalPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ContratForm
        isOpen={isOpen}
        editing={!!editing}
        form={form}
        setForm={setForm}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
        fournisseurs={fournisseurs}
        emballages={emballages}
      />
    </div>
  );
}