"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Pagination from "@/components/tables/Pagination";
import {
  createBonLivraison,
  deleteBonLivraison,
  normalizeBonLivraison,
  updateBonLivraison,
  validateBonLivraisonWithDocument,
} from "@/lib/bon-livraisons.api";
import {
  BonLivraisonStatut,
  BonLivraisonsPaginatorInfo,
  CommandeOption,
  CreateBonLivraisonInput,
  EmballageOption,
  EntrepotOption,
  TableBonLivraison,
  UpdateBonLivraisonInput,
} from "@/types/bon-livraison";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Id = string | number;

type BonLivraisonForm = {
  date_reception: string;
  emballage_id: string;
  quantite_recue: string;
  numero_commande: string;
  entrepot_id: string;
};

const emptyForm: BonLivraisonForm = {
  date_reception: "",
  emballage_id: "",
  quantite_recue: "",
  numero_commande: "",
  entrepot_id: "",
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return value.includes("T") ? value.split("T")[0] : value;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("Commande not found")) {
      return "La commande sélectionnée est introuvable.";
    }
    if (error.message.includes("Entrepot not found")) {
      return "L'entrepôt sélectionné est introuvable.";
    }
    if (error.message.includes("Emballage not found")) {
      return "L'emballage sélectionné est introuvable.";
    }
    if (error.message.includes("Update allowed only if statut is EN_ATTENTE")) {
      return "La modification est autorisée seulement si le statut est EN_ATTENTE.";
    }
    if (error.message.includes("Delete allowed only if statut is EN_ATTENTE")) {
      return "La suppression est autorisée seulement si le statut est EN_ATTENTE.";
    }
    return error.message;
  }

  return "Une erreur est survenue.";
}

