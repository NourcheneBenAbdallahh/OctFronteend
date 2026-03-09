"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listEmballages } from "@/lib/emballages.api";
import EmballagesTable from "@/components/emballages/EmballagesTable";
import {TableEmballages ,normalizeEmballages
  } from "@/types/emballage";
export default function EmballagesPage() {
  const searchParams = useSearchParams();
  const pageParam = searchParams?.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;
  const limit = 10;

  const [emballages, setEmballages] = useState<TableEmballages[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchData(page: number) {
    setLoading(true);
    const res = await listEmballages(page, limit);
    const normalized = res.emballages.data.map(normalizeEmballages);
    setEmballages(normalized);
    setTotal(res.emballages.paginatorInfo.total);
    setLoading(false);
  }

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  function handlePageChange(newPage: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("page", newPage.toString());
    window.history.pushState({}, "", url.toString());
    fetchData(newPage);
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Liste des emballages</h1>

      <EmballagesTable
        data={emballages}
        total={total}
        page={currentPage}
        limit={limit}
        onPageChange={handlePageChange}
      />
    </div>
  );
}