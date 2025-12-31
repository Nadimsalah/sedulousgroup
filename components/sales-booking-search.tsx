"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Car, Gauge, Calendar, DollarSign, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"

export function SalesBookingSearch() {
  const router = useRouter()
  const [makeModel, setMakeModel] = useState("")
  const [mileage, setMileage] = useState("")
  const [year, setYear] = useState("")
  const [priceUpTo, setPriceUpTo] = useState("")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (makeModel) params.set("makeModel", makeModel)
    if (mileage) params.set("mileage", mileage)
    if (year) params.set("year", year)
    if (priceUpTo) params.set("price", priceUpTo)
    params.set("type", "Sales")
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="relative mx-auto max-w-7xl -mt-10">
      <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-600/20 to-red-500/20 blur-2xl opacity-50" />
      
      <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-2xl shadow-2xl shadow-black/40 p-4">
        <div className="flex flex-col lg:flex-row items-stretch gap-2">
          {/* Make or Model */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Car className="inline h-2.5 w-2.5 mr-1" />
              Make or Model
            </label>
            <input
              type="text"
              value={makeModel}
              onChange={(e) => setMakeModel(e.target.value)}
              placeholder="e.g., Mercedes, BMW, Tesla"
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium placeholder:text-white/50 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 transition-all hover:bg-white/15"
            />
          </div>

          {/* Mileage */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Gauge className="inline h-2.5 w-2.5 mr-1" />
              Mileage (Max)
            </label>
            <select
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option value="">Any Mileage</option>
              <option value="10000">Under 10,000 miles</option>
              <option value="25000">Under 25,000 miles</option>
              <option value="50000">Under 50,000 miles</option>
              <option value="75000">Under 75,000 miles</option>
              <option value="100000">Under 100,000 miles</option>
            </select>
          </div>

          {/* Year Model */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <Calendar className="inline h-2.5 w-2.5 mr-1" />
              Year Model
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option value="">Any Year</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="2018">2018</option>
              <option value="2017">2017 or Older</option>
            </select>
          </div>

          {/* Price Up To */}
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold text-white/60 uppercase tracking-wider">
              <DollarSign className="inline h-2.5 w-2.5 mr-1" />
              Price Up To
            </label>
            <select
              value={priceUpTo}
              onChange={(e) => setPriceUpTo(e.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm px-3 py-2.5 text-sm text-white font-medium focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/30 cursor-pointer transition-all hover:bg-white/15 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='rgb(248 113 113)'%3E%3Cpath strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.25em 1.25em',
              }}
            >
              <option value="">Any Price</option>
              <option value="10000">£10,000</option>
              <option value="15000">£15,000</option>
              <option value="20000">£20,000</option>
              <option value="25000">£25,000</option>
              <option value="30000">£30,000</option>
              <option value="40000">£40,000</option>
              <option value="50000">£50,000</option>
              <option value="75000">£75,000</option>
              <option value="100000">£100,000+</option>
            </select>
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
