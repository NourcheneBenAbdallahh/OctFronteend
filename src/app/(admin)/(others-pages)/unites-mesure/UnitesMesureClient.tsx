"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import type { UniteMesure } from "@/types/unite-mesure";
import UnitesMesureTable from "@/components/unites-mesure/UnitesMesureTable";

export default function UnitesMesureClient() {
  const token = useAuthStore((s) => s.token);
  const [rows, setRows] = useState<UniteMesure[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await listUnitesMesure({ token });
      setRows(res.unitesMesure ?? []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      <div className="mt-8">
        <div className={`transition-opacity duration-300 ${loading ? "opacity-50 pointer-events-none" : "opacity-100"}`}>
          <UnitesMesureTable data={rows} onRefresh={fetchData} />
        </div>

        {loading && rows.length === 0 && (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Synchronisation…</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
