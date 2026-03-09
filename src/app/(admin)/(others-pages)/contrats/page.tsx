import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ContratTable from "@/components/contrats/ContratTable";
import { listContrats } from "@/lib/contrats.api";
import { normalizeContrat, TableContrat } from "@/types/contrat";

export default async function ContratsPage() {
  const res = await listContrats();
  const rows = res.contrats.map(normalizeContrat);
  
  return (
    <div>
      <PageBreadcrumb pageTitle="Contrats" />
      <div className="space-y-6">
        <ComponentCard title="Contrats List">
          <ContratTable data={rows} />
        </ComponentCard>
      </div>
    </div>
  );
}
