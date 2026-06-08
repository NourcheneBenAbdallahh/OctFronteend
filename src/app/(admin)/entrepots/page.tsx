"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchEntrepots,
  createEntrepot,
  updateEntrepot,
  type Entrepot,
} from "@/lib/entrepot.api";
import { EntrepotsListView } from "@/components/entrepot/EntrepotsListView";
import { EntrepotSkeleton } from "@/components/entrepot/EntrepotSkeleton";
import EntrepotsFormModal from "@/components/entrepot/EntrepotsFormModal";
import { EntrepotsHeader } from "@/components/entrepot/EntrepotsHeader";
import { Search, Filter, AlertTriangle } from "lucide-react";
import { AppFeedbackBanner } from "@/components/ui/feedback";
import { getActionErrorMessage, useAppFeedback } from "@/hooks/useAppFeedback";

// Pagination locale, même logique que ton template Contrat
const LocalPagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) => (
  <div className="flex items-center gap-4">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Précédent
    </button>

    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-x px-6 border-gray-100">
      Page {currentPage} sur {totalPages}
    </div>

    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
    >
      Suivant
    </button>
  </div>
);

export default function EntrepotsPage() {
  return (
    <Suspense fallback={<EntrepotSkeleton />}>
      <EntrepotsPageContent />
    </Suspense>
  );
}

/** Hauteur utile sous AppHeader (padding layout annulé par -m-4 / -m-6). */
const PAGE_SHELL_CLASS =
  "flex min-h-0 flex-col overflow-hidden bg-[#F0F4F4] -mx-4 -mt-4 mb-0 h-[calc(100dvh-7.25rem)] max-lg:h-[calc(100dvh-8.5rem)] lg:h-[calc(100dvh-5.25rem)] md:-mx-6 md:-mt-6";

function EntrepotsPageContent() {
  const searchParams = useSearchParams();
  const focusId = searchParams.get("focus");
  const [items, setItems] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Entrepot | null>(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "CRITICAL">("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [focusPinned, setFocusPinned] = useState(Boolean(focusId));
  const [prevFocusId, setPrevFocusId] = useState(focusId);

  if (focusId !== prevFocusId) {
    setPrevFocusId(focusId);
    setFocusPinned(Boolean(focusId));
  }
  const itemsPerPage = 8;
  const { feedback, showSuccess, showError, clearFeedback } = useAppFeedback();

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

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch =
        it.nom?.toLowerCase().includes(search.toLowerCase()) ||
        it.adresse?.toLowerCase().includes(search.toLowerCase());

      const occupation = it.capacite_totale
        ? ((Number(it.capacite_totale) - Number(it.capacite_disponible)) /
            Number(it.capacite_totale)) *
          100
        : 0;

      const isCritical = filterType === "CRITICAL" ? occupation > 80 : true;

      return matchesSearch && isCritical;
    });
  }, [items, search, filterType]);

  const focusTargetPage = useMemo(() => {
    if (!focusId) return null;
    const targetIndex = filteredItems.findIndex(
      (it) => String(it.id) === String(focusId)
    );
    if (targetIndex === -1) return null;
    return Math.floor(targetIndex / itemsPerPage) + 1;
  }, [focusId, filteredItems, itemsPerPage]);

  const activePage =
    focusPinned && focusTargetPage !== null ? focusTargetPage : currentPage;

  useEffect(() => {
    if (!focusId || focusTargetPage === null) return;

    const timer = window.setTimeout(() => {
      const el = document.getElementById(`entrepot-card-${focusId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [focusId, focusTargetPage, activePage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (activePage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, activePage, itemsPerPage]);

  // Reset pagination quand filtre/recherche change
  useEffect(() => {
    setFocusPinned(false);
    setCurrentPage(1);
  }, [search, filterType]);

  const handleSave = async (formData: Partial<Entrepot>) => {
    try {
      if (editingItem) {
        await updateEntrepot({ id: editingItem.id, ...formData });
        showSuccess("Entrepôt modifié.");
      } else {
        await createEntrepot(formData as any);
        showSuccess("Entrepôt créé.");
      }
      setIsModalOpen(false);
      setEditingItem(null);
      loadData();
    } catch (error) {
      console.error(error);
      showError(getActionErrorMessage(error, "Erreur lors de l'enregistrement."));
    }
  };

  return (
    <div className={PAGE_SHELL_CLASS}>
      <div className="shrink-0 px-8 pt-4">
        <AppFeedbackBanner feedback={feedback} onDismiss={clearFeedback} />
      </div>
      <div className="shrink-0">
        <EntrepotsHeader
          count={items.length}
          onAdd={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
        />
      </div>

      <div className="shrink-0 px-8 pb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#00A09D] transition-colors"
            size={18}
          />
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
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${
              filterType === "ALL"
                ? "bg-gray-900 text-white shadow-lg"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Tous les sites
          </button>

          <button
            onClick={() => setFilterType("CRITICAL")}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
              filterType === "CRITICAL"
                ? "bg-red-500 text-white shadow-lg"
                : "text-gray-400 hover:text-red-500"
            }`}
          >
            <AlertTriangle size={14} />
            Saturation (+80%)
          </button>
        </div>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-2">
        {loading ? (
          <EntrepotSkeleton />
        ) : filteredItems.length > 0 ? (
          <EntrepotsListView
            rows={paginatedItems}
            focusedId={focusId}
            onEdit={(it) => {
              setEditingItem(it);
              setIsModalOpen(true);
            }}
          />
        ) : (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <Filter className="text-gray-300" size={32} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Aucun entrepôt ne correspond à vos critères
            </p>
          </div>
        )}
      </div>

      {!loading && filteredItems.length > 0 && totalPages > 1 ? (
        <div className="shrink-0 mx-2 mb-2 flex items-center justify-center rounded-[2rem] border border-gray-50 bg-white py-4 shadow-sm">
          <LocalPagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setFocusPinned(false);
              setCurrentPage(page);
            }}
          />
        </div>
      ) : null}

      <EntrepotsFormModal
        isOpen={isModalOpen}
        editing={editingItem}
        onSave={handleSave}
        onClose={() => setIsModalOpen(false)}
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e0;
        }
      `}</style>
    </div>
  );
}