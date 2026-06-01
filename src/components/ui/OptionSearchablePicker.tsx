"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  computeViewportAnchoredDropdown,
  type ViewportAnchoredDropdown,
} from "@/lib/dropdownViewportPosition";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type OptionSearchableRow = {
  id: string | number;
  label: string;
};

function toRows(items: OptionSearchableRow[]) {
  return items.map((e) => {
    const id = String(e.id);
    const label = e.label ?? "";
    return { id, label, searchText: `${label} ${id}`.toLowerCase() };
  });
}

/**
 * Liste avec recherche, zone scrollable et portail (drawers overflow).
 */
export function OptionSearchablePicker({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  disabled,
  searchPlaceholder = "Rechercher…",
  noResultsText = "Aucun résultat",
  emptyOptionsText = "Aucune option disponible",
  listMaxHeightClassName = "",
  dropdownZClassName = "z-[1200]",
  /** Classes pour l’option sélectionnée (ex. indigo pour commande, teal ailleurs) */
  selectedOptionClassName,
  accentVariant = "indigo",
  triggerClassName,
}: {
  value: string;
  onChange: (id: string) => void;
  options: OptionSearchableRow[];
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  noResultsText?: string;
  emptyOptionsText?: string;
  listMaxHeightClassName?: string;
  dropdownZClassName?: string;
  selectedOptionClassName?: string;
  accentVariant?: "indigo" | "teal";
  triggerClassName?: string;
}) {
  const isTeal = accentVariant === "teal";
  const resolvedSelectedClassName =
    selectedOptionClassName ??
    (isTeal
      ? "bg-[#00A09D]/10 text-[#007a78] dark:text-[#00A09D]"
      : "bg-indigo-600/10 text-indigo-800");
  const optionHoverClassName = isTeal ? "hover:bg-[#00A09D]/8" : "hover:bg-indigo-50/60";
  const scrollListClassName = isTeal ? "unite-mesure-picker-scroll" : "role-picker-scroll";
  const searchFocusClassName = isTeal
    ? "focus:border-[#00A09D] focus:ring-2 focus:ring-[#00A09D]/15"
    : "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15";
  const chevronOpenClassName = isTeal ? "text-[#00A09D]" : "text-indigo-600";
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pop, setPop] = useState<ViewportAnchoredDropdown | null>(null);
  const portalDomId = `opt-picker-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const rows = useMemo(() => toRows(options), [options]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;
    return rows.filter((o) => o.searchText.includes(qq));
  }, [rows, q]);

  const updatePopPos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    setPop(computeViewportAnchoredDropdown(el.getBoundingClientRect(), { minPanelHeight: 140 }));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePopPos();
  }, [open, updatePopPos, filtered.length, q]);

  useEffect(() => {
    if (!open) return;
    const onWin = () => updatePopPos();
    window.addEventListener("scroll", onWin, true);
    window.addEventListener("resize", onWin);
    return () => {
      window.removeEventListener("scroll", onWin, true);
      window.removeEventListener("resize", onWin);
    };
  }, [open, updatePopPos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      const portal = document.getElementById(portalDomId);
      if (portal?.contains(t)) return;
      setOpen(false);
      setQ("");
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, portalDomId]);

  const selected = rows.find((o) => o.id === value);

  const defaultTriggerClass = isTeal
    ? "rounded-[20px] border-2 border-transparent bg-[#F8FAFA] p-4 text-sm font-bold text-gray-800 shadow-none outline-none transition-all hover:bg-white focus:border-[#00A09D] focus:bg-white focus:ring-3 focus:ring-[#00A09D]/10 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 dark:focus:border-[#00A09D]"
    : "rounded-2xl border-2 border-gray-100 bg-gray-50/90 p-4 text-sm font-black text-gray-900 outline-none transition-all hover:border-indigo-200 hover:bg-white focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 shadow-sm";
  const triggerClass = cn(defaultTriggerClass, triggerClassName);

  const dropdown =
    open &&
    pop && (
      <div
        id={portalDomId}
        className={cn(
          "fixed flex flex-col overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-2xl shadow-gray-200/50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150",
          dropdownZClassName
        )}
        style={{
          left: pop.left,
          width: pop.width,
          maxWidth: "min(100vw - 1rem, 28rem)",
          maxHeight: pop.maxHeight,
          ...(pop.placement === "below" ? { top: pop.top } : { bottom: pop.bottom }),
        }}
        role="listbox"
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-gray-100 bg-gradient-to-b from-gray-50 to-white p-2.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className={cn(
                "w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold text-[#1C2434] outline-none placeholder:text-gray-400",
                searchFocusClassName
              )}
              autoFocus
            />
          </div>
        </div>
        <ul
          className={cn(
            scrollListClassName,
            "unite-mesure-picker-scroll min-h-0 flex-1 p-1.5",
            listMaxHeightClassName
          )}
        >
          {rows.length === 0 ? (
            <li className="rounded-xl px-3 py-5 text-center text-sm font-semibold text-gray-400">
              {emptyOptionsText}
            </li>
          ) : filtered.length === 0 ? (
            <li className="rounded-xl px-3 py-5 text-center text-sm font-semibold text-gray-400">
              {noResultsText}
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
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    value === o.id
                      ? resolvedSelectedClassName
                      : cn("text-[#1C2434]", optionHoverClassName)
                  )}
                >
                  <span className="line-clamp-2 break-words">{o.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    );

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
          triggerClass,
          "flex w-full min-h-[3.25rem] items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed border-gray-50 bg-gray-100/80 opacity-60 hover:border-gray-50 hover:bg-gray-100/80"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && "text-gray-400 font-semibold"
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-gray-400 transition-transform",
            open && cn("rotate-180", chevronOpenClassName)
          )}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
