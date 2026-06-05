"use client";

import { Lot } from "@/types/lot";
import LotCard from "./LotCard";
import { Inbox } from "lucide-react";
import Pagination from "@/components/tables/Pagination";

interface Props {
  rows: Lot[];
  // Informations de pagination optionnelles (pour ne pas casser le composant s'il n'y en a pas)
  pagination?: {
    currentPage: number;
    lastPage: number;
  };
  onPageChange?: (page: number) => void;
  onView?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

export default function LotsCardsView({
  rows,
  pagination,
  onPageChange,
  onView,
  onDelete,
}: Props) {
  
  // ÉTAT VIDE : Si aucune donnée n'est trouvée
  if (!rows.length) {
    return (
      <div className="bg-white border-4 border-dashed border-gray-100 rounded-[40px] p-20 text-center flex flex-col items-center gap-4 mx-8">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
          <Inbox size={32} />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter">
            Catalogue de lots vide
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">
            Aucun résultat pour cette sélection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-20">
      {/* HEADER DE SECTION DISCRET */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#00A09D]" />
          <span className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em]">
            Vue Catalogue
          </span>
        </div>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {rows.length} Éléments affichés sur cette page
        </span>
      </div>

      {/* GRILLE DE CARTES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {rows.map((lot) => (
          <div 
            key={lot.id} 
            className="transition-all duration-500 hover:-translate-y-2"
          >
            <LotCard
              lot={lot}
              compact
              onView={onView}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>

      {/* BLOC PAGINATION : S'affiche seulement si les données sont présentes */}
      {pagination && onPageChange && (
        <div className="mt-12 py-8 border-t border-gray-50 flex justify-center">
          <div className="bg-white px-6 py-2 rounded-full shadow-sm border border-gray-100">
            <Pagination 
              currentPage={pagination.currentPage} 
              totalPages={pagination.lastPage} 
              onPageChange={onPageChange} 
            />
          </div>
        </div>
      )}
    </div>
  );
}