/**
 * Format attendu par le scalar GraphQL `DateTime` Lighthouse (`Y-m-d H:i:s`).
 * `Date.toISOString()` (ISO 8601 avec fuseau / millisecondes) est rejeté par l'API.
 */
export function dateToGraphqlDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function dateToGraphqlDateTimeOrNull(
  date?: Date | null
): string | null {
  if (!date) return null;
  return dateToGraphqlDateTime(date);
}
