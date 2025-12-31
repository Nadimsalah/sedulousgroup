export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Loading deposits...</p>
      </div>
    </div>
  )
}
