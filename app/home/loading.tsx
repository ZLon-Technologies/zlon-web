export default function Loading() {
  return (
    <div className="flex w-full flex-col px-5 py-6 space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 w-1/3 bg-gray-200 rounded-lg"></div>
        <div className="h-10 w-10 rounded-full bg-gray-200"></div>
      </div>
      
      <div className="h-12 w-full rounded-2xl bg-gray-200"></div>

      <div className="grid grid-cols-4 gap-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-gray-200"></div>
            <div className="h-3 w-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 w-full rounded-2xl bg-gray-200"></div>
        ))}
      </div>
    </div>
  );
}
