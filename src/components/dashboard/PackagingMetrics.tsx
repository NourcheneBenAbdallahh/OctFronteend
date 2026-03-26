"use client";
import { Package, AlertTriangle, TrendingDown, Layers } from "lucide-react";
import { Stock } from "@/types/stock";

interface Props {
  stocks: Stock[];
  loading?: boolean;
}

export default function PackagingMetrics({ stocks, loading }: Props) {
  // --- LOGIQUE BI ---
  
  // 1. Calcul du Stock Réel Total (Somme entrées - Somme sorties)
  const currentTotalStock = stocks.reduce((acc, s) => {
    return s.sens === "entree" ? acc + Number(s.quantite) : acc - Number(s.quantite);
  }, 0);

  // 2. Identification des emballages en alerte (Stock < 500)
  const stockByEmballage = stocks.reduce((acc: Record<string, number>, s) => {
    const id = s.emballage?.name || "Inconnu";
    const val = s.sens === "entree" ? Number(s.quantite) : -Number(s.quantite);
    acc[id] = (acc[id] || 0) + val;
    return acc;
  }, {});

  const SEUIL_CRITIQUE = 500;
  const alertes = Object.values(stockByEmballage).filter(qty => qty < SEUIL_CRITIQUE).length;

  // 3. Consommation (Somme des sorties uniquement)
  const consommation = stocks
    .filter(s => s.sens === "sortie")
    .reduce((acc, s) => acc + Number(s.quantite), 0);

  // 4. Nombre de modèles différents en entrepôt
  const modelesActifs = Object.keys(stockByEmballage).length;

  const cards = [
    {
      label: "Stock Total",
      value: `${currentTotalStock.toLocaleString()} PCS`,
      icon: Package,
      color: "text-[#00A09D]",
      bg: "bg-[#F2F7F7]",
      desc: "Volume global disponible"
    },
    {
      label: "Alertes Seuil",
      value: alertes,
      icon: AlertTriangle,
      color: alertes > 0 ? "text-red-500" : "text-gray-400",
      bg: alertes > 0 ? "bg-red-50" : "bg-gray-50",
      desc: `Moins de ${SEUIL_CRITIQUE} unités`
    },
    {
      label: "Sorties (Mois)",
      value: consommation.toLocaleString(),
      icon: TrendingDown,
      color: "text-orange-500",
      bg: "bg-orange-50",
      desc: "Emballages consommés"
    },
    {
      label: "Types d'Emballages",
      value: modelesActifs,
      icon: Layers,
      color: "text-blue-500",
      bg: "bg-blue-50",
      desc: "Modèles actifs en stock"
    }
  ];

  if (loading) return <div className="grid grid-cols-4 gap-6 animate-pulse">...</div>;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm flex items-center gap-5">
          <div className={`w-14 h-14 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
            <card.icon size={26} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <h4 className="text-2xl font-[1000] text-[#1C2434] tracking-tighter truncate">{card.value}</h4>
            <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">{card.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}