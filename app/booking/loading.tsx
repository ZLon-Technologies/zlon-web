export default function Loading() {
  return (
    <div className="flex w-full flex-col px-5 py-6 space-y-6 animate-pulse">
      <div className="h-8 w-1/3 bg-gray-200 rounded-lg"></div>
      
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="h-20 w-20 rounded-xl bg-gray-200 shrink-0"></div>
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
            <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="mt-6 border-t border-gray-100 pt-4 flex justify-between">
          <div className="h-8 w-1/4 bg-gray-200 rounded"></div>
          <div className="h-8 w-1/4 bg-gray-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