export default function BonLivraisonsTable({
  data,
  pagination,
  emballages,
  commandes,
  entrepots,
}: {
  data: TableBonLivraison[];
  pagination: BonLivraisonsPaginatorInfo;
  emballages: EmballageOption[];
  commandes: CommandeOption[];
  entrepots: EntrepotOption[];
}) {
  const [rows, setRows] = useState<TableBonLivraison[]>(data);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TableBonLivraison | null>(null);
  const [form, setForm] = useState<BonLivraisonForm>(emptyForm);
  const [query, setQuery] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [commandeDropdownOpen, setCommandeDropdownOpen] = useState(false);

  const [validateOpen, setValidateOpen] = useState(false);
  const [validatingItem, setValidatingItem] = useState<TableBonLivraison | null>(null);
  const [validationFile, setValidationFile] = useState<File | null>(null);
  const [validateLoading, setValidateLoading] = useState(false);

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

  const entrepotsMap = useMemo(() => {
    return new Map(entrepots.map((item) => [String(item.id), item.label]));
  }, [entrepots]);

  const filteredCommandes = useMemo(() => {
    const search = form.numero_commande.trim().toLowerCase();
    if (!search) return commandes;

    return commandes.filter((commande) =>
      commande.numero_commande.toLowerCase().includes(search)
    );
  }, [commandes, form.numero_commande]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setErrorMessage("");
    setCommandeDropdownOpen(false);
    setIsOpen(true);
  }

  function openEdit(item: TableBonLivraison) {
    setEditing(item);
    setErrorMessage("");
    setCommandeDropdownOpen(false);
    setForm({
      date_reception: item.date_reception
        ? item.date_reception.includes("T")
          ? item.date_reception.split("T")[0]
          : item.date_reception
        : "",
      emballage_id: item.emballage_id ? String(item.emballage_id) : "",
      quantite_recue:
        item.quantite_recue !== null && item.quantite_recue !== undefined
          ? String(item.quantite_recue)
          : "",
      numero_commande: item.numero_commande ?? "",
      entrepot_id: item.entrepot_id ? String(item.entrepot_id) : "",
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
    if (!form.date_reception) {
      return "La date de réception est obligatoire.";
    }

    if (!form.emballage_id) {
      return "L'emballage est obligatoire.";
    }

    if (!form.quantite_recue || Number(form.quantite_recue) <= 0) {
      return "La quantité reçue doit être supérieure à 0.";
    }

    if (!form.numero_commande.trim()) {
      return "Le numéro de commande est obligatoire.";
    }

    if (!form.entrepot_id) {
      return "L'entrepôt est obligatoire.";
    }

    return "";
  }

  function handleSelectCommande(commande: CommandeOption) {
    setForm((prev) => ({
      ...prev,
      numero_commande: commande.numero_commande,
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
        date_reception: form.date_reception,
        emballage_id: form.emballage_id,
        quantite_recue: Number(form.quantite_recue),
        numero_commande: form.numero_commande.trim(),
        entrepot_id: form.entrepot_id,
      };

      if (editing) {
        const updatePayload: UpdateBonLivraisonInput = {
          ...payloadBase,
        };

        const res = await updateBonLivraison(editing.id, updatePayload);
        const updated = normalizeBonLivraison(res.updateBonLivraison);

        setRows((current) =>
          current.map((item) =>
            String(item.id) === String(updated.id) ? updated : item
          )
        );
      } else {
        const createPayload: CreateBonLivraisonInput = payloadBase;
        const res = await createBonLivraison(createPayload);
        const created = normalizeBonLivraison(res.createBonLivraison);

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
    if (!confirm("Delete this bon de livraison?")) return;

    try {
      await deleteBonLivraison(id);
      setRows((current) =>
        current.filter((item) => String(item.id) !== String(id))
      );
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  function openValidate(item: TableBonLivraison) {
    setValidatingItem(item);
    setValidationFile(null);
    setErrorMessage("");
    setValidateOpen(true);
  }

  function closeValidateModal() {
    if (validateLoading) return;
    setValidateOpen(false);
    setValidatingItem(null);
    setValidationFile(null);
    setErrorMessage("");
  }

  async function handleValidateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!validatingItem) return;

    if (!validationFile) {
      setErrorMessage("Le fichier du bon de livraison est obligatoire.");
      return;
    }

    setValidateLoading(true);
    setErrorMessage("");

    try {
      const validated = await validateBonLivraisonWithDocument(
        validatingItem.id,
        validationFile
      );

      const updated = normalizeBonLivraison(validated);

      setRows((current) =>
        current.map((item) =>
          String(item.id) === String(updated.id) ? updated : item
        )
      );

      closeValidateModal();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setValidateLoading(false);
    }
  }

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;

    const q = query.toLowerCase();

    return rows.filter((item) => {
      const emballageLabel = emballagesMap.get(String(item.emballage_id)) || "";
      const entrepotLabel = entrepotsMap.get(String(item.entrepot_id)) || "";

      return (
        item.numero_bl?.toLowerCase().includes(q) ||
        item.numero_commande?.toLowerCase().includes(q) ||
        item.statut?.toLowerCase().includes(q) ||
        emballageLabel.toLowerCase().includes(q) ||
        entrepotLabel.toLowerCase().includes(q)
      );
    });
  }, [rows, query, emballagesMap, entrepotsMap]);

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
          + New Bon Livraison
        </button>

        <input
          type="text"
          placeholder="Search by numero BL, commande, statut..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-300 sm:max-w-sm"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1150px] table-auto">
            <thead>
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Numéro BL</th>
                <th className="px-4 py-3">Date réception</th>
                <th className="px-4 py-3">Commande</th>
                <th className="px-4 py-3">Emballage</th>
                <th className="px-4 py-3">Quantité</th>
                <th className="px-4 py-3">Entrepôt</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length > 0 ? (
                filteredRows.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.numero_bl}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatDate(item.date_reception)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.numero_commande}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {emballagesMap.get(String(item.emballage_id)) || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.quantite_recue}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {entrepotsMap.get(String(item.entrepot_id)) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {item.statut === "VALIDE" ? (
                        <span className="font-medium text-green-600">VALIDE</span>
                      ) : (
                        <span className="font-medium text-amber-600">
                          EN_ATTENTE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(item)}
                        className="mr-3 text-brand-600"
                      >
                        Edit
                      </button>

                      {item.statut === "EN_ATTENTE" && (
                        <button
                          onClick={() => openValidate(item)}
                          className="mr-3 text-green-600"
                        >
                          Valider
                        </button>
                      )}

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
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    No bon de livraisons found.
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
                {editing ? "Edit Bon Livraison" : "New Bon Livraison"}
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
                value={form.date_reception}
                onChange={(e) =>
                  setForm({ ...form, date_reception: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              />

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Quantité reçue"
                value={form.quantite_recue}
                onChange={(e) =>
                  setForm({ ...form, quantite_recue: e.target.value })
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

              <select
                value={form.entrepot_id}
                onChange={(e) =>
                  setForm({ ...form, entrepot_id: e.target.value })
                }
                className="w-full rounded border p-2"
                required
              >
                <option value="">Select entrepot</option>
                {entrepots.map((entrepot) => (
                  <option key={entrepot.id} value={String(entrepot.id)}>
                    {entrepot.label}
                  </option>
                ))}
              </select>

              <div
                className="relative w-full md:col-span-2"
                ref={commandeDropdownRef}
              >
                <input
                  type="text"
                  placeholder="Sélectionner un numéro de commande"
                  value={form.numero_commande}
                  onFocus={() => setCommandeDropdownOpen(true)}
                  onChange={(e) => {
                    setForm({ ...form, numero_commande: e.target.value });
                    setCommandeDropdownOpen(true);
                  }}
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

      {validateOpen && validatingItem && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleValidateSubmit}
            className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Valider le Bon de Livraison
              </h3>
              <button
                type="button"
                onClick={closeValidateModal}
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

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              <div>
                <strong>Numéro BL :</strong> {validatingItem.numero_bl}
              </div>
              <div>
                <strong>Commande :</strong> {validatingItem.numero_commande}
              </div>
              <div>
                <strong>Quantité reçue :</strong> {validatingItem.quantite_recue}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload du bon de livraison papier
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setValidationFile(e.target.files?.[0] || null)}
                className="w-full rounded border p-2"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeValidateModal}
                className="rounded px-4 py-2 text-gray-700"
                disabled={validateLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={validateLoading}
              >
                {validateLoading ? "Validation..." : "Valider"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}