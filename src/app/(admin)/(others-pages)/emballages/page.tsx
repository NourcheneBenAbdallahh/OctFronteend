"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { listEmballages } from "@/lib/emballages.api";
import EmballagesTable from "@/components/emballages/EmballagesTable";
import { TableEmballages, normalizeEmballages } from "@/types/emballage";

export default function EmballagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const pageParam = searchParams?.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const limit = 10;

  const [emballages, setEmballages] = useState<TableEmballages[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Utilisation de useCallback pour éviter de recréer la fonction à chaque render
  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await listEmballages(page, limit);
      // Vérification de la structure de réponse pour éviter les crashs
      const dataArray = res?.emballages?.data || [];
      const normalized = dataArray.map(normalizeEmballages);
      
      setEmballages(normalized);
      setTotal(res?.emballages?.paginatorInfo?.total || 0);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  const handlePageChange = (newPage: number) => {
    // Utilisation de scroll: false pour éviter le saut de page désagréable
    router.push(`/emballages?page=${newPage}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      
      <div className="mt-8">
        <div className={`transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
          <EmballagesTable
            data={emballages}
            total={total}
            page={currentPage}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </div>

     
        {loading && emballages.length === 0 && (
          <div className="flex h-64 items-center justify-center">
             <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Synchronisation...</span>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}