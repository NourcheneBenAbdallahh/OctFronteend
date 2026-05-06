import FacturesTable from "@/components/factures/FacturesTable";
import { listFactures, normalizeFacture } from "@/lib/factures.api";
import { listBonLivraisons } from "@/lib/bon-livraisons.api";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
// Importe le type depuis la source attendue par le composant FacturesTable
import { BonLivraisonOption, TableFacture } from "@/types/facture";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function FacturesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page || "1");
  const token = await requireServerAccessToken();
  const auth = { token };

  const [facturesResult, blResult] = await Promise.all([
    listFactures(currentPage, auth),
    listBonLivraisons(1, 10000, auth),
  ]);

  const rows: TableFacture[] = facturesResult.factures.data.map(normalizeFacture);

  // Mapping rigoureux pour correspondre au type BonLivraisonOption du fichier central
  const bonsLivraisonOptions: BonLivraisonOption[] = blResult.bonLivraisons.data.map(
    (item: any) => ({
      id: item.id,
      numero_bl: item.numero_bl,
      quantite_recue: Number(item.quantite_recue),
      date_reception: item.date_reception,
      // On s'assure que numero_commande est bien mappé depuis l'API
      numero_commande: item.numero_commande || "N/A",
      // Ajout des champs nécessaires pour le filtrage et la validation
      commande_id: item.commande_id,
      is_factured: item.is_factured,
      // Ajout des données de commande (sans prix_unitaire pour éviter l'erreur GraphQL)
      commande: item.commande ? {
        id: item.commande.id,
        numero_commande: item.commande.numero_commande,
        prix_unitaire: 0 // Valeur par défaut, sera calculé différemment
      } : undefined
    })
  );

  return (
    <div >
      <div className="mt-8">         
        <FacturesTable
            data={rows}
            pagination={facturesResult.factures.paginatorInfo}
            bonsLivraison={bonsLivraisonOptions} 
          />
      </div>
    </div>
  );
}