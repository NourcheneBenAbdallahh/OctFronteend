"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CommandeOption } from "@/types/bon-livraison";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PopPos = { top: number; left: number; width: number };

function resteCommande(c: CommandeOption): number {
  if (c.reste !== undefined && c.reste !== null) {
    return Number(c.reste);
  }
  return Number(c.quantite) - Number(c.quantite_recue_total ?? 0);
}

function rowLabel(c: CommandeOption) {
  const r = resteCommande(c);
  return `#${c.numero_commande} · reste ${r} · commandé ${c.quantite}`;
}

function rowSearchText(c: CommandeOption) {
  const r = resteCommande(c);
  return `${c.numero_commande} ${c.quantite} ${r} ${c.statut ?? ""}`.toLowerCase();
}

/**
 * Choix de commande avec recherche, liste scrollable (portail au-dessus des drawers).
 */
export function CommandeSearchablePicker({
  value,
  onSelect,
  commandes,
  placeholder = "Rechercher ou choisir une commande…",
  disabled,
  listMaxHeightClassName = "max-h-[min(11rem,36vh)] sm:max-h-44",
  dropdownZClassName = "z-[200]",
}: {
  /** `numero_commande` sélectionné */
  value: string;
  onSelect: (c: CommandeOption) => void;
  commandes: CommandeOption[];
  placeholder?: string;
  disabled?: boolean;
  listMaxHeightClassName?: string;
  dropdownZClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [popPos, setPopPos] = useState<PopPos | null>(null);
  const portalDomId = `commande-bl-picker-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);

  const updatePopPos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const width = Math.min(r.width, window.innerWidth - margin * 2);
    let left = r.left;
    if (left + width > window.innerWidth - margin) {
      left = window.innerWidth - margin - width;
    }
    if (left < margin) left = margin;
    setPopPos({ top: r.bottom + margin, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePopPos();
  }, [open, updatePopPos]);

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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return commandes;
    return commandes.filter((c) => rowSearchText(c).includes(qq));
  }, [commandes, q]);

  const selected = commandes.find((c) => c.numero_commande === value);

  const triggerClass =
    "rounded-2xl border-2 p-4 text-sm font-black outline-none transition-all shadow-sm";

  const dropdown =
    open &&
    popPos && (
      <div
        id={portalDomId}
        className={cn(
          "fixed overflow-hidden rounded-2xl border-2 border-gray-100 bg-white shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150",
          dropdownZClassName
        )}
        style={{
          top: popPos.top,
          left: popPos.left,
          width: popPos.width,
          maxWidth: "min(100vw - 1rem, 28rem)",
        }}
        role="listbox"
      >
        <div className="border-b border-gray-100 bg-gray-50/80 p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="N°, quantité, reste…"
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
            <li className="rounded-xl px-3 py-4 text-center text-sm font-medium text-gray-400">Aucune commande</li>
          ) : (
            filtered.map((c) => (
              <li key={String(c.id)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === c.numero_commande}
                  onClick={() => {
                    onSelect(c);
                    setOpen(false);
                    setQ("");
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    value === c.numero_commande
                      ? "bg-[#00A09D]/10 text-[#00A09D]"
                      : "text-[#1C2434] hover:bg-gray-50"
                  )}
                >
                  <span className="line-clamp-2 break-words">{rowLabel(c)}</span>
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
          "flex w-full items-center justify-between gap-2 border-gray-100 bg-white text-left hover:border-indigo-200",
          value ? "border-indigo-600 bg-indigo-50/20 text-indigo-900" : "border-gray-100 text-gray-400",
          disabled && "cursor-not-allowed opacity-70"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="text-gray-300">#</span>
          <span className={cn("min-w-0 flex-1 truncate", !selected && "font-semibold")}>
            {selected ? rowLabel(selected) : placeholder}
          </span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
