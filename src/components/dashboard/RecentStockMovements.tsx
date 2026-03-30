"use client";
import { Stock } from "@/types/stock";
import { ArrowUpRight, ArrowDownLeft, Package, User, Calendar } from "lucide-react";
import Link from "next/link";

export default function RecentStockMovements({ stocks }: { stocks: Stock[] }) {
  const recentMovements = stocks.slice(0, 8); // On en affiche un peu plus pour remplir

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-white">
        <div>
          <h3 className="text-xl font-[1000] text-[#1C2434] uppercase tracking-tighter">
            Journal des Flux
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Temps réel • {stocks.length} mouvements total
          </p>
        </div>
        <Link href="/stock" className="text-[10px] font-black text-[#00A09D] border border-[#00A09D]/20 px-4 py-2 rounded-full uppercase hover:bg-[#00A09D] hover:text-white transition-all">
          Voir l'historique
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {recentMovements.length > 0 ? (
          recentMovements.map((movement) => (
            <div key={movement.id} className="p-5 hover:bg-[#F8FAFA] transition-colors flex items-center justify-between gap-4">
              <div className="flex items-center gap-5 flex-1">
                {/* Badge Icône */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  movement.sens === 'entree' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                }`}>
                  {movement.sens === 'entree' ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                </div>

                {/* Info Principale */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 flex-1">
                  <div>
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-0.5">Lot & Emballage</span>
                    <p className="text-sm font-[900] text-[#1C2434] uppercase truncate">{movement.lot?.code_lot || "LOT-SPEC"}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                       <Package size={10} /> {movement.emballage?.name}
                    </p>
                  </div>

                  <div className="hidden md:block">
                    <span className="text-[10px] font-black text-gray-400 uppercase block mb-0.5">Opérateur & Date</span>
                    <p className="text-[11px] font-bold text-[#1C2434] flex items-center gap-1 uppercase">
                       <User size={10} className="text-[#00A09D]" /> {movement.user?.name || "Système"}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                       <Calendar size={10} /> {movement.date_stock}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantité à droite */}
              <div className="text-right">
                 <span className={`text-lg font-[1000] tracking-tighter ${
                    movement.sens === 'entree' ? 'text-emerald-600' : 'text-orange-600'
                 }`}>
                   {movement.sens === 'entree' ? '+' : '-'}{Number(movement.quantite).toLocaleString()}
                 </span>
                 <p className="text-[9px] font-black text-gray-300 uppercase leading-none">Pièces (PCS)</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-gray-300 font-bold uppercase tracking-widest text-xs">
            Aucun mouvement enregistré
          </div>
        )}
      </div>
    </div>
  );
}