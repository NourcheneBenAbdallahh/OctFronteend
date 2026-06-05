"use client";

export default function StocksHeader() {
  return (
    <div className="mb-2">
      <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
        Stocks
        <span className="text-[#00A09D]">.</span>
      </h1>
      <p className="mt-2 text-sm font-medium text-gray-500 max-w-xl">
        Suivi des entrées et sorties de stock par lot, entrepôt et emballage.
      </p>
    </div>
  );
}