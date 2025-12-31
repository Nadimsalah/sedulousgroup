"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function LogoMarqueeArchviz() {
  const [pausedRow, setPausedRow] = useState<string | null>(null)

  const logos = [
    { name: "Lionsgate", image: "/icons/skitbit-white.png" },
    { name: "Skitbit", image: "/icons/skitbit-white.png" },
    { name: "AP", image: "/icons/skitbit-white.png" },
    { name: "Framework", image: "/icons/skitbit-white.png" },
  ]

  const Row = ({ dir, id }: { dir: "left" | "right"; id: string }) => (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <div
        className={`flex ${dir === "left" ? "animate-scroll-left" : "animate-scroll-right"} whitespace-nowrap`}
        style={{ animationPlayState: pausedRow === id ? "paused" : "running", width: "max-content" }}
      >
        {[...logos, ...logos, ...logos].map((logo, i) => (
          <div
            key={`${id}-${i}`}
            className="flex-shrink-0 mx-3"
            onMouseEnter={() => setPausedRow(id)}
            onMouseLeave={() => setPausedRow(null)}
          >
            <div className="w-24 h-24 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-xl flex items-center justify-center overflow-hidden">
              <div className="relative w-full h-full">
                <Image src={logo.image || "/placeholder.svg"} alt={logo.name} fill className="object-cover" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <section className="text-white py-16 sm:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between mb-12 sm:flex-row sm:items-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl text-center sm:text-left">
            Trusted by <span className="text-lime-300">property teams</span>
          </h2>
          <Button variant="outline" className="mt-4 sm:mt-0 liquid-glass text-white border-white/20 bg-transparent">
            Learn More
          </Button>
        </div>
        <div className="relative">
          <Row dir="right" id="first" />
          <div className="mt-6" />
          <Row dir="left" id="second" />
        </div>
      </div>
    </section>
  )
}
