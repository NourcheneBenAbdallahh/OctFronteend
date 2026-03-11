"use client";

import React, { useMemo, useState } from "react";
import {
  TableFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  normalizeFournisseur,
} from "@/lib/fournisseurs.api";
import { FournisseurHeader } from "./FournisseurHeader";
import { FournisseurListView } from "./FournisseurListView";
import { FournisseurForm } from "./FournisseurForm";
import Pagination from "@/components/tables/Pagination";

const ITEMS_PER_PAGE = 10;

export default function FournisseursTable({ data }: { data: TableFournisseur[] }) {
  const [rows, setRows] = useState<TableFournisseur[]>(data);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableFournisseur | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const emptyForm: Partial<TableFournisseur> = {
    raison_sociale: "",
    matricule_fiscale: "",
    telephone: "",
    adresse: "",
    statut: "ACTIF",
  };

  const [form, setForm] = useState<Partial<TableFournisseur>>(emptyForm);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    // 1. On crée un objet propre qui correspond exactement à ce que l'API attend
    // On utilise "|| ''" pour s'assurer qu'aucune valeur n'est 'undefined'
    const payload = {
      raison_sociale: form.raison_sociale || "",
      matricule_fiscale: form.matricule_fiscale || "",
      telephone: form.telephone || "",
      adresse: form.adresse || "",
      statut: form.statut || "ACTIF",
    };

    // 2. Vérification de sécurité pour éviter d'envoyer un formulaire vide
    if (!payload.raison_sociale || !payload.matricule_fiscale) {
      alert("Veuillez remplir les champs obligatoires.");
      setLoading(false);
      return;
    }

    if (editing) {
      // Pour l'update, on passe l'ID et le payload
      const res = await updateFournisseur(editing.id, payload);
      const updated = normalizeFournisseur(res.updateFournisseur);
      setRows((r) => r.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } else {
      // Pour la création, on passe le payload validé
      const res = await createFournisseur(payload);
      const created = normalizeFournisseur(res.createFournisseur);
      setRows((r) => [created, ...r]);
    }

    setIsOpen(false);
    setForm(emptyForm); // Reset le formulaire
    setEditing(null);
  } catch (err) {
    console.error("Erreur API:", err);
    alert("Erreur lors de l'enregistrement");
  } finally {
    setLoading(false);
  }
}
  async function handleDelete(id: string | number) {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    await deleteFournisseur(id);
    setRows(r => r.filter(x => x.id !== id));
  }

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase();
    return rows.filter(f => 
      f.raison_sociale?.toLowerCase().includes(q) || 
      f.matricule_fiscale?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
      <FournisseurHeader 
        query={query} 
        setQuery={setQuery} 
        onOpenNew={() => { setEditing(null); setForm(emptyForm); setIsOpen(true); }} 
      />

      <FournisseurListView 
        rows={paginatedRows} 
        onEdit={(f) => { setEditing(f); setForm(f); setIsOpen(true); }} 
        onDelete={handleDelete} 
      />

      {totalPages > 1 && (
        <div className="flex justify-center py-4">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      <FournisseurForm 
        isOpen={isOpen} 
        editing={!!editing} 
        form={form} 
        setForm={setForm} 
        onClose={() => setIsOpen(false)} 
        onSubmit={handleSubmit} 
        loading={loading} 
      />
    </div>
  );
}