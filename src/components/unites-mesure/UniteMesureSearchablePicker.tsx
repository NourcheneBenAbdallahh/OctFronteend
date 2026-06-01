"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UniteMesure } from "@/types/unite-mesure";
import {
  computeViewportAnchoredDropdown,
  type ViewportAnchoredDropdown,
} from "@/lib/dropdownViewportPosition";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function toOptions(unites: UniteMesure[]) {
  return unites.map((u) => ({
    id: u.code,
    label: `${u.label} (${u.code})`,
    searchText: `${u.code} ${u.label} ${u.dimension}`,
  }));
}

export function UniteMesureSearchablePicker({
  value,
  onChange,
  unites,
  placeholder,
  disabled,
  variant = "light",
  allowEmpty = true,
  emptyLabel = "— Non renseigné —",
  listMaxHeightClassName = "",
  dropdownZClassName = "z-[1200]",
}: {
  value: string;
  onChange: (code: string) => void;
  unites: UniteMesure[];
  placeholder: string;
  disabled?: boolean;
  variant?: "light" | "dark";
  allowEmpty?: boolean;
  emptyLabel?: string;
  listMaxHeightClassName?: string;
  /** Pour listes dans drawer / modale (au-dessus de z-[1001]). */
  dropdownZClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pop, setPop] = useState<ViewportAnchoredDropdown | null>(null);
  const portalDomId = `unite-mesure-picker-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => toOptions(unites), [unites]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return options;
    return options.filter((o) => o.searchText.toLowerCase().includes(qq));
  }, [options, q]);

  const updatePopPos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    setPop(computeViewportAnchoredDropdown(el.getBoundingClientRect(), { minPanelHeight: 140 }));
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPop(null);
      return;
    }
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

  const selected = options.find((o) => o.id === value);

  const triggerBase =
    variant === "dark"
      ? "rounded-none border-b-2 border-white/10 bg-transparent py-2 text-xl font-black text-white outline-none transition-all focus:border-indigo-400"
      : "rounded-2xl border-2 border-gray-50 bg-gray-50 py-3.5 px-4 text-xs font-black text-gray-900 outline-none transition-all hover:bg-white focus:border-indigo-500/30";

  const dropdown =
    open &&
    pop && (
      <div
        id={portalDomId}
        className={cn(
          "fixed flex flex-col overflow-hidden rounded-2xl border-2 shadow-xl ring-1 animate-in fade-in zoom-in-95 duration-150",
          dropdownZClassName,
          variant === "dark"
            ? "border-[#1C2434] bg-[#1C2434] ring-white/10"
            : "border-gray-100 bg-white ring-black/5"
        )}
        style={{
          left: pop.left,
          width: pop.width,
          maxWidth: "min(100vw - 1rem, 28rem)",
          maxHeight: pop.maxHeight,
          ...(pop.placement === "below" ? { top: pop.top } : { bottom: pop.bottom }),
        }}
        role="listbox"
      >
        <div
          className={cn(
            "shrink-0 border-b p-2",
            variant === "dark" ? "border-white/10 bg-black/20" : "border-gray-100 bg-gray-50/80"
          )}
        >
          <div className="relative">
            <Search
              className={cn(
                "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2",
                variant === "dark" ? "text-white/40" : "text-gray-400"
              )}
              aria-hidden
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher code, libellé, dimension…"
              className={cn(
                "w-full rounded-xl border py-2.5 pl-9 pr-3 text-sm font-semibold outline-none",
                variant === "dark"
                  ? "border-white/15 bg-white/5 text-white placeholder:text-white/35 focus:border-[#00A09D]/50 focus:ring-2 focus:ring-[#00A09D]/20"
                  : "border-gray-200 bg-white text-[#1C2434] placeholder:text-gray-400 focus:border-[#00A09D]/40 focus:ring-2 focus:ring-[#00A09D]/10"
              )}
              autoFocus
            />
          </div>
        </div>
        <ul
          className={cn(
            "unite-mesure-picker-scroll min-h-0 flex-1 p-1.5",
            listMaxHeightClassName
          )}
        >
          {allowEmpty && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={value === ""}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setQ("");
                }}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                  variant === "dark"
                    ? value === ""
                      ? "bg-[#00A09D]/25 text-white"
                      : "text-white/70 hover:bg-white/10"
                    : value === ""
                      ? "bg-[#00A09D]/10 text-[#00A09D]"
                      : "text-gray-500 hover:bg-gray-50"
                )}
              >
                {emptyLabel}
              </button>
            </li>
          )}
          {filtered.length === 0 ? (
            <li
              className={cn(
                "rounded-xl px-3 py-4 text-center text-sm font-medium",
                variant === "dark" ? "text-white/45" : "text-gray-400"
              )}
            >
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
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    variant === "dark"
                      ? value === o.id
                        ? "bg-[#00A09D]/25 text-white"
                        : "text-white/90 hover:bg-white/10"
                      : value === o.id
                        ? "bg-[#00A09D]/10 text-[#00A09D]"
                        : "text-[#1C2434] hover:bg-gray-50"
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
          triggerBase,
          "flex w-full items-center justify-between gap-2 text-left",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !selected && (variant === "dark" ? "text-gray-500 font-bold" : "text-gray-400 font-semibold")
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform",
            variant === "dark" ? "text-white/50" : "text-gray-400",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>

      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
