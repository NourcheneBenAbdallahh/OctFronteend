"use client";

import React, { useEffect, useMemo, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  cancelCommande,
  createCommande,
  dropCommande,
  normalizeCommande,
  updateCommande,
} from "@/lib/commandes.api";
import {
  CommandeStatut,
  CommandesPaginatorInfo,
  ContratForCommande,
  CreateCommandeInput,
  EmballageOption,
  EntrepotOption,
  FournisseurOption,
  TableCommande,
  UpdateCommandeInput,
} from "@/types/commandes";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Id = string | number;

type CommandeForm = {
  date_livraison_prevue: string;
  emballage_id: string;
  quantite: string;
  fournisseur_id: string;
  entrepot_id: string;
  statut: CommandeStatut;
};

const emptyForm: CommandeForm = {
  date_livraison_prevue: "",
  emballage_id: "",
  quantite: "",
  fournisseur_id: "",
  entrepot_id: "",
  statut: "BROUILLON",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.includes("T") ? value.split("T")[0] : value;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("No contract found for this fournisseur")) {
      return "Aucun contrat trouvé pour ce fournisseur.";
    }
    if (error.message.includes("quantite must be > 0")) {
      return "La quantité doit être supérieure à 0.";
    }
    if (error.message.includes("date_livraison_prevue must be >=")) {
      return "La date de livraison prévue doit être supérieure ou égale à la date du jour.";
    }
    if (error.message.includes("Only BROUILLON commandes can be dropped")) {
      return "Seules les commandes BROUILLON peuvent être supprimées.";
    }
    return error.message;
  }

  return "Une erreur est survenue.";
}

