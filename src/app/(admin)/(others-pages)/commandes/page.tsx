import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CommandesTable from "@/components/commandes/CommandesTable";
import { listCommandes, normalizeCommande } from "@/lib/commandes.api";
import { listEmballages } from "@/lib/emballages.api";
import { fetchEntrepots } from "@/lib/entrepot.api";
import {
  listFournisseurs
} from "@/lib/fournisseurs.api";

import {normalizeFournisseur } from "@/types/fournisseur";

import { listContrats } from "@/lib/contrats.api";
import { listUnitesMesure } from "@/lib/unites-mesure.api";
import {
  ContratForCommande,
  EmballageOption,
  EntrepotOption,
  FournisseurOption,
  TableCommande,
} from "@/types/commandes";
import type { UniteMesure } from "@/types/unite-mesure";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function CommandesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page || "1");
  const token = await requireServerAccessToken();
  const auth = { token };

  const [
    commandesResult,
    emballagesResult,
    entrepotsResult,
    fournisseursResult,
    contratsResult,
    unitesMesureResult,
  ] = await Promise.all([
    listCommandes(currentPage, 10, auth),
    listEmballages(1, 100, auth),
    fetchEntrepots(auth),
    listFournisseurs(auth),
    listContrats(auth),
    listUnitesMesure(auth),
  ]);

  const rows: TableCommande[] =
    commandesResult.commandes.data.map(normalizeCommande);

  const emballages: EmballageOption[] =
    emballagesResult.emballages.data.map((item: any) => ({
      id: item.id,
      label: `${item.code} - ${item.name}`,
      capacity_unit: item.capacity_unit ?? null,
    }));

  const unitesMesure: UniteMesure[] = unitesMesureResult.unitesMesure ?? [];

  const entrepots: EntrepotOption[] = entrepotsResult.map((item) => ({
    id: item.id,
    label: item.nom,
  }));

  const fournisseurs: FournisseurOption[] =
    fournisseursResult.fournisseurs.map((item: any) => {
      const normalized = normalizeFournisseur(item);
      return {
        id: normalized.id,
        label: normalized.raison_sociale,
      };
    });

  const contrats: ContratForCommande[] = contratsResult.contrats.map((item) => ({
    id: item.id,
    numero_contrat: item.numero_contrat,
    fournisseur_id: item.fournisseur_id,
    emballage_id: item.emballage_id,
    statut: item.statut ?? "ACTIF",
    quantite_contractuelle: Number(item.quantite_contractuelle),
    quantite_realisee: Number(item.quantite_realisee ?? 0),
  }));

  return (
    <div>
      <div className="space-y-6">
          <CommandesTable
            data={rows}
            pagination={commandesResult.commandes.paginatorInfo}
            emballages={emballages}
            unitesMesure={unitesMesure}
            entrepots={entrepots}
            fournisseurs={fournisseurs}
            contrats={contrats}
          />
      </div>
    </div>
  );
}