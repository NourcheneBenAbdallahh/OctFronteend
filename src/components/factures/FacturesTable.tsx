"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  createFacture,
  deleteFacture,
  normalizeFacture,
  updateFacture,
} from "@/lib/factures.api";
import {
  CommandeOption,
  CreateFactureInput,
  EmballageOption,
  FactureStatut,
  FacturesPaginatorInfo,
  TableFacture,
  UpdateFactureInput,
} from "@/types/facture";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Id = string | number;

type FactureForm = {
  numero_facture: string;
  date_facture: string;
  montant_ht: string;
  emballage_id: string;
  quantite_facturee: string;
  commande_id: string;
  commande_numero: string;
  statut: FactureStatut;
};

const emptyForm: FactureForm = {
  numero_facture: "",
  date_facture: "",
  montant_ht: "",
  emballage_id: "",
  quantite_facturee: "",
  commande_id: "",
  commande_numero: "",
  statut: "BROUILLON",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.includes("T") ? value.split("T")[0] : value;
}

function formatMoney(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return Number(value).toFixed(2);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue.";
}

export default function FacturesTable({
  data,
  pagination,
  emballages,
  commandes,
}: {
  data: TableFacture[];
  pagination: FacturesPaginatorInfo;
  emballages: EmballageOption[];
  commandes: CommandeOption[];
}) {
  const [rows, setRows] = useState<TableFacture[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableFacture | null>(null);
  const [form, setForm] = useState<FactureForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [commandeDropdownOpen, setCommandeDropdownOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const commandeDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setRows(data);
  }, [data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        commandeDropdownRef.current &&
        !commandeDropdownRef.current.contains(event.target as Node)
      ) {
        setCommandeDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const emballagesMap = useMemo(() => {
    return new Map(emballages.map((item) => [String(item.id), item.label]));
  }, [emballages]);

  const commandesMap = useMemo(() => {
    return new Map(
      commandes.map((item) => [String(item.id), item.numero_commande])
    );
  }, [commandes]);

  const filteredCommandes = useMemo(() => {
    const search = form.commande_numero.trim().toLowerCase();

    if (!search) return commandes;

    return commandes.filter((commande) =>
      commande.numero_commande.toLowerCase().includes(search)
    );
  }, [commandes, form.commande_numero]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrorMessage("");
    setCommandeDropdownOpen(false);
    setIsOpen(true);
  }

  function openEdit(item: TableFacture) {
    const commandeNumero = commandesMap.get(String(item.commande_id)) || "";

    setEditing(item);
    setErrorMessage("");
    setCommandeDropdownOpen(false);
    setForm({
      numero_facture: item.numero_facture ?? "",
      date_facture: item.date_facture
        ? item.date_facture.includes("T")
          ? item.date_facture.split("T")[0]
          : item.date_facture
        : "",
      montant_ht:
        item.montant_ht !== null && item.montant_ht !== undefined
          ? String(item.montant_ht)
          : "",
      emballage_id: item.emballage_id ? String(item.emballage_id) : "",
      quantite_facturee:
        item.quantite_facturee !== null && item.quantite_facturee !== undefined
          ? String(item.quantite_facturee)
          : "",
      commande_id: item.commande_id ? String(item.commande_id) : "",
      commande_numero: commandeNumero,
      statut: item.statut,
    });
    setIsOpen(true);
  }

  function closeModal() {
    if (submitLoading) return;
    setIsOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setErrorMessage("");
    setCommandeDropdownOpen(false);
  }

  function validateForm() {
    if (!form.numero_facture.trim()) {
      return "Le numéro de facture est obligatoire.";
    }

    if (!form.date_facture) {
      return "La date de facture est obligatoire.";
    }

    if (!form.montant_ht || Number(form.montant_ht) <= 0) {
      return "Le montant HT doit être supérieur à 0.";
    }

    if (!form.emballage_id) {
      return "L'emballage est obligatoire.";
    }

    if (!form.quantite_facturee || Number(form.quantite_facturee) <= 0) {
      return "La quantité facturée doit être supérieure à 0.";
    }

    if (!form.commande_id) {
      return "La commande est obligatoire.";
    }

    return "";
  }

  function handleCommandeInputChange(value: string) {
    setForm((prev) => ({
      ...prev,
      commande_numero: value,
      commande_id: "",
    }));
    setCommandeDropdownOpen(true);
  }

  function handleSelectCommande(commande: CommandeOption) {
    setForm((prev) => ({
      ...prev,
      commande_id: String(commande.id),
      commande_numero: commande.numero_commande,
    }));
    setCommandeDropdownOpen(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitLoading(true);
    setErrorMessage("");

    try {
      const payloadBase = {
        numero_facture: form.numero_facture.trim(),
        date_facture: form.date_facture,
        montant_ht: Number(form.montant_ht),
        emballage_id: form.emballage_id,
        quantite_facturee: Number(form.quantite_facturee),
        commande_id: form.commande_id,
        statut: form.statut,
      };

      if (editing) {
        const updatePayload: UpdateFactureInput = payloadBase;
        const res = await updateFacture(editing.id, updatePayload);
        const updated = normalizeFacture(res.updateFacture);

        setRows((current) =>
          current.map((item) =>
            String(item.id) === String(updated.id) ? updated : item
          )
        );
      } else {
        const createPayload: CreateFactureInput = payloadBase;
        const res = await createFacture(createPayload);
        const created = normalizeFacture(res.createFacture);

        setRows((current) => [created, ...current]);
      }

      closeModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleDelete(id: Id) {
    if (!confirm("Delete this facture?")) return;

    try {
      await deleteFacture(id);
      setRows((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;

    const q = query.toLowerCase();

    return rows.filter((item) => {
      const commandeNumero = commandesMap.get(String(item.commande_id)) || "";
      const emballageLabel = emballagesMap.get(String(item.emballage_id)) || "";

      return (
        item.numero_facture?.toLowerCase().includes(q) ||
        item.statut?.toLowerCase().includes(q) ||
        commandeNumero.toLowerCase().includes(q) ||
        emballageLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, query, commandesMap, emballagesMap]);

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={openNew}
          className="rounded-lg bg-brand-500 px-4 py-2 text-white"
        >
          + New Facture
        </button>

        <input
          type="text"
          placeholder="Search by numero, statut, commande, emballage..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300 sm:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-auto">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Numéro</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Montant HT</th>
                <th className="px-4 py-3">Montant TTC</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Emballage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.numero_facture}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(item.date_facture)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatMoney(item.montant_ht)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatMoney(item.montant_ttc)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.quantite_facturee ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.statut === "PAYE" ? (
                        <span className="font-medium text-green-600">PAYE</span>
                      ) : item.statut === "VALIDE" ? (
                        <span className="font-medium text-blue-600">VALIDE</span>
                      ) : (
                        <span className="font-medium text-amber-600">
                          BROUILLON
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {commandesMap.get(String(item.commande_id)) || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {emballagesMap.get(String(item.emballage_id)) || "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="mr-3 text-brand-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No factures found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pagination.lastPage > 1 && (
        <div className="flex justify-center py-4">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.lastPage}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl space-y-4 rounded-xl bg-white p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                {editing ? "Edit Facture" : "New Facture"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-gray-500"
              >
                Close
              </button>
            </div>

            {errorMessage ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorMessage}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                placeholder="Numéro facture"
                value={form.numero_facture}
                onChange={(e) =>
                  setForm({ ...form, numero_facture: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <input
                type="date"
                value={form.date_facture}
                onChange={(e) =>
                  setForm({ ...form, date_facture: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Montant HT"
                value={form.montant_ht}
                onChange={(e) =>
                  setForm({ ...form, montant_ht: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quantité facturée"
                value={form.quantite_facturee}
                onChange={(e) =>
                  setForm({ ...form, quantite_facturee: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <select
                value={form.emballage_id}
                onChange={(e) =>
                  setForm({ ...form, emballage_id: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              >
                <option value="">Select emballage</option>
                {emballages.map((emballage) => (
                  <option key={emballage.id} value={String(emballage.id)}>
                    {emballage.label}
                  </option>
                ))}
              </select>

              <div className="relative w-full" ref={commandeDropdownRef}>
                <input
                  type="text"
                  placeholder="Sélectionner un numéro de commande"
                  value={form.commande_numero}
                  onFocus={() => setCommandeDropdownOpen(true)}
                  onChange={(e) => handleCommandeInputChange(e.target.value)}
                  className="w-full rounded border p-2"
                  required
                />

                {commandeDropdownOpen && (
                  <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredCommandes.length > 0 ? (
                      filteredCommandes.map((commande) => (
                        <button
                          key={commande.id}
                          type="button"
                          onClick={() => handleSelectCommande(commande)}
                          className="block w-full border-b border-gray-100 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          {commande.numero_commande}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Aucun numéro de commande trouvé.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <select
                value={form.statut}
                onChange={(e) =>
                  setForm({
                    ...form,
                    statut: e.target.value as FactureStatut,
                  })
                }
                className="w-full rounded border p-2"
              >
                <option value="BROUILLON">BROUILLON</option>
                <option value="VALIDE">VALIDE</option>
                <option value="PAYE">PAYE</option>
              </select>

              <input
                value={
                  form.montant_ht
                    ? (Number(form.montant_ht) * 1.19).toFixed(2)
                    : ""
                }
                readOnly
                placeholder="Montant TTC (calculé)"
                className="w-full rounded border bg-gray-50 p-2 text-gray-500"
              />
            </div>

            <div className="text-xs text-gray-500">
              Commande sélectionnée :{" "}
              <span className="font-medium text-gray-700">
                {form.commande_numero || "-"}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded px-4 py-2 text-gray-700"
                disabled={submitLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-brand-500 px-4 py-2 text-white disabled:opacity-60"
                disabled={submitLoading}
              >
                {submitLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}