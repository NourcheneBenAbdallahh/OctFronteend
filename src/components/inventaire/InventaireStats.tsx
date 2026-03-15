// components/inventaire/InventaireStats.tsx
export const InventaireStats = ({ data }: { data: any[] }) => {
  const totalEcart = data.reduce((acc, curr) => acc + curr.ecart, 0);
  const itemsWithEcart = data.filter(i => i.ecart !== 0).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white p-4 border-l-4 border-[#00A09D] shadow-sm flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Exactitude Stock</span>
        <span className="text-2xl font-black text-gray-800">
          {Math.round(((data.length - itemsWithEcart) / data.length) * 100)}%
        </span>
      </div>
      <div className="bg-white p-4 border-l-4 border-red-500 shadow-sm flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Produits en Écart</span>
        <span className="text-2xl font-black text-red-500">{itemsWithEcart}</span>
      </div>
      <div className="bg-white p-4 border-l-4 border-orange-500 shadow-sm flex flex-col">
        <span className="text-[10px] font-bold text-gray-400 uppercase">Balance Totale</span>
        <span className={`text-2xl font-black ${totalEcart < 0 ? 'text-red-500' : 'text-green-500'}`}>
          {totalEcart > 0 ? `+${totalEcart}` : totalEcart}
        </span>
      </div>
    </div>
  );
};