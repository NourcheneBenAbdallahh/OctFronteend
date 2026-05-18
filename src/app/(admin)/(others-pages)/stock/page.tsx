import StocksClient from "@/components/stocks/StocksClient";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";
import { getStocks } from "@/lib/stock.api";
import type { Stock } from "@/types/stock";

export default async function StocksPage() {
  const token = await requireServerAccessToken();
  const stocks: Stock[] = await getStocks(1, 50, { token });

  return (
 <div className="space-y-6">
      
      <div className="mt-8">      
        <StocksClient initialStocks={stocks} />
    </div> </div>
  );
}