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
        className="bg-white text-gray-900 border-2 border-gray-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-[8px_8px_0px_rgba(0,160,157,0.2)]"
>
  <Plus size={16} />
  Nouveau mouvement
</button>
      </div>
    </div>
  );
}