import { Plus } from "lucide-react";

export default function MouvementsHeader({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="mb-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Label de section style épuré */}
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[#00A09D]">
            Gestion des Flux
          </p>
          
          {/* Titre avec le style PFE (Font 1000 + Point Teal) */}
          <h1 className="text-5xl font-[1000] text-[#1C2434] dark:text-white tracking-tighter uppercase leading-tight">
            Mouvements
            <span className="text-[#00A09D]">.</span>
          </h1>
          
          <p className="mt-3 max-w-2xl text-sm font-medium text-gray-500 leading-relaxed">
            Suivi en temps réel des flux de production, transferts inter-entrepôts, 
            pertes et ajustements de stocks pour une traçabilité totale.
          </p>
        </div>

        {/* Bouton Neobrutaliste - Version "Rounded Full" */}
        <button
          type="button"
          onClick={onCreate}
          className="flex items-center justify-center gap-3 bg-white text-[#1C2434] border-2 border-[#1C2434] px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#1C2434] hover:text-white transition-all shadow-[6px_6px_0px_rgba(0,160,157,0.3)] active:translate-y-1 active:shadow-none whitespace-nowrap"
        >
          <Plus size={18} strokeWidth={3} />
          Nouveau mouvement
        </button>
      </div>

      {/* Ligne de séparation subtile pour l'élégance */}
      <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-gray-200 to-transparent"></div>
    </div>
  );
}