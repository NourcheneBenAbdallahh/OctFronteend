"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Hint under the table on narrow screens */
  showScrollHint?: boolean;
};

/**
 * Horizontal scroll container for data tables on small viewports.
 * Parent layouts should use min-w-0 on flex children so overflow can scroll.
 */
export function ResponsiveTableWrap({
  children,
  className = "",
  showScrollHint = true,
}: Props) {
  return (
    <div className={`relative w-full min-w-0 ${className}`.trim()}>
      <div className="table-scroll-x w-full min-w-0">{children}</div>
      {showScrollHint ? (
        <p
          className="pointer-events-none px-4 pb-3 pt-2 text-center text-[9px] font-bold uppercase tracking-widest text-gray-400 sm:hidden"
          aria-hidden
        >
          Glisser pour voir toutes les colonnes
        </p>
      ) : null}
    </div>
  );
}
