"use client";

import { Boxes, LayoutGrid, Clock3 } from "lucide-react";

interface Props {
  viewMode: "timeline" | "cards";
  onChangeView: (mode: "timeline" | "cards") => void;
}

export default function LotsHeader({
  viewMode,
  onChangeView,
}: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-sm bg-[#E8F7F6] border border-[#CDEEEE] flex items-center justify-center">
              <Boxes className="text-[#00A09D]" size={22} />
            </div>
            <div>
              <h1 className="text-[28px] font-bold tracking-tight text-gray-800">
                Gestion des Lots
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Suivi chronologique des lots générés automatiquement après réception
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-white border border-gray-200 rounded-sm overflow-hidden">
          <button
            onClick={() => onChangeView("timeline")}
            className={`px-4 py-2.5 inline-flex items-center gap-2 text-sm font-medium transition ${
              viewMode === "timeline"
                ? "bg-[#F2F7F7] text-[#00A09D]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Clock3 size={16} />
            Timeline
          </button>

          <button
            onClick={() => onChangeView("cards")}
            className={`px-4 py-2.5 inline-flex items-center gap-2 text-sm font-medium transition border-l border-gray-200 ${
              viewMode === "cards"
                ? "bg-[#F2F7F7] text-[#00A09D]"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <LayoutGrid size={16} />
            Cards
          </button>
        </div>
      </div>
    </div>
  );
}