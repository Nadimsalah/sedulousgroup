"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { BookingSearch } from "./booking-search"
import { SalesBookingSearch } from "./sales-booking-search"

export function Hero() {
  const [selectedRentalType, setSelectedRentalType] = useState<string>("Rent")

  const handleCategoryClick = (type: string) => {
    setSelectedRentalType(type)
    window.dispatchEvent(new CustomEvent('rentalTypeChange', { detail: type }))
  }

  return (
    <section className="relative isolate overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-14 sm:py-20">
          <div className="mb-5">
            <Image 
              src="/images/dna-group-logo.png" 
              alt="Sedulous Group Ltd logo" 
              width={200} 
              height={80} 
              className="h-auto w-48 sm:w-56 md:w-64" 
            />
          </div>
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">PREMIUM VEHICLES</span>
            <span className="block text-red-300 drop-shadow-[0_0_20px_rgba(239,68,68,0.35)]">ON DEMAND</span>
            <span className="block">FOR YOUR JOURNEY</span>
          </h1>
        </div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          <div className="flex gap-4 pb-2 overflow-x-auto hide-scrollbar">
            <Button 
              onClick={() => handleCategoryClick('Rent')}
              className={`rounded-full px-6 cursor-pointer transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                selectedRentalType === 'Rent'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                  : 'border border-white/20 bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              Rent
            </Button>
            <Button 
              onClick={() => handleCategoryClick('Flexi Hire')}
              className={`rounded-full px-6 cursor-pointer transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                selectedRentalType === 'Flexi Hire'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                  : 'border border-white/20 bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              Flexi Hire
            </Button>
            <Button 
              onClick={() => handleCategoryClick('PCO Hire')}
              className={`rounded-full px-6 cursor-pointer transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                selectedRentalType === 'PCO Hire'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                  : 'border border-white/20 bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              PCO Hire
            </Button>
            <Button 
              onClick={() => handleCategoryClick('Sales')}
              className={`rounded-full px-6 cursor-pointer transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
                selectedRentalType === 'Sales'
                  ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/50'
                  : 'border border-white/20 bg-white/10 text-white/70 backdrop-blur-md hover:bg-white/20 hover:border-white/30 hover:text-white'
              }`}
            >
              Sales
            </Button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12">
        {selectedRentalType === 'Sales' ? (
          <SalesBookingSearch />
        ) : (
          <BookingSearch selectedRentalType={selectedRentalType} />
        )}
      </div>
    </section>
  )
}
