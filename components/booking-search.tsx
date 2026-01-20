import { useState, useEffect } from "react"
import { useRouter } from 'next/navigation'
import { MapPin, Calendar, Clock, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getActiveLocations, type Location } from "@/app/actions/locations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface BookingSearchProps {
  selectedRentalType?: string
}

export function BookingSearch({ selectedRentalType = "Rent" }: BookingSearchProps) {
  const router = useRouter()
  const [locations, setLocations] = useState<Location[]>([])
  const [pickupLocation, setPickupLocation] = useState("")
  const [pickupDate, setPickupDate] = useState("")
  const [dropoffDate, setDropoffDate] = useState("")
  const [pickupTime, setPickupTime] = useState("10:00")
  const [dropoffTime, setDropoffTime] = useState("10:00")

  useEffect(() => {
    const fetchLocations = async () => {
      const data = await getActiveLocations()
      setLocations(data)
      if (data.length > 0 && !pickupLocation) {
        setPickupLocation(data[0].name)
      }
    }
    fetchLocations()
  }, [])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (pickupLocation) params.set("pickup", pickupLocation)
    if (pickupDate) params.set("pickupDate", pickupDate)
    if (dropoffDate) params.set("dropoffDate", dropoffDate)
    if (selectedRentalType) params.set("type", selectedRentalType)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="relative mx-auto max-w-7xl -mt-10">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 blur-2xl opacity-50" />

      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-4">
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          {/* Location */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <MapPin className="inline h-2.5 w-2.5 mr-1" />
              Location
            </label>
            <Select value={pickupLocation} onValueChange={setPickupLocation}>
              <SelectTrigger className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 h-11 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all hover:bg-white/15">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-black/90 text-white">
                {locations.length > 0 ? (
                  locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="London, UK">London, UK</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Pick-up Date */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Calendar className="inline h-2.5 w-2.5 mr-1" />
              Pick-up Date
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            />
          </div>

          {/* Drop-off Date */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Calendar className="inline h-2.5 w-2.5 mr-1" />
              Drop-off Date
            </label>
            <input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            />
          </div>

          {/* Pick-up Time */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Clock className="inline h-2.5 w-2.5 mr-1" />
              Pick-up Time
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            />
          </div>

          {/* Drop-off Time */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Clock className="inline h-2.5 w-2.5 mr-1" />
              Drop-off Time
            </label>
            <input
              type="time"
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer [color-scheme:dark] transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <Button
              onClick={handleSearch}
              className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500 to-red-600 px-6 py-2.5 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 whitespace-nowrap"
            >
              <Search className="inline h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
