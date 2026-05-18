import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ContratTable from "@/components/contrats/ContratTable";
import { listContrats } from "@/lib/contrats.api";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
import { normalizeContrat, TableContrat } from "@/types/contrat";

export default async function ContratsPage() {
  const token = await requireServerAccessToken();
  const res = await listContrats({ token });
  const rows = res.contrats.map(normalizeContrat);
  
  return (
    <div className="p-6">
      <div className="mt-8">
          <ContratTable data={rows} />
      </div>
    </div>
  );
}
