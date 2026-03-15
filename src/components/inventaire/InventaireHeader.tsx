"use client";

import { ClipboardCheck, RefreshCw, ShieldAlert } from "lucide-react";

interface Props {
  loading: boolean;
  onRefresh: () => void;
  total: number;
  criticalCount: number;
}

export default function InventaireHeader({
  loading,
  onRefresh,
  total,
  criticalCount,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-sm bg-[#E8F7F6] border border-[#D7F0EF] flex items-center justify-center">
            <ClipboardCheck className="text-[#00A09D]" size={24} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[28px] font-black tracking-tight text-gray-800 uppercase">
                Stock Inventaire
              </h1>

              {criticalCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-[11px] font-bold uppercase">
                  <ShieldAlert size={12} />
                  {criticalCount} critique{criticalCount > 1 ? "s" : ""}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-green-600 border border-green-200 text-[11px] font-bold uppercase">
                  Stable
                </span>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-1">
              Pilotage visuel des écarts entre stock théorique et stock physique.
            </p>

            <p className="text-[12px] text-gray-400 mt-2">
              Enregistrements suivis : <strong>{total}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>
    </div>
  );
}