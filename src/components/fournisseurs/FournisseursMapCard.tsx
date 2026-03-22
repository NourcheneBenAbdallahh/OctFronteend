"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { MoreDotIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { listFournisseurs } from "@/lib/fournisseurs.api";

const FournisseursRealMap = dynamic(() => import("./FournisseursRealMap"), {
  ssr: false,
});

type FournisseurMapItem = {
  id: string;
  raison_sociale: string;
  logo?: string | null;
  adresse?: string | null;
  statut?: "ACTIF" | "INACTIF" | null;
  latitude?: number | null;
  longitude?: number | null;
  adresse_geocodee?: string | null;
};

export default function FournisseursMapCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<FournisseurMapItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await listFournisseurs();

        if (!mounted) return;

        const valid = res.fournisseurs.filter(
          (f) =>
            f.latitude !== null &&
            f.latitude !== undefined &&
            f.longitude !== null &&
            f.longitude !== undefined
        ) as FournisseurMapItem[];

        setItems(valid);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Erreur de chargement de la carte.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const actifs = useMemo(
    () => items.filter((x) => x.statut === "ACTIF").length,
    [items]
  );

  const inactifs = useMemo(
    () => items.filter((x) => x.statut === "INACTIF").length,
    [items]
  );

  const recentItems = useMemo(() => items.slice(0, 4), [items]);

  const activePercent = items.length ? Math.round((actifs / items.length) * 100) : 0;
  const inactivePercent = items.length ? Math.round((inactifs / items.length) * 100) : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Localisation des fournisseurs
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Visualisation en temps réel des fournisseurs géolocalisés
          </p>
        </div>

       
      </div>

      <div className="px-4 py-6 my-6 overflow-hidden border border-gray-200 rounded-2xl bg-gray-50 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
        <div
          id="mapOne"
          className="mapOne map-btn -mx-4 -my-6 h-[320px] w-[252px] 2xsm:w-[307px] xsm:w-[358px] sm:-mx-6 md:w-[668px] lg:w-[634px] xl:w-[393px] 2xl:w-[554px]"
        >
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Chargement de la carte...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-500">
              {error}
            </div>
          ) : (
            <FournisseursRealMap items={items} />
          )}
        </div>
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Fournisseurs actifs
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {actifs} fournisseur(s)
            </span>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-emerald-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {activePercent}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
              Fournisseurs inactifs
            </p>
            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
              {inactifs} fournisseur(s)
            </span>
          </div>

          <div className="flex w-full max-w-[140px] items-center gap-3">
            <div className="relative block h-2 w-full max-w-[100px] rounded-sm bg-gray-200 dark:bg-gray-800">
              <div
                className="absolute left-0 top-0 flex h-full items-center justify-center rounded-sm bg-rose-500"
                style={{ width: `${inactivePercent}%` }}
              />
            </div>
            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {inactivePercent}%
            </p>
          </div>
        </div>

        <div className="pt-2">
         

        </div>
      </div>
    </div>
  );
}

function LogoAvatar({
  logo,
  raisonSociale,
}: {
  logo?: string | null;
  raisonSociale: string;
}) {
  const letter = raisonSociale?.charAt(0)?.toUpperCase() || "F";

  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logo}
        alt={raisonSociale}
        className="h-10 w-10 rounded-full object-cover border border-gray-200 bg-white shrink-0"
      />
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">
      {letter}
    </div>
  );
}