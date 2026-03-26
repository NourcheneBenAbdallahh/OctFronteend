"use client";

import React, { useMemo, useState } from "react";
import {
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
} from "@/lib/fournisseurs.api";
import { FournisseurHeader } from "./FournisseurHeader";
import { FournisseurListView } from "./FournisseurListView";
import { FournisseurForm } from "./FournisseurForm";
import Pagination from "@/components/tables/Pagination";
import { TableFournisseur, normalizeFournisseur } from "@/types/fournisseur";

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
    logo: "",
    matricule_fiscale: "",
    registre_entreprise: "",
    telephone: "",
    email: "",
    adresse: "",
    representant_nom: "",
    representant_role: "",
    statut: "ACTIF",
    latitude: null,
    longitude: null,
    adresse_geocodee: "",
  };

  const [form, setForm] = useState<Partial<TableFournisseur>>(emptyForm);


async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  try {
    
    const input = {
      raison_sociale: form.raison_sociale || "",
      matricule_fiscale: form.matricule_fiscale || "",
      statut: form.statut || "ACTIF",
      
      // Champs optionnels : on s'assure qu'ils sont soit string, soit null (pas undefined)
      logo: form.logo || null,
      registre_entreprise: form.registre_entreprise?.trim() || null,
      telephone: form.telephone?.trim() || null,
      email: form.email?.trim() || null,
      adresse: form.adresse?.trim() || null,
      representant_nom: form.representant_nom?.trim() || null,
      representant_role: form.representant_role?.trim() || null,
      adresse_geocodee: form.adresse_geocodee?.trim() || null,

      // Conversion numérique pour le Float GraphQL / Numeric Laravel
      latitude: (form.latitude === null || String(form.latitude).trim() === "") 
        ? null 
        : Number(form.latitude),
      longitude: (form.longitude === null || String(form.longitude).trim() === "") 
        ? null 
        : Number(form.longitude),
    };

    // 2. Validation locale simple avant l'envoi
    if (!input.raison_sociale || !input.matricule_fiscale) {
      alert("La raison sociale et le matricule fiscal sont obligatoires.");
      setLoading(false);
      return;
    }

    if (editing) {
      // On utilise un "as any" ou le type spécifique si tes fonctions API le permettent
      const res = await updateFournisseur(editing.id, input as any);
      const updated = normalizeFournisseur(res.updateFournisseur);
      setRows((r) => r.map((x) => (String(x.id) === String(updated.id) ? updated : x)));
    } else {
      const res = await createFournisseur(input as any);
      const created = normalizeFournisseur(res.createFournisseur);
      setRows((r) => [created, ...r]);
    }

    setIsOpen(false);
    setForm(emptyForm);
    setEditing(null);
  } catch (err: any) {
    console.error("Erreur détaillée:", err);
    
    // Extraction propre des messages d'erreur de validation Laravel/Lighthouse
    const validationErrors = err?.response?.errors?.[0]?.extensions?.validation;
    if (validationErrors) {
      const messages = Object.values(validationErrors).flat().join("\n");
      alert(`Erreur de validation :\n${messages}`);
    } else {
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
  } finally {
    setLoading(false);
  }
}



  async function handleDelete(id: string | number) {
    if (!confirm("Voulez-vous supprimer ce fournisseur ?")) return;
    try {
      await deleteFournisseur(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
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
    <div className="flex flex-col gap-4">
      <FournisseurHeader
        query={query}
        setQuery={(q) => { setQuery(q); setCurrentPage(1); }}
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
  onClose={() => { 
    setIsOpen(false); 
    setEditing(null); 
    setForm(emptyForm);
  }}
  onSubmit={handleSubmit}
  loading={loading}
/>
    </div>
  );
}