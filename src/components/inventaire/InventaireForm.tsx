"use client";


import React, { useState } from "react";
import { createInventaire, updateInventaire } from "@/lib/inventaire.api";
import { StockInventaire } from "@/types/inventaire";
interface Props {
  item?: StockInventaire;
  editMode?: boolean;
}

export default function InventaireForm({ item, editMode }: Props) {
  const [form, setForm] = useState({
    entrepot_id: item?.entrepot_id || "1",
    emballage_id: item?.emballage_id || "",
    stock_physique: item?.stock_physique || 0,
    date_inventaire: item?.date_inventaire.slice(0, 16) || new Date().toISOString().slice(0, 16),
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editMode && item) {
        await updateInventaire(item.id, { stock_physique: form.stock_physique, date_inventaire: form.date_inventaire });
      } else {
        await createInventaire(form);
      }
      alert("Enregistré avec succès !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-500">Entrepôt</label>
        <input type="text" value={form.entrepot_id} readOnly className="border-b w-full py-2" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500">Emballage</label>
        <input type="text" value={form.emballage_id} onChange={(e) => setForm({ ...form, emballage_id: e.target.value })} className="border-b w-full py-2" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500">Stock Physique</label>
        <input type="number" value={form.stock_physique} onChange={(e) => setForm({ ...form, stock_physique: parseFloat(e.target.value) })} className="border-b w-full py-2" />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500">Date Inventaire</label>
        <input type="datetime-local" value={form.date_inventaire} onChange={(e) => setForm({ ...form, date_inventaire: e.target.value })} className="border-b w-full py-2" />
      </div>
      <button type="submit" disabled={loading} className="bg-[#00A09D] text-white px-4 py-2 rounded">
        {loading ? "Chargement..." : editMode ? "Mettre à jour" : "Créer"}
      </button>
    </form>
  );
}