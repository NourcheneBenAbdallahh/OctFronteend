"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BreadcrumbItem } from "@/lib/breadcrumbs";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function BreadcrumbNav({
  items,
  className,
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <nav aria-label="Fil d'Ariane" className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
            {index > 0 ? (
              <ChevronRight size={12} className="shrink-0 text-gray-300" aria-hidden />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-[#00A09D]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  isLast ? "text-[#00A09D]" : "text-gray-400"
                )}
                aria-current={isLast ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
