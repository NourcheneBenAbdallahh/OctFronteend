"use client";

import { X, Calendar, Warehouse, Package, ClipboardList, Info } from "lucide-react";
import { TableInventaire } from "@/types/inventaire";

interface Props {
  item: TableInventaire | null;
  open: boolean;
  onClose: () => void;
  onRegulariser?: () => void;
}

export default function InventaireDetailDrawer({ item, open, onClose, onRegulariser }: Props) {
  if (!open || !item) return null;

  const isLoss = item.ecart < 0;
  const isPerfect = item.ecart === 0;

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden">
      <div className="absolute inset-0 bg-[#1C2434]/20 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-500">
        
        {/* HEADER DYNAMIQUE */}
        <div className={`px-10 pt-12 pb-8 flex items-start justify-between border-b ${isLoss ? 'bg-red-50/30' : isPerfect ? 'bg-emerald-50/30' : 'bg-blue-50/30'}`}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-[1000] uppercase tracking-widest ${
                isLoss ? "bg-red-100 text-red-600" : isPerfect ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
              }`}>
                {isLoss ? "Écart Négatif" : isPerfect ? "Stock Conforme" : "Écart Positif"}
              </span>
            </div>
            <h2 className="text-[32px] font-[1000] text-[#1C2434] leading-tight tracking-tight">
              {item.emballage_name}
            </h2>
            <div className="flex items-center gap-2 text-gray-400 mt-2 font-bold uppercase text-[11px] tracking-wide">
              <Warehouse size={14} className="text-[#00A09D]" />
              {item.entrepot_name}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition-all group"
          >
            <X size={20} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* CONTENU DU RAPPORT */}
        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
          
          {/* GRILLE DES CHIFFRES CLÉS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[24px] bg-gray-50 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Théorique</p>
              <p className="text-3xl font-[1000] text-gray-400">{item.stock_theorique_fige ?? item.stock_theorique}</p>
              <p className="text-[10px] text-gray-300 mt-1">Actuel système : {item.stock_theorique}</p>
            </div>
            <div className="p-6 rounded-[24px] bg-white border-2 border-[#1C2434] shadow-lg shadow-gray-100">
              <p className="text-[10px] font-black text-[#00A09D] uppercase tracking-widest mb-1">Physique</p>
              <p className="text-3xl font-[1000] text-[#1C2434]">{item.stock_physique}</p>
            </div>
            <div className="col-span-2 p-8 rounded-[32px] bg-[#1C2434] text-white flex items-center justify-between overflow-hidden relative">
               <div className="relative z-10">
                  <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Écart d'Audit</p>
                  <p className="text-5xl font-[1000] tracking-tighter">
                    {item.ecart > 0 ? `+${item.ecart}` : item.ecart}
                  </p>
               </div>
               <div className={`p-4 rounded-2xl relative z-10 ${isLoss ? 'bg-red-500' : isPerfect ? 'bg-[#00A09D]' : 'bg-blue-500'}`}>
                  <ClipboardList size={32} />
               </div>
               {/* Décoration de fond */}
               <div className="absolute -right-4 -bottom-4 text-white/5 font-black text-9xl italic">#AUDIT</div>
            </div>
          </div>

          {/* DÉTAILS CHRONOLOGIQUES */}
          <section className="space-y-6">
            <h3 className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-gray-300 border-b pb-4">
              <Calendar size={16} />
              Temporalité & Traçabilité
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <InfoRow 
                icon={<Calendar size={18} />} 
                label="Date de saisie" 
                value={new Date(item.date_inventaire).toLocaleString("fr-FR", { dateStyle: 'long', timeStyle: 'short' })} 
              />
              <InfoRow 
                icon={<Info size={18} />} 
                label="Période couverte" 
                value={item.periode_debut && item.periode_fin 
                  ? `${new Date(item.periode_debut).toLocaleDateString("fr-FR")} → ${new Date(item.periode_fin).toLocaleDateString("fr-FR")}`
                  : "Audit ponctuel (sans période)"
                } 
              />
              <InfoRow 
                icon={<Package size={18} />} 
                label="Type d'emballage" 
                value={item.emballage_name} 
              />
              <InfoRow 
                icon={<Warehouse size={18} />} 
                label="Localisation" 
                value={item.entrepot_name} 
              />
              <InfoRow
                icon={<Info size={18} />}
                label="Statut"
                value={item.statut}
              />
              {item.code_session && (
                <InfoRow icon={<Info size={18} />} label="Session" value={item.code_session} />
              )}
              {item.motif_ecart && (
                <InfoRow icon={<Info size={18} />} label="Motif écart" value={item.motif_ecart} />
              )}
              {item.regularise_at && (
                <InfoRow
                  icon={<Info size={18} />}
                  label="Régularisé"
                  value={`${new Date(item.regularise_at).toLocaleString("fr-FR")}${item.regularisePar?.name ? ` par ${item.regularisePar.name}` : ""}`}
                />
              )}
            </div>
          </section>

        </div>

        {/* FOOTER ACTION */}
        <div className="px-10 py-8 border-t border-gray-50 bg-white flex flex-col gap-3">
          {item.statut !== "REGULARISEE" && onRegulariser && Math.abs(item.ecart) >= 0.0001 && (
            <button
              onClick={onRegulariser}
              className="w-full h-14 rounded-[20px] bg-emerald-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
            >
              Régulariser le stock
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full h-14 rounded-[20px] bg-gray-50 text-[#1C2434] font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            Fermer le rapport
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4 group">
      <div className="mt-1 text-[#00A09D] group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{label}</p>
        <p className="text-[15px] font-bold text-gray-700 mt-0.5">{value}</p>
      </div>
    </div>
  );
}