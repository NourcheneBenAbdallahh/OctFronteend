"use client";

import Link from "next/link";
import {
  CalendarDays,
  User2,
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Eye,
  History,
} from "lucide-react";
import type { Stock } from "@/types/stock";

interface Props {
  stock: Stock;
  onView?: (stock: Stock) => void;
  onViewLot?: (stock: Stock) => void;
}

function formatDate(date?: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMouvementId(stock: Stock) {
  return stock.mouvement_stock_id ?? stock.mouvementStock?.id ?? null;
}

export default function StockCard({ stock, onView, onViewLot }: Props) {
  const isEntree = stock.sens === "entree";
  const mouvementId = getMouvementId(stock);
  const lotId = stock.lot_id ?? stock.lot?.id;

  return (
    <article className="group flex flex-col rounded-[2rem] border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
              isEntree ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
            }`}
          >
            {isEntree ? (
              <ArrowDownToLine className="h-6 w-6" aria-hidden />
            ) : (
              <ArrowUpFromLine className="h-6 w-6" aria-hidden />
            )}
          </div>
          <div className="min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest leading-none text-gray-400 mb-1">
              {isEntree ? "Entrée" : "Sortie"}
            </span>
            <span
              className={`text-2xl font-black leading-none ${
                isEntree ? "text-emerald-600" : "text-orange-600"
              }`}
            >
              {Number(stock.quantite).toLocaleString("fr-FR")}
            </span>
            <span className="mt-1.5 block text-[10px] font-bold uppercase leading-snug text-gray-400">
              Unités · ID #{stock.id}
            </span>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
            isEntree
              ? "border-emerald-100 bg-emerald-50 text-emerald-600"
              : "border-orange-100 bg-orange-50 text-orange-600"
          }`}
        >
          {stock.sens}
        </span>
      </div>

      {lotId ? (
        <button
          type="button"
          onClick={() => onViewLot?.(stock)}
          className="mt-4 line-clamp-1 text-left text-sm font-black uppercase tracking-tight text-[#00A09D] underline-offset-2 transition-colors hover:text-[#007a78] hover:underline"
        >
          Lot {stock.lot?.code_lot || "N/A"}
        </button>
      ) : (
        <h3 className="mt-4 line-clamp-1 text-sm font-black uppercase tracking-tight text-gray-900">
          Lot N/A
        </h3>
      )}
      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-indigo-500">
        {stock.emballage?.name || "Vrac / Aucun"}
      </p>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-50 pt-4 text-[10px] font-bold uppercase tracking-wide text-gray-500">
        <div>
          <dt className="flex items-center gap-1.5 text-[8px] text-gray-400">
            <Warehouse size={10} aria-hidden />
            Entrepôt
          </dt>
          <dd className="mt-0.5 line-clamp-2 font-black normal-case text-gray-900">
            {stock.entrepot?.nom || stock.entrepot?.name || "Non défini"}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[8px] text-gray-400">
            <CalendarDays size={10} aria-hidden />
            Date
          </dt>
          <dd className="mt-0.5 font-black normal-case text-gray-600">
            {formatDate(stock.date_stock)}
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-[8px] text-gray-400">
            <User2 size={10} aria-hidden />
            Auteur
          </dt>
          <dd className="mt-0.5 line-clamp-1 font-black normal-case text-gray-600">
            {stock.user?.name || "Système"}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex justify-end gap-2 border-t border-gray-50 pt-4 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        {mouvementId ? (
          <Link
            href={`/mouvements?focus=${mouvementId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-100 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm transition-all hover:border-[#00A09D]/30 hover:text-[#00A09D]"
          >
            <History size={14} aria-hidden />
            Mouvement
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => onView?.(stock)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 shadow-sm transition-all hover:border-[#00A09D]/30 hover:text-[#00A09D]"
          aria-label="Voir le détail"
        >
          <Eye size={14} />
        </button>
      </div>
    </article>
  );
}
