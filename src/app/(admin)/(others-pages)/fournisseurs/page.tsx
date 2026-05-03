import FournisseursTable from "@/components/fournisseurs/FournisseursTable";
import { getServerAccessToken } from "@/lib/getServerAccessToken";
import {
  listFournisseurs,
} from "@/lib/fournisseurs.api";
import { TableFournisseur,normalizeFournisseur } from "@/types/fournisseur";

export default async function FournisseursPage() {
  const token = await getServerAccessToken();
  const result = await listFournisseurs(token ? { token } : undefined);
  const rows: TableFournisseur[] = result.fournisseurs.map(normalizeFournisseur);

  return (
    <div className="p-6">
      <div className="mt-8">
        <FournisseursTable data={rows} />
      </div>
    </div>
  );
}