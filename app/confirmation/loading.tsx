export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-2xl w-full animate-pulse">
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 bg-gray-800 rounded-full" />
        </div>
        <div className="h-12 w-96 bg-gray-800 rounded mx-auto mb-4" />
        <div className="h-6 w-full bg-gray-800 rounded mx-auto mb-8" />
        <div className="bg-gray-900 rounded-lg p-8 space-y-6">
          <div className="h-32 bg-gray-800 rounded" />
          <div className="h-64 bg-gray-800 rounded" />
        </div>
      </div>
    </div>
  )
}
