import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import FacturesTable from "@/components/factures/FacturesTable";
import { listFactures, normalizeFacture } from "@/lib/factures.api";
import { listEmballages } from "@/lib/emballages.api";
import { listCommandes } from "@/lib/commandes.api";
import {
  CommandeOption,
  EmballageOption,
  TableFacture,
} from "@/types/facture";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function FacturesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page || "1");

  const [facturesResult, emballagesResult, commandesResult] = await Promise.all([
    listFactures(currentPage),
    listEmballages(1, 100),
    listCommandes(1,100),
  ]);

  const rows: TableFacture[] = facturesResult.factures.data.map(normalizeFacture);

  const emballages: EmballageOption[] = emballagesResult.emballages.data.map(
    (item: any) => ({
      id: item.id,
      label: `${item.code} - ${item.name}`,
    })
  );

  const commandes: CommandeOption[] = commandesResult.commandes.data.map(
    (item: any) => ({
      id: item.id,
      numero_commande: item.numero_commande,
    })
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Factures" />
      <div className="space-y-6">
        <ComponentCard title="Factures List">
          <FacturesTable
            data={rows}
            pagination={facturesResult.factures.paginatorInfo}
            emballages={emballages}
            commandes={commandes}
          />
        </ComponentCard>
      </div>
    </div>
  );
}