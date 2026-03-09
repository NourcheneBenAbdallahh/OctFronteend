"use client";

import { useEffect, useState } from "react";
import {
  fetchEntrepots,
  createEntrepot,
  updateEntrepot,
  deleteEntrepot,
  type Entrepot,
} from "@/lib/entrepot.api";

export default function EntrepotsPage() {
  const [items, setItems] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id: "",
    adresse: "",
    capacite_totale: "",
    capacite_disponible: "",
    statut: "ACTIF",
  });

  async function load() {
    setLoading(true);
    const data = await fetchEntrepots();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const isEdit = Boolean(form.id);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload: any = {
      adresse: form.adresse,
      statut: form.statut,
      capacite_totale: form.capacite_totale ? Number(form.capacite_totale) : undefined,
      capacite_disponible: form.capacite_disponible ? Number(form.capacite_disponible) : undefined,
    };

    if (isEdit) {
      await updateEntrepot({ id: form.id, ...payload });
    } else {
      await createEntrepot(payload);
    }

    setForm({ id: "", adresse: "", capacite_totale: "", capacite_disponible: "", statut: "ACTIF" });
    await load();
  }

  async function onDelete(id: string) {
    if (!confirm("Supprimer cet entrepot ?")) return;
    await deleteEntrepot(id);
    await load();
  }

  function onEdit(item: Entrepot) {
    setForm({
      id: item.id,
      adresse: item.adresse,
      capacite_totale: item.capacite_totale?.toString() ?? "",
      capacite_disponible: item.capacite_disponible?.toString() ?? "",
      statut: item.statut,
    });
  }

return (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Entrepôts
      </h1>
    </div>

    {/* Card: Form */}
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isEdit ? "Modifier un entrepôt" : "Créer un entrepôt"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Remplis les informations puis valide.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
            placeholder="Adresse"
            value={form.adresse}
            onChange={(e) => setForm((s) => ({ ...s, adresse: e.target.value }))}
            required
          />

          <input
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
            placeholder="Capacité totale"
            value={form.capacite_totale}
            onChange={(e) =>
              setForm((s) => ({ ...s, capacite_totale: e.target.value }))
            }
          />

          <input
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
            placeholder="Capacité disponible"
            value={form.capacite_disponible}
            onChange={(e) =>
              setForm((s) => ({ ...s, capacite_disponible: e.target.value }))
            }
          />

          <select
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            value={form.statut}
            onChange={(e) => setForm((s) => ({ ...s, statut: e.target.value }))}
          >
            <option value="ACTIF">ACTIF</option>
            <option value="INACTIF">INACTIF</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            type="submit"
          >
            {isEdit ? "Modifier" : "Créer"}
          </button>

          {isEdit && (
            <button
              type="button"
              className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
              onClick={() =>
                setForm({
                  id: "",
                  adresse: "",
                  capacite_totale: "",
                  capacite_disponible: "",
                  statut: "ACTIF",
                })
              }
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>

    {/* Card: Table */}
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Liste des entrepôts
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr className="text-left">
              <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Adresse
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Totale
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Disponible
              </th>
              <th className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-200">
                Statut
              </th>
              <th className="px-6 py-3 text-right font-semibold text-gray-700 dark:text-gray-200">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  className="px-6 py-4 text-gray-600 dark:text-gray-300"
                  colSpan={5}
                >
                  Chargement...
                </td>
              </tr>
            ) : items.length ? (
              items.map((it) => (
                <tr
                  key={it.id}
                  className="border-t border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-950"
                >
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {it.adresse}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {it.capacite_totale ?? "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    {it.capacite_disponible ?? "-"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                      {it.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
                      onClick={() => onEdit(it)}
                    >
                      Modifier
                    </button>
                    <button
                      className="h-9 rounded-xl border border-red-200 bg-white px-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-gray-950 dark:text-red-300 dark:hover:bg-red-500/10"
                      onClick={() => onDelete(it.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-6 py-4 text-gray-600 dark:text-gray-300"
                  colSpan={5}
                >
                  Aucun entrepôt.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}