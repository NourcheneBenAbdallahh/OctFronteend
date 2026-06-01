"use client";

import { useCallback, useMemo, useState } from "react";
import { sortTableRows, type SortColumn, type SortDirection } from "@/lib/tableSort";

export type TableSortState = {
  sortKey: string | null;
  sortDirection: SortDirection | null;
  toggleSort: (key: string) => void;
  resetSort: () => void;
};

export function useTableSort<T>(
  columns: Record<string, SortColumn<T>>,
  options?: { defaultKey?: string; defaultDirection?: SortDirection }
): TableSortState & { sortRows: (rows: T[]) => T[] } {
  const [sortKey, setSortKey] = useState<string | null>(options?.defaultKey ?? null);
  const [sortDirection, setSortDirection] = useState<SortDirection | null>(
    options?.defaultDirection ?? null
  );

  const toggleSort = useCallback((key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection("asc");
      return;
    }
    if (sortDirection === "asc") {
      setSortDirection("desc");
      return;
    }
    setSortKey(null);
    setSortDirection(null);
  }, [sortDirection, sortKey]);

  const resetSort = useCallback(() => {
    setSortKey(null);
    setSortDirection(null);
  }, []);

  const sortRows = useCallback(
    (rows: T[]) => sortTableRows(rows, sortKey, sortDirection, columns),
    [columns, sortDirection, sortKey]
  );

  return useMemo(
    () => ({ sortKey, sortDirection, toggleSort, resetSort, sortRows }),
    [sortKey, sortDirection, toggleSort, resetSort, sortRows]
  );
}