export default function CommandesTable({
  data,
  pagination,
  emballages,
  entrepots,
  fournisseurs,
  contrats,
}: {
  data: TableCommande[];
  pagination: CommandesPaginatorInfo;
  emballages: EmballageOption[];
  entrepots: EntrepotOption[];
  fournisseurs: FournisseurOption[];
  contrats: ContratForCommande[];
}) {
  const [rows, setRows] = useState<TableCommande[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableCommande | null>(null);
  const [form, setForm] = useState<CommandeForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setRows(data);
  }, [data]);

  const emballagesMap = useMemo(
    () => new Map(emballages.map((x) => [String(x.id), x.label])),
    [emballages]
  );

  const entrepotsMap = useMemo(
    () => new Map(entrepots.map((x) => [String(x.id), x.label])),
    [entrepots]
  );

  const fournisseursMap = useMemo(
    () => new Map(fournisseurs.map((x) => [String(x.id), x.label])),
    [fournisseurs]
  );

  const activeContractForSelectedFournisseur = useMemo(() => {
    if (!form.fournisseur_id) return null;

    return (
      contrats.find(
        (c) =>
          String(c.fournisseur_id) === String(form.fournisseur_id) &&
          String(c.statut).toUpperCase() === "ACTIF"
      ) || null
    );
  }, [contrats, form.fournisseur_id]);

  const quantiteRestante = useMemo(() => {
    if (!activeContractForSelectedFournisseur) return null;

    return (
      Number(activeContractForSelectedFournisseur.quantite_contractuelle || 0) -
      Number(activeContractForSelectedFournisseur.quantite_realisee || 0)
    );
  }, [activeContractForSelectedFournisseur]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrorMessage("");
    setIsOpen(true);
  }

  function openEdit(item: TableCommande) {
    setEditing(item);
    setErrorMessage("");
    setForm({
      date_livraison_prevue: item.date_livraison_prevue
        ? item.date_livraison_prevue.includes("T")
          ? item.date_livraison_prevue.split("T")[0]
          : item.date_livraison_prevue
        : "",
      emballage_id: String(item.emballage_id ?? ""),
      quantite: String(item.quantite ?? ""),
      fournisseur_id: String(item.fournisseur_id ?? ""),
      entrepot_id: String(item.entrepot_id ?? ""),
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
  }

  function validateForm() {
    if (!form.date_livraison_prevue) {
      return "La date de livraison prévue est obligatoire.";
    }
    if (!form.emballage_id) {
      return "L'emballage est obligatoire.";
    }
    if (!form.fournisseur_id) {
      return "Le fournisseur est obligatoire.";
    }
    if (!form.entrepot_id) {
      return "L'entrepôt est obligatoire.";
    }
    if (!form.quantite || Number(form.quantite) <= 0) {
      return "La quantité doit être supérieure à 0.";
    }
    if (!activeContractForSelectedFournisseur) {
      return "Aucun contrat ACTIF trouvé pour ce fournisseur.";
    }
    if (quantiteRestante !== null && Number(form.quantite) > quantiteRestante) {
      return "La quantité dépasse la quantité restante du contrat.";
    }
    return "";
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
        date_livraison_prevue: form.date_livraison_prevue,
        emballage_id: form.emballage_id,
        quantite: Number(form.quantite),
        fournisseur_id: form.fournisseur_id,
        entrepot_id: form.entrepot_id,
      };

      if (editing) {
        const updatePayload: UpdateCommandeInput = {
          ...payloadBase,
          statut: form.statut,
        };

        const res = await updateCommande(editing.id, updatePayload);
        const updated = normalizeCommande(res.updateCommande);

        setRows((current) =>
          current.map((item) =>
            String(item.id) === String(updated.id) ? updated : item
          )
        );
      } else {
        const createPayload: CreateCommandeInput = payloadBase;
        const res = await createCommande(createPayload);
        const created = normalizeCommande(res.createCommande);

        setRows((current) => [created, ...current]);
      }

      closeModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitLoading(false);
    }
  }

  async function handleCancel(id: Id) {
    if (!confirm("Cancel this commande?")) return;

    try {
      const res = await cancelCommande(id);
      const updated = normalizeCommande(res.cancelCommande);

      setRows((current) =>
        current.map((item) =>
          String(item.id) === String(updated.id) ? updated : item
        )
      );
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  async function handleDrop(id: Id) {
    if (!confirm("Delete this commande?")) return;

    try {
      await dropCommande(id);
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
      const fournisseur = fournisseursMap.get(String(item.fournisseur_id)) || "";
      const emballage = emballagesMap.get(String(item.emballage_id)) || "";
      const entrepot = entrepotsMap.get(String(item.entrepot_id)) || "";

      return (
        item.numero_commande?.toLowerCase().includes(q) ||
        item.statut?.toLowerCase().includes(q) ||
        fournisseur.toLowerCase().includes(q) ||
        emballage.toLowerCase().includes(q) ||
        entrepot.toLowerCase().includes(q)
      );
    });
  }, [rows, query, fournisseursMap, emballagesMap, entrepotsMap]);

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
          + New Commande
        </button>

        <input
          type="text"
          placeholder="Search by numero, statut, fournisseur..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300 sm:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] table-auto">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Numéro</th>
                <th className="px-4 py-3">Date commande</th>
                <th className="px-4 py-3">Date livraison</th>
                <th className="px-4 py-3">Fournisseur</th>
                <th className="px-4 py-3">Emballage</th>
                <th className="px-4 py-3">Entrepôt</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.numero_commande}
                    </td>
                    <td className="px-4 py-3">{formatDate(item.date_commande)}</td>
                    <td className="px-4 py-3">
                      {formatDate(item.date_livraison_prevue)}
                    </td>
                    <td className="px-4 py-3">
                      {fournisseursMap.get(String(item.fournisseur_id)) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {emballagesMap.get(String(item.emballage_id)) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {entrepotsMap.get(String(item.entrepot_id)) || "-"}
                    </td>
                    <td className="px-4 py-3">{item.quantite}</td>
                    <td className="px-4 py-3">{item.statut}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className={`mr-3 ${
                          item.statut !== "LIVREC"
                            ? "text-brand-600"
                            : "cursor-not-allowed text-gray-400"
                        }`}
                        disabled={item.statut === "LIVREC"}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleCancel(item.id)}
                        className={`mr-3 ${
                          item.statut === "VALIDEE"
                            ? "text-amber-600"
                            : "cursor-not-allowed text-gray-400"
                        }`}
                        disabled={item.statut !== "VALIDEE"}
                      >
                        Cancel
                      </button>

                      <button
                        onClick={() => handleDrop(item.id)}
                        className={
                          item.statut === "BROUILLON"
                            ? "text-red-600"
                            : "cursor-not-allowed text-gray-400"
                        }
                        disabled={item.statut !== "BROUILLON"}
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
                    No commandes found.
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
                {editing ? "Edit Commande" : "New Commande"}
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
                type="date"
                value={form.date_livraison_prevue}
                onChange={(e) =>
                  setForm({ ...form, date_livraison_prevue: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quantité"
                value={form.quantite}
                onChange={(e) => setForm({ ...form, quantite: e.target.value })}
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
                {emballages.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={form.entrepot_id}
                onChange={(e) =>
                  setForm({ ...form, entrepot_id: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              >
                <option value="">Select entrepot</option>
                {entrepots.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={form.fournisseur_id}
                onChange={(e) =>
                  setForm({ ...form, fournisseur_id: e.target.value })
                }
                className="w-full rounded border p-2 md:col-span-2"
                required
              >
                <option value="">Select fournisseur</option>
                {fournisseurs.map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                readOnly
                value={
                  activeContractForSelectedFournisseur
                    ? activeContractForSelectedFournisseur.numero_contrat
                    : ""
                }
                placeholder="Contrat actif"
                className="w-full rounded border bg-gray-50 p-2 text-gray-500"
              />

              <input
                readOnly
                value={
                  quantiteRestante !== null ? String(quantiteRestante) : ""
                }
                placeholder="Quantité restante"
                className="w-full rounded border bg-gray-50 p-2 text-gray-500"
              />

              {editing && (
                <select
                  value={form.statut}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      statut: e.target.value as CommandeStatut,
                    })
                  }
                  className="w-full rounded border p-2 md:col-span-2"
                >
                  <option value="BROUILLON">BROUILLON</option>
                  <option value="VALIDEE">VALIDEE</option>
                  <option value="LIVREP">LIVREP</option>
                  <option value="LIVREC">LIVREC</option>
                  <option value="ANNULEE">ANNULEE</option>
                </select>
              )}
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