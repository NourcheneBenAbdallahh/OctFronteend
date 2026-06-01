"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type MouvementSearchableOption = {
  id: string;
  label: string;
  /** Texte additionnel pour la recherche (ex. code produit) */
  searchText?: string;
};

export function MouvementSearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  triggerClassName,
  disabled,
  listMaxHeightClassName = "max-h-[min(14rem,45vh)] sm:max-h-56",
}: {
  value: string;
  onChange: (id: string) => void;
  options: MouvementSearchableOption[];
  placeholder: string;
  triggerClassName: string;
  disabled?: boolean;
  /** Hauteur max de la zone défilante des options (Tailwind) */
  listMaxHeightClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => {
      const hay = (o.searchText ?? o.label).toLowerCase();
      return hay.includes(qq);
    });
  }, [options, q]);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={rootRef} className="relative min-w-0 max-w-full">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((v) => {
            const next = !v;
            if (!next) setQ("");
            return next;
          });
        }}
        className={cn(
          triggerClassName,
          "flex w-full items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-gray-400 font-normal")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-[120] mt-2 max-w-[min(100%,calc(100vw-2rem))] overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 sm:max-w-none"
          role="listbox"
        >
          <div className="border-b border-gray-100 bg-gray-50/80 p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-[#1C2434] outline-none placeholder:text-gray-400 focus:border-[#00A09D]/40 focus:ring-2 focus:ring-[#00A09D]/10"
                autoFocus
              />
            </div>
          </div>
          <ul
            className={cn(
              "unite-mesure-picker-scroll p-1.5",
              listMaxHeightClassName
            )}
          >
            {filtered.length === 0 ? (
              <li className="rounded-xl px-3 py-4 text-center text-sm font-medium text-gray-400">
                Aucun résultat
              </li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === o.id}
                    onClick={() => {
                      onChange(o.id);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-[#1C2434] transition-colors",
                      value === o.id
                        ? "bg-[#00A09D]/10 text-[#00A09D]"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <span className="line-clamp-2 break-words">{o.label}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
