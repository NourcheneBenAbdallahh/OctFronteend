export type SortDirection = "asc" | "desc";

export type SortValueType = "string" | "number" | "date";

export type SortAccessor<T> = (row: T) => string | number | null | undefined;

export type SortColumn<T> = {
  accessor: SortAccessor<T>;
  type?: SortValueType;
};

function isEmpty(value: string | number | null | undefined): boolean {
  return value == null || value === "";
}

function toComparable(
  value: string | number | null | undefined,
  type: SortValueType
): string | number {
  if (isEmpty(value)) {
    return type === "number" || type === "date" ? Number.NaN : "";
  }

  if (type === "date") {
    const time = new Date(String(value)).getTime();
    return Number.isNaN(time) ? Number.NaN : time;
  }

  if (type === "number") {
    const n = Number(value);
    return Number.isNaN(n) ? Number.NaN : n;
  }

  return String(value).toLocaleLowerCase("fr");
}

export function compareSortValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  type: SortValueType = "string"
): number {
  const aEmpty = isEmpty(a);
  const bEmpty = isEmpty(b);
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;

  const left = toComparable(a, type);
  const right = toComparable(b, type);

  if (typeof left === "number" && typeof right === "number") {
    if (Number.isNaN(left) && Number.isNaN(right)) return 0;
    if (Number.isNaN(left)) return 1;
    if (Number.isNaN(right)) return -1;
    return left - right;
  }

  return String(left).localeCompare(String(right), "fr", { sensitivity: "base" });
}

export function sortTableRows<T>(
  rows: T[],
  sortKey: string | null,
  direction: SortDirection | null,
  columns: Record<string, SortColumn<T>>
): T[] {
  if (!sortKey || !direction) return rows;

  const column = columns[sortKey];
  if (!column) return rows;

  const type = column.type ?? "string";
  const sorted = [...rows].sort((rowA, rowB) => {
    const cmp = compareSortValues(column.accessor(rowA), column.accessor(rowB), type);
    return direction === "asc" ? cmp : -cmp;
  });

  return sorted;
}
