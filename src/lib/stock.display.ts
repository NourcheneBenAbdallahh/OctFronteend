import type { Stock } from "@/types/stock";
import type { UniteMesure } from "@/types/unite-mesure";
import {
  formatUnitCodeShort,
  resolvePrincipalUnitCode,
  unitCodesEqual,
} from "@/lib/unite-conversion";

export function stockUnitCode(
  stock: Stock,
  unites: UniteMesure[]
): string {
  return resolvePrincipalUnitCode(stock.emballage?.capacity_unit ?? null, unites);
}

export function stockUnitLabel(
  stock: Stock,
  unites: UniteMesure[]
): string {
  const code = stockUnitCode(stock, unites);
  const match = unites.find((u) => unitCodesEqual(u.code, code));
  return match ? `${match.label} (${code})` : formatUnitCodeShort(code);
}

export function formatStockQuantity(
  stock: Stock,
  unites: UniteMesure[],
  options?: { includeLabel?: boolean }
): string {
  const qty = Number(stock.quantite).toLocaleString("fr-FR");
  if (options?.includeLabel) {
    return `${qty} ${stockUnitLabel(stock, unites)}`;
  }
  return `${qty} ${formatUnitCodeShort(stockUnitCode(stock, unites))}`;
}
