"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { listEmballages } from "@/lib/emballages.api";
import EmballagesTable from "@/components/emballages/EmballagesTable";
import { TableEmballages, normalizeEmballages } from "@/types/emballage";

export default function EmballagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Lecture de la page depuis l'URL
  const pageParam = searchParams?.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const limit = 10;

  const [emballages, setEmballages] = useState<TableEmballages[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchData(page: number) {
    setLoading(true);
    try {
      const res = await listEmballages(page, limit);
      const normalized = res.emballages.data.map(normalizeEmballages);
      setEmballages(normalized);
      setTotal(res.emballages.paginatorInfo.total);
    } catch (error) {
      console.error("Erreur lors du chargement des emballages:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    // Utilisation de router.push pour une navigation Next.js propre
    router.push(`/emballages?page=${newPage}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F2F5]">
        <div className="text-[#00A09D] font-bold animate-pulse uppercase tracking-widest">
          Chargement des données...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F0F2F5]">
      {/* On passe les props nécessaires au nouveau EmballagesTable */}
      <EmballagesTable
        data={emballages}
        total={total}
        page={currentPage}
        limit={limit}
        onPageChange={handlePageChange}
      />
    </main>
  );
}