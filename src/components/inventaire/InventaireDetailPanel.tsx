"use client";

import { TableInventaire } from "@/types/inventaire";

interface Props {
  item: TableInventaire;
}

export default function InventaireDetailPanel({ item }: Props) {
  const refFige = Number(item.stock_theorique_fige ?? item.stock_theorique);
  const theoriqueActuel = Number(item.stock_theorique);
  const showTheoriqueActuel =
    item.stock_theorique_fige != null &&
    Math.abs(theoriqueActuel - refFige) >= 0.0001;

  const rows: { label: string; value: string }[] = [];

  if (showTheoriqueActuel) {
    rows.push({
      label: "Stock système actuel",
      value: String(theoriqueActuel),
    });
  }

  rows.push({
    label: "Date & heure de saisie",
    value: new Date(item.date_inventaire).toLocaleString("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }),
  });

  if (item.periode_debut && item.periode_fin) {
    rows.push({
      label: "Période couverte",
      value: `${new Date(item.periode_debut).toLocaleDateString("fr-FR")} → ${new Date(item.periode_fin).toLocaleDateString("fr-FR")}`,
    });
  }

  if (item.user?.name) {
    rows.push({ label: "Saisi par", value: item.user.name });
  }

  if (item.motif_ecart?.trim()) {
    rows.push({ label: "Motif écart", value: item.motif_ecart.trim() });
  }

  if (item.regularise_at) {
    rows.push({
      label: "Régularisé le",
      value: new Date(item.regularise_at).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    });
  }

  if (item.regularisePar?.name) {
    rows.push({ label: "Régularisé par", value: item.regularisePar.name });
  }

  if (item.mouvementStock) {
    const m = item.mouvementStock;
    rows.push({
      label: "Mouvement stock",
      value: `${m.type_mouvement} — ${m.code_mouvement || m.id} (${m.quantite} u.)`,
    });
  }

  if (item.lot?.code_lot) {
    rows.push({ label: "Lot créé", value: item.lot.code_lot });
  }

  if (item.created_at && item.created_at !== item.date_inventaire) {
    rows.push({
      label: "Créé le",
      value: new Date(item.created_at).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      }),
    });
  }

  if (!rows.length) {
    return (
      <div className="border-t border-gray-100 bg-gradient-to-r from-indigo-50/15 via-white to-teal-50/10 px-6 py-5 sm:px-10">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Aucune information complémentaire pour cette ligne.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-gradient-to-r from-indigo-50/15 via-white to-teal-50/10 px-6 py-6 sm:px-10 sm:py-7 animate-in fade-in slide-in-from-top duration-300">
      <p className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        Informations complémentaires
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="rounded-2xl border border-gray-100 bg-white/80 px-4 py-3 shadow-sm"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {row.label}
            </p>
            <p className="mt-1 text-sm font-bold text-gray-800">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
