import FacturesTable from "@/components/factures/FacturesTable";
import { listFactures, normalizeFacture } from "@/lib/factures.api";
import { listBonLivraisons } from "@/lib/bon-livraisons.api"; 
// Importe le type depuis la source attendue par le composant FacturesTable
import { BonLivraisonOption } from "@/types/bon-livraison";
import { TableFacture } from "@/types/facture";

type PageProps = {
  searchParams?: Promise<{
    page?: string;
  }>;
};

export default async function FacturesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentPage = Number(params?.page || "1");

  const [facturesResult, blResult] = await Promise.all([
    listFactures(currentPage),
    listBonLivraisons(1, 100), 
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
    })
  );

  return (
    <div className="p-6">
      {/* Tu peux ajouter un PageBreadcrumb ici si nécessaire */}
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