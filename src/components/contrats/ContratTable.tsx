"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  listContrats,
  createContrat,
  updateContrat,
  deleteContrat,
} from "@/lib/contrats.api";
import { TableContrat, normalizeContrat } from "@/types/contrat";
import { 
  listFournisseurs, 
  TableFournisseur, 
  normalizeFournisseur 
} from "@/lib/fournisseurs.api";
import { 
  listEmballages, 
} from "@/lib/emballages.api";
import {TableEmballages ,  Emballages as APIEmballages,  normalizeEmballages 

  } from "@/types/emballage";
// Importation de nos sous-composants séparés
import { ContratHeader } from "./ContratHeader";
import { ContratListView } from "./ContratListView";
import { ContratForm } from "./ContratForm";
import Pagination from "@/components/tables/Pagination";

type Status = "ACTIF" | "EXPIRE" | "SUSPENDU";

const ITEMS_PER_PAGE = 10;

export default function ContratTable({ data }: { data?: TableContrat[] }) {
  const [rows, setRows] = useState<TableContrat[]>(data ? data.map(normalizeContrat) : []);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableContrat | null>(null);
  const [query, setQuery] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const [fournisseurs, setFournisseurs] = useState<TableFournisseur[]>([]);
  const [emballages, setEmballages] = useState<TableEmballages[]>([]);

  const emptyForm: Partial<TableContrat> = {
    numero_contrat: "",
    date_debut: "",
    date_fin: "",
    quantite_contractuelle: 0,
    taux_depassement_autorise: 0.2,
    quantite_realisee: 0,
    statut: "ACTIF" as Status,
    fournisseur_id: "",
    emballage_id: "",
  };

  const [form, setForm] = useState<Partial<TableContrat>>(emptyForm);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        if (!data) {
          const resContrats = await listContrats();
          setRows(resContrats.contrats.map(normalizeContrat));
        }
        const resFourn = await listFournisseurs();
        setFournisseurs(resFourn.fournisseurs.map(normalizeFournisseur));

        const resEmb = await listEmballages(1, 100);
        setEmballages(resEmb.emballages.data.map(normalizeEmballages));
      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [data]);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);

    try {
      const input = {
        numero_contrat: form.numero_contrat || "",
        date_debut: form.date_debut || "",
        date_fin: form.date_fin || "",
        quantite_contractuelle: Number(form.quantite_contractuelle) || 0,
        taux_depassement_autorise: Number(form.taux_depassement_autorise) || 0,
        quantite_realisee: Number(form.quantite_realisee) || 0,
        statut: form.statut || "ACTIF",
        fournisseur_id: form.fournisseur_id || "",
        emballage_id: form.emballage_id || "",
      };

      let finalContrat: TableContrat;

      if (editing) {
        const res = await updateContrat(editing.id, input);
        finalContrat = normalizeContrat(res.updateContrat);
      } else {
        const res = await createContrat(input);
        finalContrat = normalizeContrat(res.createContrat);
      }
      const updatedWithRefs: TableContrat = {
        ...finalContrat,
        fournisseur: fournisseurs.find(f => String(f.id) === String(input.fournisseur_id)),
        emballage: emballages.find(e => String(e.id) === String(input.emballage_id))
      };

      if (editing) {
        setRows((r) => r.map((x) => (String(x.id) === String(updatedWithRefs.id) ? updatedWithRefs : x)));
      } else {
        setRows((r) => [updatedWithRefs, ...r]);
      }
      
      setIsOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string | number) {
    if (!confirm("Supprimer ce contrat ?")) return;
    try {
      await deleteContrat(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch {
      alert("Erreur suppression");
    }
  }

  const filteredRows = useMemo(() => {
    return rows.filter((c) => 
      c.numero_contrat.toLowerCase().includes(query.toLowerCase()) ||
      c.fournisseur?.raison_sociale?.toLowerCase().includes(query.toLowerCase())
    );
  }, [rows, query]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col">
     

      {/* Barre d'outils */}
      <ContratHeader 
        query={query} 
        setQuery={setQuery} 
        onOpenNew={() => { 
          setEditing(null); 
          setForm(emptyForm); 
          setIsOpen(true); 
        }} 
      />

      {/* Zone scrollable pour la liste */}
      <div className="overflow-auto">
        <ContratListView 
          rows={paginatedRows} 
          onEdit={(c) => { 
            setEditing(c); 
            setForm(c); 
            setIsOpen(true); 
          }} 
          onDelete={handleDelete} 
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Formulaire Modal */}
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