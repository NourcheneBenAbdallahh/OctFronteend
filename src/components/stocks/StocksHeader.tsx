"use client";

import { Boxes, LayoutGrid } from "lucide-react";

export default function StocksHeader() {
  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-sm px-6 py-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-sm bg-[#E8F7F6] border border-[#CDEEEE] flex items-center justify-center">
            <Boxes className="text-[#00A09D]" size={22} />
          </div>

          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-gray-800">
              Gestion du Stock
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Consultation et administration des mouvements de stock générés par les lots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-sm border border-gray-200 bg-[#F2F7F7] text-[#00A09D] text-sm font-medium">
          <LayoutGrid size={16} />
          Vue analytique
        </div>
      </div>
    </div>
  );
}