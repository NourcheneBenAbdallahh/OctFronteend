"use client";

import type { Stock } from "@/types/stock";
import type { UniteMesure } from "@/types/unite-mesure";
import StockCard from "./StockCard";

interface Props {
  rows: Stock[];
  unitesMesure: UniteMesure[];
  onView?: (stock: Stock) => void;
  onViewLot?: (stock: Stock) => void;
}

export default function StocksCardsView({
  rows,
  unitesMesure,
  onView,
  onViewLot,
}: Props) {
  if (!rows.length) {
    return (
      <div className="bg-white border border-dashed border-gray-300 rounded-sm p-10 text-center text-gray-500">
        Aucun mouvement de stock trouvé selon les filtres appliqués.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((stock) => (
        <StockCard
          key={stock.id}
          stock={stock}
          unitesMesure={unitesMesure}
          onView={onView}
          onViewLot={onViewLot}
        />
      ))}
    </div>
  );
}