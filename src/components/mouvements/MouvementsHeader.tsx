import { Plus } from "lucide-react";

export default function MouvementsHeader({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white px-7 py-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-700">
            Mouvements de stock
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-750">
            Pilotage des mouvements de stock
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-500">
            Gestion des flux manuels de production, transfert, perte et surplus avec
            contrôle de traçabilité par lot et entrepôt.
          </p>
        </div>

<button
  type="button"
  onClick={onCreate}
  className="inline-flex items-center gap-2 rounded-full border border-indigo-300 bg-indigo-50 px-5 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
>
  <Plus size={16} />
  Nouveau mouvement
</button>
      </div>
    </div>
  );
}