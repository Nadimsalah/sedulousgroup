export default function PCNTicketsLoading() {
  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-3">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="h-8 w-48 bg-white/10 rounded animate-pulse mb-2"></div>
          <div className="h-4 w-64 bg-white/10 rounded animate-pulse"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-4 rounded-xl border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse"></div>
              <div className="flex-1">
                <div className="h-6 w-12 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-20 bg-white/10 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="liquid-glass p-12 rounded-xl border border-white/10 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent mb-4"></div>
        <p className="text-white/60">Loading tickets...</p>
      </div>
    </div>
  )
}
