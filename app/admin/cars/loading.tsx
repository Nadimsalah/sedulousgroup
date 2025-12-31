export default function AdminCarsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-white/10 rounded-lg animate-pulse" />
        <div className="h-10 w-32 bg-white/10 rounded-lg animate-pulse" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 animate-pulse"
          >
            <div className="h-4 w-20 bg-white/10 rounded mb-2" />
            <div className="h-8 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Table header */}
            <div className="bg-white/5 border-b border-white/10 p-4">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 bg-white/10 rounded flex-1 animate-pulse" />
                ))}
              </div>
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="border-b border-white/10 p-4">
                <div className="flex gap-4 items-center">
                  <div className="h-16 w-24 bg-white/10 rounded animate-pulse" />
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-4 bg-white/10 rounded flex-1 animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
