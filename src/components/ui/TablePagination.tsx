"use client";

export function TablePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-gray-50 disabled:opacity-30"
      >
        Précédent
      </button>

      <div className="border-x border-gray-100 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        Page {currentPage} sur {totalPages}
      </div>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm transition-all hover:bg-gray-50 disabled:opacity-30"
      >
        Suivant
      </button>
    </div>
  );
}
