export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-white/20 border-t-red-500 mx-auto" />
        <p className="mt-4 text-white/70">Loading your dashboard...</p>
      </div>
    </div>
  )
}
