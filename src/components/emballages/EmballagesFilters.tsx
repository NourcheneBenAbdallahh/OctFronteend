export default function EmballagesFilters({ onCreate }: any) {
  return (
    <div className="flex justify-between">

      <button
        onClick={onCreate}
        className="bg-brand-500 text-white px-4 py-2 rounded"
      >
        + New Emballage
      </button>

      <input
        placeholder="Search..."
        className="border px-3 py-2 rounded"
      />

    </div>
  );
}