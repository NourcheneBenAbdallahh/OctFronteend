import StocksClient from "@/components/stocks/StocksClient";
import { getStocks } from "@/lib/stock.api";
import type { Stock } from "@/types/stock";

export default async function StocksPage() {
  let stocks: Stock[] = [];

  try {
    stocks = await getStocks(1, 50);
  } catch (error) {
    console.error("Failed to load stocks:", error);
  }

  return (
    <div className="p-4 md:p-6 bg-[#F6F8FA] min-h-screen">
      <StocksClient initialStocks={stocks} />
    </div>
  );
}