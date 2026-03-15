import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FournisseursTable from "@/components/fournisseurs/FournisseursTable";
import {
  listFournisseurs,
  normalizeFournisseur,
  TableFournisseur,
} from "@/lib/fournisseurs.api";

export default async function FournisseursPage() {
  const result = await listFournisseurs();
  const rows: TableFournisseur[] = result.fournisseurs.map(normalizeFournisseur);

  return (
    <div className="p-6">
      <PageBreadcrumb pageTitle="Gestion des Partenaires" />
      <div className="mt-8">
         <FournisseursTable data={rows} />
      </div>
    </div>
  );
}