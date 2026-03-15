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
    <div className="p-4 md:p-6 bg-[#F6F8FA] min-h-screen">
      <LotsClient initialLots={lots} />
    </div>
  );
}