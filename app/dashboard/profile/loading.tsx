import { Loader2 } from 'lucide-react'

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        <p className="text-gray-400">Loading profile settings...</p>
      </div>
    </div>
  )
}
