"use client";

import type { Stock } from "@/types/stock";
import StockCard from "./StockCard";

interface Props {
  rows: Stock[];
  onView?: (stock: Stock) => void;
  onEdit?: (stock: Stock) => void;
  onDelete?: (stock: Stock) => void;
}

export default function StocksCardsView({
  rows,
  onView,
  onEdit,
  onDelete,
}: Props) {
  if (!rows.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-gray-500">
        Aucun mouvement de stock trouvé selon les filtres appliqués.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {rows.map((stock) => (
        <StockCard
          key={stock.id}
          stock={stock}
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}