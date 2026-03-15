"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
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

  // Charger les données quand la page change
  useEffect(() => {
    fetchData(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (newPage: number) => {
    router.push(`/emballages?page=${newPage}`);
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Emballages" />
        <div className="space-y-6">
          <ComponentCard title="Emballages List">
            <div className="flex h-64 items-center justify-center">
              <div className="text-[#00A09D] font-bold animate-pulse uppercase tracking-widest">
                Chargement...
              </div>
            </div>
          </ComponentCard>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Emballages" />
      <div className="space-y-6">
        <ComponentCard title="Emballages List">
          <EmballagesTable
            data={emballages}
            total={total}
            page={currentPage}
            limit={limit}
            onPageChange={handlePageChange}
          />
        </ComponentCard>
      </div>
    </div>
  );
}

