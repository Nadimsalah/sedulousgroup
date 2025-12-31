export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>
      <div className="bg-white rounded-lg shadow p-8 animate-pulse">
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i}>
              <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
              <div className="h-10 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
