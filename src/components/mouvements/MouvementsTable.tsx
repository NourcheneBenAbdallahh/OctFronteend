"use client";
import React from "react";
import Button from "@/components/ui/button/Button";
import { MouvementStock } from "@/types/mouvement";
import { TYPES, formatEmballageLabel } from "./utils";

interface Props {
  items: MouvementStock[];
  loading: boolean;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function MouvementsTable({ items, loading, onValidate, onDelete }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] uppercase tracking-widest text-gray-400 font-black">
              <th className="px-6 py-4">Mouvement</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Produit/Lot</th>
              <th className="px-6 py-4">Flux</th>
              <th className="px-6 py-4">Quantité</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">Synchronisation des données...</td></tr>
            ) : items.map(m => (
              <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs font-bold text-[#00A09D]">{m.code_mouvement ?? `#${m.id}`}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${TYPES.find(t => t.value === m.type_mouvement)?.color}`}>
                    {m.type_mouvement}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${m.statut === "VALIDE" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {m.statut}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-bold text-gray-700 dark:text-gray-200">{formatEmballageLabel(m.emballage)}</div>
                  <div className="text-[10px] text-gray-400 font-medium">Lot: {m.lot?.code_lot || "N/A"}</div>
                </td>
                <td className="px-6 py-4 text-[11px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-red-400">De: {m.entrepotSource?.adresse || "-"}</span>
                    <span className="text-emerald-500">Vers: {m.entrepotDestination?.adresse || "-"}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{m.quantite}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    {m.statut !== "VALIDE" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => onValidate(m.id)} className="text-emerald-600 border-emerald-100 hover:bg-emerald-50">Valider</Button>
                        <Button variant="outline" size="sm" onClick={() => onDelete(m.id)} className="text-red-500 border-red-100 hover:bg-red-50">Supprimer</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}