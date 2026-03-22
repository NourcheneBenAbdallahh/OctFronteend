import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BonLivraisonsTable from "@/components/bon-livraisons/BonLivraisonsTable";
import {
  listBonLivraisons,
  normalizeBonLivraison,
} from "@/lib/bon-livraisons.api";
import { listEmballages } from "@/lib/emballages.api";
import { listCommandes } from "@/lib/commandes.api";
import { fetchEntrepots } from "@/lib/entrepot.api";
import {
  CommandeOption,
  EmballageOption,
  EntrepotOption,
  TableBonLivraison,
} from "@/types/bon-livraison";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function BonLivraisonsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page || "1");

  const [
    bonLivraisonsResult,
    emballagesResult,
    commandesResult,
    entrepotsResult,
  ] = await Promise.all([
    listBonLivraisons(currentPage),
    listEmballages(1, 100),
    listCommandes(1, 100),
    fetchEntrepots(),
  ]);

  const rows: TableBonLivraison[] =
    bonLivraisonsResult.bonLivraisons.data.map(normalizeBonLivraison);

  const emballages: EmballageOption[] =
    emballagesResult.emballages.data.map((item: any) => ({
      id: item.id,
      label: `${item.code} - ${item.name}`,
    }));
  const commandes: CommandeOption[] =
    commandesResult.commandes.data.map((item: any) => ({
      id: item.id,
      numero_commande: item.numero_commande,
      quantite: item.quantite,
      emballage_id: item.emballage_id,
      entrepot_id: item.entrepot_id,
      statut: item.statut,
    }));

  const entrepots: EntrepotOption[] = entrepotsResult.map((item) => ({
    id: item.id,
    label: item.nom || `Entrepot #${item.id}`,
  }));
console.log(commandes);

  return (
    <div>
      <PageBreadcrumb pageTitle="Bon de livraison" />
      <div className="space-y-6">
          <BonLivraisonsTable
            data={rows}
            pagination={bonLivraisonsResult.bonLivraisons.paginatorInfo}
            emballages={emballages}
            commandes={commandes}
            entrepots={entrepots}
          />
      </div>
    </div>
  );
}