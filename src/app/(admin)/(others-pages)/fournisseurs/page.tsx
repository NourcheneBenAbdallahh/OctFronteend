import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FournisseursTable from "@/components/fournisseurs/FournisseursTable";
import {
  listFournisseurs,
} from "@/lib/fournisseurs.api";
import { TableFournisseur,normalizeFournisseur } from "@/types/fournisseur";

export default async function FournisseursPage() {
  const result = await listFournisseurs();
  const rows: TableFournisseur[] = result.fournisseurs.map(normalizeFournisseur);

  return (
    <div className="p-6">
      <div className="mt-8">
        <FournisseursTable data={rows} />
      </div>
    </div>
  );
}