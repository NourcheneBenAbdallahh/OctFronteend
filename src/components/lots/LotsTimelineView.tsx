"use client";

import { Lot, LotsGroupedByDate } from "@/types/lot";
import LotCard from "./LotCard";
import { CalendarRange, Inbox, History } from "lucide-react";
import Pagination from "@/components/tables/Pagination"; // Import indispensable

interface Props {
  groups: LotsGroupedByDate[];
  // AJOUT : On déclare les props de pagination
  pagination?: {
    currentPage: number;
    lastPage: number;
  };
  onPageChange?: (page: number) => void;
  
  onView?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

export default function LotsTimelineView({
  groups,
  pagination,    // On les récupère ici
  onPageChange,  // Et ici
  onView,
  onDelete,
}: Props) {
  if (!groups.length) {
    return (
      <div className="bg-white border-4 border-dashed border-gray-100 rounded-[40px] p-20 text-center flex flex-col items-center gap-4 mx-8">
        <div className="w-20 h-20 bg-[#F2F7F7] rounded-[32px] flex items-center justify-center text-[#00A09D]">
          <Inbox size={40} />
        </div>
        <div>
          <h3 className="text-xl font-[1000] text-[#1C2434] uppercase tracking-tighter">Aucun lot détecté</h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Le journal des réceptions est vide</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-8 pb-20">
      {/* LA LIGNE DE TEMPS */}
      <div className="absolute left-[58px] top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#00A09D] via-[#DDF2F1] to-transparent rounded-full opacity-60" />

      <div className="space-y-20">
        {groups.map((group) => (
          <div key={group.dateKey} className="relative">
            {/* EN-TÊTE DE GROUPE */}
            <div className="flex items-center gap-8 mb-10 relative z-10">
              <div className="w-16 h-16 rounded-[24px] bg-white border-2 border-gray-100 flex items-center justify-center shadow-xl shadow-gray-100 group transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#F2F7F7] flex items-center justify-center text-[#00A09D]">
                   <CalendarRange size={22} />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-[1000] text-[#1C2434] uppercase tracking-tighter">
                    {group.label}
                  </h2>
                  <span className="px-4 py-1.5 bg-[#F2F7F7] text-[#00A09D] text-[10px] font-[1000] uppercase tracking-[0.2em] rounded-full border border-[#DDF2F1]">
                    {group.items.length} LOTS
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <History size={12} className="text-gray-300" />
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Mouvements de stock enregistrés
                  </p>
                </div>
              </div>
            </div>

            {/* LISTE DES CARTES DU GROUPE */}
            <div className="pl-24 space-y-8 relative">
              {group.items.map((lot) => (
                <div key={lot.id} className="transition-all duration-500 hover:translate-x-3">
                  <LotCard
                    lot={lot}
                    onView={onView}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AJOUT : Bloc Pagination en bas de la Timeline */}
      {pagination && onPageChange && (
        <div className="mt-20 py-8 border-t border-gray-50 flex justify-center relative z-20">
          <div className="bg-white px-8 py-3 rounded-full shadow-lg border border-gray-100">
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