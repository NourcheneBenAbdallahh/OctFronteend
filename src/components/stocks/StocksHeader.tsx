"use client";

import { LayoutGrid, CheckCircle2, Box } from "lucide-react";

export default function StocksHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      {/* TITRE STYLE CONTRATS */}
      <div className="flex items-center">
        <h1 className="text-[48px] font-black text-[#1C2434] tracking-tighter flex items-center gap-1">
          Stocks<span className="text-[#00A09D]">.</span>
        </h1>
      </div>

   
    </div>
  );
}