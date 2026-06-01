import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ContratTable from "@/components/contrats/ContratTable";
import { listContrats } from "@/lib/contrats.api";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
import { normalizeContrat } from "@/types/contrat";
import { Suspense } from "react";

export default async function ContratsPage() {
  const token = await requireServerAccessToken();
  const res = await listContrats({ token });
  const rows = res.contrats.map(normalizeContrat);
  
  return (
    <div className="p-6">
      <div className="mt-8">
        <Suspense fallback={<div className="p-8 text-sm text-gray-500">Chargement des contrats…</div>}>
          <ContratTable data={rows} />
        </Suspense>
      </div>
    </div>
  );
}
