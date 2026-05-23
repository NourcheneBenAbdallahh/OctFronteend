/** Date locale `YYYY-MM-DD` pour les champs `<input type="date">`. */
export function formatDateInputLocal(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * La date de livraison prévue doit être aujourd'hui ou dans le futur
 * (aligné sur CommandeService backend).
 */
export function isDateLivraisonPrevueValide(
  dateStr: string,
  referenceDate: Date = new Date()
): boolean {
  const trimmed = dateStr.trim();
  if (!trimmed) return false;

  const parts = trimmed.split("-").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return false;
  }

  const [year, month, day] = parts;
  const planned = new Date(year, month - 1, day);
  const ref = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );

  return planned.getTime() >= ref.getTime();
}

export const MESSAGE_DATE_LIVRAISON_PASSEE =
  "La date de livraison prévue ne peut pas être antérieure à aujourd'hui.";
