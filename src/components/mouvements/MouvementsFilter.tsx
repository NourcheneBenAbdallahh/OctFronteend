import React from "react";

interface Props {
  search: string;
  setSearch: (s: string) => void;
  total: number;
}

export default function MouvementsFilter({ search, setSearch, total }: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="relative w-full sm:w-96">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un code, lot, entrepôt..."
          className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all dark:bg-gray-900 dark:border-gray-800"
        />
      </div>
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-500">
        Total: {total}
      </div>
    </div>
  );
}