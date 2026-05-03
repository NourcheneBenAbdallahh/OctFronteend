import StocksClient from "@/components/stocks/StocksClient";
import { getServerAccessToken } from "@/lib/getServerAccessToken";
import { getStocks } from "@/lib/stock.api";
import type { Stock } from "@/types/stock";

export default async function StocksPage() {
  let stocks: Stock[] = [];

  try {
    const token = await getServerAccessToken();
    stocks = await getStocks(1, 50, token ? { token } : undefined);
  } catch (error) {
    console.error("Failed to load stocks:", error);
  }

  return (
 <div className="space-y-6">
      
      <div className="mt-8">      
        <StocksClient initialStocks={stocks} />
    </div> </div>
  );
}