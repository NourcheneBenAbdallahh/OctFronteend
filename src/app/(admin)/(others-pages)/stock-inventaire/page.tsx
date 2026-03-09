import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import InventaireTable from "@/components/inventaire/InventaireTable";
import InventaireForm from "@/components/inventaire/InventaireForm";
import { listInventaires, normalizeInventaire } from "@/lib/inventaire.api";
import { StockInventaire,TableInventaire } from "@/types/inventaire";
export default async function InventairesPage() {
  let inventaires: TableInventaire[] = [];

  try {
    const result: StockInventaire[] = await listInventaires();
    // On convertit StockInventaire[] -> TableInventaire[]
    inventaires = result.map(normalizeInventaire);
  } catch (e: any) {
    console.error("Erreur lors du chargement des inventaires:", e);
    throw e;
  }

  return (
    <div>
      <PageBreadcrumb pageTitle="Inventaires" />
      <div className="space-y-6">
        <ComponentCard title="Liste des Inventaires">
          <InventaireTable data={inventaires} />
        </ComponentCard>

        <ComponentCard title="Créer / Modifier Inventaire">
          <InventaireForm />
        </ComponentCard>
      </div>
    </div>
  );
}