"use client";

import { useEffect, useState } from "react";
import { 
  fetchEntrepots, 
  createEntrepot, 
  updateEntrepot, 
  type Entrepot 
} from "@/lib/entrepot.api";
import { EntrepotsListView } from "@/components/entrepot/EntrepotsListView";
import { EntrepotSkeleton } from "@/components/entrepot/EntrepotSkeleton";
import EntrepotsFormModal from "@/components/entrepot/EntrepotsFormModal"; // Vérifie bien le chemin
import { Plus, Download } from "lucide-react";

export default function EntrepotsPage() {
  const [items, setItems] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // États pour la gestion de la Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Entrepot | null>(null);

  // Chargement des données
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

  // Fonction pour ouvrir la modal en mode création
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Fonction pour ouvrir la modal en mode édition
  const handleOpenEdit = (item: Entrepot) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Logique de sauvegarde (Create ou Update)
  const handleSave = async (formData: Partial<Entrepot>) => {
    try {
      if (editingItem) {
        // Mode Édition
        await updateEntrepot({ id: editingItem.id, ...formData });
      } else {
        // Mode Création
        await createEntrepot(formData as any);
      }
      setIsModalOpen(false);
      loadData(); // Recharger la liste après succès
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
  };

// EntrepotsPage.tsx (Structure optimisée)
return (
  <div className="flex flex-col h-screen bg-[#F0F2F5] overflow-hidden">
    {/* Barre d'outils fixe en haut */}
    <div className="bg-white border-b border-gray-300 shadow-sm z-20">
      <div className="px-4 py-3 flex flex-col md:flex-row md:items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">Entrepôts</h1>
          <div className="flex gap-1 mt-2">
            <button onClick={handleOpenCreate} className="bg-[#00A09D] text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase shadow-sm hover:bg-[#008784] transition-all">
              Créer
            </button>
            <button className="bg-white text-[#00A09D] border border-gray-300 px-4 py-1.5 rounded-sm text-xs font-bold uppercase hover:bg-gray-50 transition-all">
              Importer
            </button>
          </div>
        </div>
        <div className="hidden md:block text-xs font-medium text-gray-400 uppercase">
          {items.length} entrepôts enregistrés
        </div>
      </div>
    </div>

    {/* Zone de contenu scrollable */}
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {loading ? (
        <EntrepotSkeleton />
      ) : (
        <div className="max-w-[1600px] mx-auto">
          <EntrepotsListView rows={items} onEdit={handleOpenEdit} />
        </div>
      )}
    </div>

    {/* Modal de création/édition */}
    {isModalOpen && (
      <EntrepotsFormModal
        editing={editingItem}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />
    )}
  </div>
);
}
