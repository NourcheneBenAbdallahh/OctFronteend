"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  TableFournisseur,
  createFournisseur,
  updateFournisseur,
  deleteFournisseur,
  normalizeFournisseur,
} from "@/lib/fournisseurs.api";
import Pagination from "@/components/tables/Pagination";

type Id = string | number;

const ITEMS_PER_PAGE = 10;

export default function FournisseursTable({
  data,
}: {
  data: TableFournisseur[];
}) {
  const [rows, setRows] = useState<TableFournisseur[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableFournisseur | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const emptyForm = {
    raison_sociale: "",
    matricule_fiscale: "",
    telephone: "",
    adresse: "",
    statut: "ACTIF" as "ACTIF" | "INACTIF",
  };

  const [form, setForm] = useState<any>(emptyForm);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setIsOpen(true);
  }

  function openEdit(item: TableFournisseur) {
    setEditing(item);
    setForm(item);
    setIsOpen(true);
  }

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (editing) {
      const res = await updateFournisseur(editing.id, form);
      const updated = normalizeFournisseur(res.updateFournisseur);

      setRows((r) =>
        r.map((x) => (String(x.id) === String(updated.id) ? updated : x))
      );
    } else {
      const res = await createFournisseur(form);
      const created = normalizeFournisseur(res.createFournisseur);
      setRows((r) => [created, ...r]);
    }

    setIsOpen(false);
  }

  async function handleDelete(id: Id) {
    if (!confirm("Delete this fournisseur?")) return;
    await deleteFournisseur(id);
    setRows((r) => r.filter((x) => String(x.id) !== String(id)));
  }

  // Filter and pagination logic
  const filteredRows = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((f) =>
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex justify-between items-center">
        <button
          onClick={openNew}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white"
        >
          + New Fournisseur
        </button>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300"
        />
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-xs uppercase text-gray-500">
              <th className="px-4 py-3">Raison Sociale</th>
              <th className="px-4 py-3">Matricule Fiscale</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Adresse</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedRows.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3">{f.raison_sociale}</td>
                <td className="px-4 py-3">{f.matricule_fiscale}</td>
                <td className="px-4 py-3">{f.telephone ?? "-"}</td>
                <td className="px-4 py-3">{f.adresse ?? "-"}</td>
                <td className="px-4 py-3">
                  {f.statut === "ACTIF" ? (
                    <span className="text-green-600">ACTIF</span>
                  ) : (
                    <span className="text-red-600">INACTIF</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openEdit(f)}
                    className="mr-2 text-brand-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(f.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4"
          >
            <input
              placeholder="Raison sociale"
              value={form.raison_sociale}
              onChange={(e) =>
                setForm({ ...form, raison_sociale: e.target.value })
              }
              className="w-full border p-2 rounded"
              required
            />

            <input
              placeholder="Matricule fiscale"
              value={form.matricule_fiscale}
              onChange={(e) =>
                setForm({ ...form, matricule_fiscale: e.target.value })
              }
              className="w-full border p-2 rounded"
              required
            />

            <input
              placeholder="Téléphone"
              value={form.telephone}
              onChange={(e) =>
                setForm({ ...form, telephone: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <input
              placeholder="Adresse"
              value={form.adresse}
              onChange={(e) =>
                setForm({ ...form, adresse: e.target.value })
              }
              className="w-full border p-2 rounded"
            />

            <select
              value={form.statut}
              onChange={(e) =>
                setForm({ ...form, statut: e.target.value })
              }
              className="w-full border p-2 rounded"
            >
              <option value="ACTIF">ACTIF</option>
              <option value="INACTIF">INACTIF</option>
            </select>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="bg-brand-500 px-4 py-2 text-white rounded"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}