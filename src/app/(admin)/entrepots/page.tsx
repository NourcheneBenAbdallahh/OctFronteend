"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  fetchEntrepots, 
  createEntrepot, 
  updateEntrepot, 
  type Entrepot 
} from "@/lib/entrepot.api";
import { EntrepotsListView } from "@/components/entrepot/EntrepotsListView";
import { EntrepotSkeleton } from "@/components/entrepot/EntrepotSkeleton";
import EntrepotsFormModal from "@/components/entrepot/EntrepotsFormModal";
import { EntrepotsHeader } from "@/components/entrepot/EntrepotsHeader"; // On utilise le nouveau Header
import { Search, Filter, AlertTriangle } from "lucide-react";

export default function EntrepotsPage() {
  const [items, setItems] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Entrepot | null>(null);
  
  // États de filtrage
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CRITICAL">("ALL");

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchEntrepots();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Logique de filtrage intelligente
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      const matchesSearch = it.nom?.toLowerCase().includes(search.toLowerCase()) || 
                            it.adresse?.toLowerCase().includes(search.toLowerCase());
      
      const occupation = it.capacite_totale ? ((Number(it.capacite_totale) - Number(it.capacite_disponible)) / Number(it.capacite_totale)) * 100 : 0;
      const isCritical = filterType === "CRITICAL" ? occupation > 80 : true;

      return matchesSearch && isCritical;
    });
  }, [items, search, filterType]);

  const handleSave = async (formData: Partial<Entrepot>) => {
    try {
      if (editingItem) {
        await updateEntrepot({ id: editingItem.id, ...formData });
      } else {
        await createEntrepot(formData as any);
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F0F4F4]">
      {/* 1. Header Brutaliste */}
      <EntrepotsHeader 
        count={items.length} 
        onAdd={() => { setEditingItem(null); setIsModalOpen(true); }} 
      />

      {/* 2. Barre de Recherche & Filtres Rapides */}
      <div className="px-8 pb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un site ou une adresse..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-2xl shadow-sm outline-none focus:border-[#00A09D]/20 focus:ring-4 focus:ring-[#00A09D]/5 transition-all text-[11px] font-black uppercase tracking-widest"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <button 
            onClick={() => setFilterType("ALL")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${filterType === "ALL" ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:text-gray-600"}`}
          >
            Tous les sites
          </button>
          <button 
            onClick={() => setFilterType("CRITICAL")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${filterType === "CRITICAL" ? "bg-red-500 text-white shadow-lg" : "text-gray-400 hover:text-red-500"}`}
          >
            <AlertTriangle size={14} />
            Saturation (+80%)
          </button>
        </div>
      </div>

      {/* 3. Contenu (Grille d'entrepôts) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
        {loading ? (
          <EntrepotSkeleton />
        ) : filteredItems.length > 0 ? (
          <EntrepotsListView 
            rows={filteredItems} 
            onEdit={(it) => { setEditingItem(it); setIsModalOpen(true); }} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
             <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Filter className="text-gray-300" size={32} />
             </div>
             <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Aucun entrepôt ne correspond à vos critères</p>
          </div>
        )}
      </div>

      {/* 4. Modal (On utilise la version isOpen) */}
      <EntrepotsFormModal
        isOpen={isModalOpen}
        editing={editingItem}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Style additionnel pour la scrollbar (optionnel) */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #CBD5E0; }
      `}</style>
    </div>
  );
}