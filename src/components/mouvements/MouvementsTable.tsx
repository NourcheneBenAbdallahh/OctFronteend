import { formatDate, formatEmballageLabel, formatFlow, formatQuantity } from "@/lib/mouvement.helpers";
import { MouvementStock } from "@/types/mouvement";
import { StatusBadge, TypeBadge } from "./mouvement-ui";

export default function MouvementsTable({
  items,
  loading,
  onValidate,
  onDelete,
}: {
  items: MouvementStock[];
  loading: boolean;
  onValidate: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="text-lg font-bold text-gray-950">Journal des mouvements</div>
        <div className="mt-1 text-sm text-gray-500">
          Brouillons, validations et historique des flux manuels.
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50/80">
            <tr className="text-left text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500">
              <th className="px-6 py-4">Mouvement</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">lot</th>
              <th className="px-6 py-4">Flux</th>
              <th className="px-6 py-4">Quantité</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                  Chargement des mouvements...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-sm text-gray-500">
                  Aucun mouvement trouvé.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id} className="transition hover:bg-gray-50/70">
                  <td className="px-6 py-5">
                    <div className="font-mono text-sm font-bold text-gray-950">
                      {m.code_mouvement ?? `#${m.id}`}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{formatDate(m.date_mouvement)}</div>
                  </td>

                  <td className="px-6 py-5">
                    <TypeBadge type={m.type_mouvement} />
                  </td>

                  <td className="px-6 py-5">
                    <StatusBadge statut={m.statut} />
                  </td>

                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatEmballageLabel(m.emballage)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Lot : {m.lot?.code_lot ?? "-"}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
                      {formatFlow(m)}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="text-lg font-black tracking-tight text-gray-950">
                      {formatQuantity(m.quantite)}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      {m.statut !== "VALIDE" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onValidate(m.id)}
                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                          >
                            Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(m.id)}
                            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                          >
                            Supprimer
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-semibold text-gray-400">Aucune action</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}