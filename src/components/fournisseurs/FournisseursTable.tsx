"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
} from "@/lib/fournisseurs.api";
import { FournisseurHeader } from "./FournisseurHeader";
import { FournisseurListView } from "./FournisseurListView";
import { FournisseurForm } from "./FournisseurForm";
import { TableFournisseur, normalizeFournisseur } from "@/types/fournisseur";

const ITEMS_PER_PAGE = 10;

// Pagination locale même design que ContratTable
const LocalPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
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

export default function FournisseursTable({
  data,
}: {
  data: TableFournisseur[];
}) {
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

        logo: form.logo || null,
        registre_entreprise: form.registre_entreprise?.trim() || null,
        telephone: form.telephone?.trim() || null,
        email: form.email?.trim() || null,
        adresse: form.adresse?.trim() || null,
        representant_nom: form.representant_nom?.trim() || null,
        representant_role: form.representant_role?.trim() || null,
        adresse_geocodee: form.adresse_geocodee?.trim() || null,

        latitude:
          form.latitude === null || String(form.latitude).trim() === ""
            ? null
            : Number(form.latitude),
        longitude:
          form.longitude === null || String(form.longitude).trim() === ""
            ? null
            : Number(form.longitude),
      };

      if (!input.raison_sociale || !input.matricule_fiscale) {
        alert("La raison sociale et le matricule fiscal sont obligatoires.");
        setLoading(false);
        return;
      }

      if (editing) {
        const res = await updateFournisseur(editing.id, input as any);
        const updated = normalizeFournisseur(res.updateFournisseur);
        setRows((r) =>
          r.map((x) => (String(x.id) === String(updated.id) ? updated : x))
        );
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
    return rows.filter(
      (f) =>
        f.raison_sociale?.toLowerCase().includes(q) ||
        f.matricule_fiscale?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  return (
    <div className="flex flex-col gap-6 min-h-[700px]">
      <FournisseurHeader
        query={query}
        setQuery={setQuery}
        onOpenNew={() => {
          setEditing(null);
          setForm(emptyForm);
          setIsOpen(true);
        }}
      />

      <div className="flex-1">
        <FournisseurListView
          rows={paginatedRows}
          onEdit={(f) => {
            setEditing(f);
            setForm(f);
            setIsOpen(true);
          }}
          onDelete={handleDelete}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center py-6 bg-white rounded-[2rem] border border-gray-50 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <LocalPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
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