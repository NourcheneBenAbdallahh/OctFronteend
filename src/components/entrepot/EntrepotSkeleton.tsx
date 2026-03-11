export const EntrepotSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-sm h-40 animate-pulse p-4 space-y-4">
        <div className="flex justify-between">
          <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
          <div className="h-6 w-6 bg-gray-100 rounded-full"></div>
        </div>
        <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
        <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
        <div className="mt-4 h-2 w-full bg-gray-100 rounded-full"></div>
      </div>
    ))}
  </div>
);