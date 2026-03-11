// app/inventaire/page.tsx
"use client";

import { useEffect, useState } from "react";
import { listInventaires, updateInventaire } from "@/lib/inventaire.api";
import InventaireAuditBoard from "@/components/inventaire/InventaireAuditBoard";
import { InventaireStats } from "@/components/inventaire/InventaireStats";
import { Search, Filter, RefreshCw } from "lucide-react";

export default function InventairePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listInventaires();
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleQuickAdjust = async (id: string, newVal: number) => {
    // Logique d'ajustement instantané
    await updateInventaire(id, { stock_physique: newVal });
    load(); // Recharger pour voir l'écart mis à jour
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Ajustement d'Inventaire</h1>
            <p className="text-sm text-gray-400 font-medium">Réconciliation des stocks théoriques et physiques</p>
          </div>
          <button onClick={load} className="p-2 bg-white border border-gray-300 rounded-sm text-gray-500 hover:text-[#00A09D]">
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <InventaireStats data={data} />

        <div className="bg-white p-2 border border-gray-300 border-b-0 rounded-t-sm flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
            <input 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none text-sm outline-none rounded-sm" 
              placeholder="Rechercher un produit ou un entrepôt..." 
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 uppercase hover:bg-gray-100">
            <Filter size={14} /> Filtrer
          </button>
        </div>

        <InventaireAuditBoard data={data} onAdjust={handleQuickAdjust} />
      </div>
    </div>
  );
}