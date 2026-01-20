"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import Image from "next/image"

export function LogoMarquee() {
  const [pausedRow, setPausedRow] = useState<string | null>(null)

  const logos = [
    { name: "Ferrari", image: "/icons/ferrari.png" },
    { name: "BMW", image: "/icons/bmw.png" },
    { name: "Lamborghini", image: "/icons/lamborghini.png" },
    { name: "Porsche", image: "/icons/porsche.png" },
  ]

  const secondRowLogos = [
    { name: "Alfa Romeo", image: "/icons/alfa-romeo.png" },
    { name: "Volvo", image: "/icons/volvo.png" },
    { name: "Volkswagen", image: "/icons/volkswagen.png" },
    { name: "Toyota", image: "/icons/toyota.png" },
  ]

  const LogoCard = ({ logo, rowId }: { logo: any; rowId: string }) => (
    <div
      className="flex-shrink-0 mx-3"
      onMouseEnter={() => setPausedRow(rowId)}
      onMouseLeave={() => setPausedRow(null)}
    >
      <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-xl flex items-center justify-center overflow-hidden">
        <div className="relative w-full h-full p-3">
          <Image
            src={logo.image || "/placeholder.svg"}
            alt={logo.name}
            fill
            className="object-contain p-2"
            sizes="(min-width: 1024px) 128px, (min-width: 640px) 112px, 96px"
            priority
            unoptimized
          />
        </div>
      </div>
    </div>
  )

  return (
    <section className="text-white py-16 sm:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col items-center justify-between mb-12 sm:flex-row sm:items-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl text-center sm:text-left">
            Premium <span className="text-red-400">Brands</span>
            <br />
            We Offer
          </h2>
        </div>

        {/* Logo Marquee */}
        <div className="relative">
          {/* First Row - Scrolling Right */}
          <div className="flex overflow-hidden mb-6 [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
            <div
              className="flex animate-scroll-right"
              style={{
                animationPlayState: pausedRow === "first" ? "paused" : "running",
              }}
            >
              {[...logos, ...logos, ...logos].map((logo, index) => (
                <LogoCard key={`first-${index}`} logo={logo} rowId="first" />
              ))}
            </div>
          </div>

          {/* Second Row - Scrolling Left */}
          <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent_0%,black_10%,black_90%,transparent_100%)]">
            <div
              className="flex animate-scroll-left"
              style={{
                animationPlayState: pausedRow === "second" ? "paused" : "running",
              }}
            >
              {[...secondRowLogos, ...secondRowLogos, ...secondRowLogos].map((logo, index) => (
                <LogoCard key={`second-${index}`} logo={logo} rowId="second" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
