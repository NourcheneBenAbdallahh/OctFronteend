"use client";

import { Lot } from "@/types/lot";
import LotCard from "./LotCard";

interface Props {
  rows: Lot[];
  onView?: (lot: Lot) => void;
  onEdit?: (lot: Lot) => void;
  onDelete?: (lot: Lot) => void;
}

export default function LotsCardsView({
  rows,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (!rows.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-gray-500">
        Aucun lot trouvé selon les filtres appliqués.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {rows.map((lot) => (
        <LotCard
          key={lot.id}
          lot={lot}
          compact
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}