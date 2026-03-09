import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FournisseursTable from "@/components/tables/FournisseursTable";
import {
  listFournisseurs,
  normalizeFournisseur,
  TableFournisseur,
} from "@/lib/fournisseurs.api";

export default async function FournisseursPage() {
  const result = await listFournisseurs();

  const rows: TableFournisseur[] =
    result.fournisseurs.map(normalizeFournisseur);

  return (
    <div>
      <PageBreadcrumb pageTitle="Fournisseurs" />
      <div className="space-y-6">
        <ComponentCard title="Fournisseurs List">
          <FournisseursTable data={rows} />
        </ComponentCard>
      </div>
    </div>
  );
}