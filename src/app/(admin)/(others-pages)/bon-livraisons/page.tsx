import BonLivraisonsTable from "@/components/bon-livraisons/BonLivraisonsTable";
import {
  listBonLivraisons,
  normalizeBonLivraison,
} from "@/lib/bon-livraisons.api";
import { me } from "@/lib/auth.api";
import { listEmballages } from "@/lib/emballages.api";
import { listAllCommandes } from "@/lib/commandes.api";
import { fetchEntrepots } from "@/lib/entrepot.api";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import { canManageBonLivraisons } from "@/lib/access";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
import type { UniteMesure } from "@/types/unite-mesure";
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
  await searchParams;

  const token = await requireServerAccessToken();
  const auth = { token };
  const user = await me(token);
  const readOnly = !canManageBonLivraisons(user?.role);

  const bonLivraisonsResult = await listBonLivraisons(1, 1000, auth);

  let emballages: EmballageOption[] = [];
  let commandes: CommandeOption[] = [];
  let entrepots: EntrepotOption[] = [];
  let unitesMesure: UniteMesure[] = [];

  const [emballagesResult, entrepotsResult, unitesMesureResult] = await Promise.all([
    listEmballages(1, 100, auth),
    fetchEntrepots(auth),
    listUnitesMesure(auth),
  ]);

  emballages = emballagesResult.emballages.data.map((item: any) => ({
    id: item.id,
    label: `${item.code} - ${item.name}`,
    capacity_unit: item.capacity_unit ?? null,
  }));

  unitesMesure = unitesMesureResult.unitesMesure ?? [];

  entrepots = entrepotsResult.map((item) => ({
    id: item.id,
    label: item.nom || `Entrepot #${item.id}`,
  }));

  if (!readOnly) {
    const allCommandes = await listAllCommandes(auth);

    commandes = allCommandes.map((item) => ({
      id: item.id,
      numero_commande: item.numero_commande,
      quantite: item.quantite,
      quantite_recue_total: Number(item.quantite_recue_total ?? 0),
      reste: Number(item.reste ?? 0),
      emballage_id: item.emballage_id,
      entrepot_id: item.entrepot_id,
      statut: item.statut,
    }));
  }

  const rows: TableBonLivraison[] =
    bonLivraisonsResult.bonLivraisons.data.map(normalizeBonLivraison);

  return (
    <div>
      <div className="space-y-6">
        <BonLivraisonsTable
          data={rows}
          pagination={bonLivraisonsResult.bonLivraisons.paginatorInfo}
          emballages={emballages}
          commandes={commandes}
          entrepots={entrepots}
          unitesMesure={unitesMesure}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
