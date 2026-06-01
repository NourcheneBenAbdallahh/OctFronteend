"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { computeViewportAnchoredDropdown } from "@/lib/dropdownViewportPosition";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type FilterBarSelectOption = { value: string; label: string };

const defaultTriggerClass =
  "h-11 shrink-0 min-w-[168px] max-w-[220px] pl-10 pr-10 rounded-full border border-gray-100 bg-white text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none shadow-sm transition-all hover:border-[#00A09D]/30 focus:border-[#00A09D] focus:ring-2 focus:ring-[#00A09D]/15";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: FilterBarSelectOption[];
  placeholder: string;
  ariaLabel: string;
  icon?: ReactNode;
  triggerClassName?: string;
};

/**
 * Select pill pour barres de filtres : liste scrollable avec scrollbar OCT (pas le menu natif OS).
 */
export function FilterBarSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
  icon,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pop, setPop] = useState<ReturnType<typeof computeViewportAnchoredDropdown> | null>(
    null
  );
  const portalDomId = `filter-bar-select-${useId().replace(/:/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);

  const allOptions: FilterBarSelectOption[] = [
    { value: "", label: placeholder },
    ...options,
  ];
  const selected = allOptions.find((o) => o.value === value) ?? allOptions[0];

  const updatePopPos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    setPop(computeViewportAnchoredDropdown(el.getBoundingClientRect(), { minPanelHeight: 120 }));
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePopPos();
  }, [open, updatePopPos, options.length]);

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
      if (document.getElementById(portalDomId)?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, portalDomId]);

  const dropdown =
    open &&
    pop && (
      <div
        id={portalDomId}
        className="fixed z-[1200] flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/40 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: pop.left,
          width: Math.max(pop.width, 168),
          maxWidth: "min(100vw - 1rem, 20rem)",
          maxHeight: pop.maxHeight,
          ...(pop.placement === "below" ? { top: pop.top } : { bottom: pop.bottom }),
        }}
        role="listbox"
        aria-label={ariaLabel}
        onWheel={(e) => e.stopPropagation()}
      >
        <ul className="unite-mesure-picker-scroll min-h-0 flex-1 p-1.5">
          {allOptions.map((o) => (
            <li key={o.value || "__all__"}>
              <button
                type="button"
                role="option"
                aria-selected={value === o.value}
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full rounded-xl px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider transition-colors",
                  value === o.value
                    ? "bg-[#00A09D]/10 text-[#007a78]"
                    : "text-gray-600 hover:bg-[#00A09D]/8"
                )}
              >
                <span className="line-clamp-2 break-words">{o.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div ref={rootRef} className="relative shrink-0">
      {icon ? (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#00A09D]">
          {icon}
        </span>
      ) : null}
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          defaultTriggerClass,
          "flex w-full items-center justify-between gap-2 text-left",
          open && "border-[#00A09D] ring-2 ring-[#00A09D]/15",
          triggerClassName
        )}
      >
        <span className="min-w-0 flex-1 truncate">{selected.label}</span>
      </button>
      <ChevronDown
        size={12}
        className={cn(
          "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 transition-transform",
          open && "rotate-180 text-[#00A09D]"
        )}
        aria-hidden
      />
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
