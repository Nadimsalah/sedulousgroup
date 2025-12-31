"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

type BeforeAfterProps = {
  beforeSrc: string
  afterSrc: string
  alt?: string
  className?: string
}

export function BeforeAfter({ beforeSrc, afterSrc, alt = "Before and after", className }: BeforeAfterProps) {
  const [value, setValue] = React.useState(50)
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={beforeSrc || "/placeholder.svg"}
          alt={alt}
          fill
          priority={false}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }} aria-hidden="true">
          <Image
            src={afterSrc || "/placeholder.svg"}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        <div className="absolute inset-y-0" style={{ left: `${value}%` }} aria-hidden="true">
          <div className="h-full w-[2px] bg-black/60" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background/90 p-2 shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M13 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none" />
              <path d="M11 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </div>
        </div>

        <input
          aria-label="Before after slider"
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="absolute inset-0 z-10 w-full cursor-ew-resize appearance-none bg-transparent"
        />
      </div>

      {/* small corner labels like the reference */}
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/80 px-2 py-1 text-xs text-white">
        Before
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/80 px-2 py-1 text-xs text-white">
        After
      </span>
    </div>
  )
}
