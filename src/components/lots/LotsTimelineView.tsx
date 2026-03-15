"use client";

import { Lot, LotsGroupedByDate } from "@/types/lot";
import LotCard from "./LotCard";
import { CalendarRange } from "lucide-react";

interface Props {
  groups: LotsGroupedByDate[];
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

export default function LotsTimelineView({
  groups,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (!groups.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-gray-500">
        Aucun lot trouvé selon les filtres appliqués.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[18px] top-0 bottom-0 w-[2px] bg-[#D8F0EF]" />

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.dateKey} className="relative pl-12">
            <div className="absolute left-[8px] top-2 w-5 h-5 rounded-full bg-white border-4 border-[#00A09D]" />

            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-white border border-gray-200 shadow-sm">
                <CalendarRange size={16} className="text-[#00A09D]" />
                <span className="font-semibold text-gray-800">{group.label}</span>
              </div>
              <span className="text-sm text-gray-400">
                {group.items.length} lot(s)
              </span>
            </div>

            <div className="space-y-4">
              {group.items.map((lot) => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}