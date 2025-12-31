export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-8 animate-pulse">
        <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-96 bg-gray-200 rounded" />
      </div>
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  )
}
