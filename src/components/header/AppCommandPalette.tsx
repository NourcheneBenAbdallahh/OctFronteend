"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { filterNavSearchItems, searchableNavForRole } from "@/lib/appNav";
import { useAuthStore } from "@/store/useAuthStore";

type Props = {
  open: boolean;
  onClose: () => void;
};

type PaletteBodyProps = {
  onClose: () => void;
};

function CommandPaletteBody({ onClose }: PaletteBodyProps) {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo(() => searchableNavForRole(role), [role]);
  const filtered = useMemo(
    () => filterNavSearchItems(allItems, query),
    [allItems, query]
  );
  const safeActiveIndex = Math.min(
    activeIndex,
    Math.max(filtered.length - 1, 0)
  );

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${safeActiveIndex}"]`
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [safeActiveIndex, filtered.length]);

  const navigate = (path: string) => {
    onClose();
    router.push(path);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === "Enter" && filtered[safeActiveIndex]) {
      event.preventDefault();
      navigate(filtered[safeActiveIndex].path);
    }
  };

  return (
    <>
      <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une page ou une section…"
            className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm font-medium text-[#1C2434] outline-none transition-colors placeholder:text-gray-400 focus:border-[#00A09D] focus:bg-white focus:ring-2 focus:ring-[#00A09D]/15 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <p className="mt-3 px-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
          Navigation rapide — flèches ↑↓, Entrée pour ouvrir, Échap pour fermer
        </p>
      </div>

      <div
        ref={listRef}
        className="max-h-[min(60vh,420px)] overflow-y-auto filter-picker-scroll p-2"
      >
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm font-medium text-gray-400">
            Aucune page trouvée pour « {query} »
          </div>
        ) : (
          filtered.map((item, index) => {
            const isActive = index === safeActiveIndex;
            return (
              <button
                key={item.path}
                type="button"
                data-cmd-index={index}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left transition-colors ${
                  isActive
                    ? "bg-[#00A09D]/10 text-[#007a78]"
                    : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800/60"
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1C2434] dark:text-white">
                    {item.name}
                  </p>
                  {item.group ? (
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {item.group}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>{item.path}</span>
                  <ArrowRight size={14} className={isActive ? "text-[#00A09D]" : ""} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

export default function AppCommandPalette({ open, onClose }: Props) {
  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      showCloseButton={false}
      className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-gray-100 p-0 shadow-2xl dark:border-gray-800"
    >
      {open ? <CommandPaletteBody key="command-palette" onClose={onClose} /> : null}
    </Modal>
  );
}
