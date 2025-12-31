"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Star } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface FeaturesContent {
  title: string
  subtitle: string
}

const defaultContent: FeaturesContent = {
  title: "Why architects choose us.",
  subtitle: "Speed, realism and a painless feedback loop",
}

export function FeaturesArchviz() {
  const [content, setContent] = useState<FeaturesContent>(defaultContent)

  useEffect(() => {
    const saved = localStorage.getItem("skitbit-content")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.featuresArchviz) setContent(parsed.featuresArchviz)
      } catch {}
    }
  }, [])

  return (
    <section id="services" className="container mx-auto px-4 py-16 sm:py-20">
      <h2 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        {content.title}
      </h2>
      <p className="mb-10 text-center text-white/70">{content.subtitle}</p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="liquid-glass border border-white/20">
          <CardHeader>
            <p className="text-[11px] tracking-widest text-white/80">REALISM</p>
            <h3 className="mt-1 text-xl text-white font-semibold">Physically‑accurate lighting & materials</h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
                <Image src="/images/intuitive-1.png" alt="ArchViz material sample" fill className="object-cover" />
              </div>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10">
                <Image src="/images/intuitive-2.png" alt="Interior lighting demo" fill className="object-cover" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="liquid-glass border border-white/20">
          <CardHeader>
            <p className="text-[11px] tracking-widest text-white/80">CLIENT LOVE</p>
            <h3 className="mt-1 text-xl text-white font-semibold">
              “The renders sold 70% units pre‑launch — stunning work.”
            </h3>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-end gap-4">
              <div className="text-5xl font-bold text-lime-300">4.9</div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-lime-300 text-lime-300" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Image
                src={"/images/archviz/client-love-1.jpg"}
                width={280}
                height={160}
                alt="Photoreal dusk exterior street-corner render showcasing a modern glass building"
                className="h-full w-full rounded-xl border border-white/10 object-cover"
                priority
              />
              <Image
                src={"/images/archviz/client-love-2.jpg"}
                width={280}
                height={160}
                alt="Cinematic glass pavilion exterior with interior structure visible and water reflection"
                className="h-full w-full rounded-xl border border-white/10 object-cover"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
