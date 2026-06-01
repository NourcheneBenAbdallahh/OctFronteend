"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { SortDirection } from "@/lib/tableSort";

export type TableSortHeaderProps = {
  sortKey: string | null;
  sortDirection: SortDirection | null;
  onSort: (key: string) => void;
};

type SortableThProps = TableSortHeaderProps & {
  columnKey: string;
  className?: string;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
};

const alignClass = {
  left: "text-left justify-start",
  center: "text-center justify-center",
  right: "text-right justify-end",
} as const;

export function SortableTh({
  columnKey,
  sortKey,
  sortDirection,
  onSort,
  className = "",
  align = "left",
  children,
}: SortableThProps) {
  const isActive = sortKey === columnKey;

  return (
    <th className={className}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex w-full items-center gap-1.5 transition-colors hover:text-gray-700 ${alignClass[align]}`}
        aria-sort={
          isActive
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <span>{children}</span>
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3 w-3 shrink-0 text-[#00A09D]" aria-hidden />
          ) : (
            <ArrowDown className="h-3 w-3 shrink-0 text-[#00A09D]" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 opacity-30" aria-hidden />
        )}
      </button>
    </th>
  );
}
