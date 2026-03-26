import LotsClient from "@/components/lots/LotsClient";
import { getLots } from "@/lib/lot.api";
import type { Lot } from "@/types/lot";

export default async function LotsPage() {
  let lots: Lot[] = [];

  try {
    lots = await getLots(1, 50);
  } catch (error) {
    console.error("Failed to load lots:", error);
  }

  return (
 <div className="space-y-6">
      
      <div className="mt-8">       
         <LotsClient initialLots={lots} />
    </div>   
     </div>

  );
}