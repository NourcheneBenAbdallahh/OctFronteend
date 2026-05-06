import LotsClient from "@/components/lots/LotsClient";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
import { getLots, type PaginatedLots } from "@/lib/lot.api"; // Importe le type ici

export default async function LotsPage() {
  // 1. On précise le type PaginatedLots ici pour éviter le "never[]"
  let initialData: PaginatedLots = {
    data: [],
    currentPage: 1,
    lastPage: 1,
    total: 0,
    hasMorePages: false
  };

  const token = await requireServerAccessToken();
  const res = await getLots(1, 12, { token });
  initialData = res;

  return (
    <div className="space-y-6">
      <div className="mt-8">      
        <LotsClient 
          initialLots={initialData.data} 
          initialPagination={{
            currentPage: initialData.currentPage,
            lastPage: initialData.lastPage
          }}
        />
      </div>   
    </div>
  );
}