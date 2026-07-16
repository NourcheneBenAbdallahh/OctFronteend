import StocksClient from "@/components/stocks/StocksClient";
import { requireServerAccessToken } from "@/lib/requireServerAccessToken";

export default async function StocksPage() {
  await requireServerAccessToken();

  return (
    <div className="space-y-6">
      <div className="mt-8">
        <StocksClient />
      </div>
    </div>
  );
}