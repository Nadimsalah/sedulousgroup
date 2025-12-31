import { Button } from "@/components/ui/button"
import Image from "next/image"
import LazyVideo from "@/components/lazy-video"

export function HeroArchviz() {
  const cta = (
    <Button asChild className="rounded-full bg-lime-400 px-6 text-black hover:bg-lime-300">
      <a href="https://wa.link/65mf3i" target="_blank" rel="noopener noreferrer">
        Start ArchViz Project
      </a>
    </Button>
  )

  return (
    <section className="relative isolate overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center py-14 sm:py-20">
          <div className="mb-5 flex items-center gap-2">
            <Image src="/icons/skitbit-white.svg" alt="Skitbit logo" width={32} height={32} className="h-8 w-8" />
            <p className="text-sm uppercase tracking-[0.25em] text-lime-300/80">archviz</p>
          </div>

          {/* H1 */}
          <h1 className="mt-3 text-center text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            <span className="block">PHOTO‑REALISTIC</span>
            <span className="block text-lime-300 drop-shadow-[0_0_20px_rgba(132,204,22,0.35)]">ARCHITECTURE</span>
            <span className="block">VISUALIZATION</span>
          </h1>

          {/* H2 */}
          <p className="mt-4 max-w-2xl text-center text-sm text-white/80 sm:text-base">
            Exterior renders, interior styling and cinematic walkthroughs for developers, architects and agencies.
          </p>

          <div className="mt-6">{cta}</div>

          {/* Sample grid (kept from original for parity) */}
          <div className="mt-10 grid w-full gap-4 grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {archvizCards.map((p, i) => {
              const visibility = i <= 2 ? "block" : i === 3 ? "hidden md:block" : i === 4 ? "hidden xl:block" : "hidden"
              return (
                <div key={i} className={visibility}>
                  <PhoneCard title={p.title} sub={p.sub} videoSrc={p.videoSrc} />
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneCard({
  title,
  sub,
  videoSrc,
}: {
  title: string
  sub: string
  videoSrc?: string
}) {
  return (
    <div className="relative rounded-[28px] glass-border bg-neutral-900 p-2">
      <div className="relative aspect-[9/19] w-full overflow-hidden rounded-2xl bg-black">
        <LazyVideo
          src={
            videoSrc ??
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Timeline%201-Ku3Y2Hgaw8hCiFEFg1ELtYp631rSzR.webm"
          }
          className="absolute inset-0 h-full w-full object-cover"
          autoplay
          loop
          muted
          playsInline
          aria-label={`${title} - ${sub}`}
        />
        <div className="relative z-10 p-3">
          <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
          <div className="space-y-1 px-1">
            {/* H3 */}
            <h3 className="text-3xl font-bold leading-snug text-white/90">{title}</h3>
            <p className="text-xs text-white/70">{sub}</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-lime-300">
              ArchViz
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const archvizCards = [
  {
    title: "Exteriors",
    sub: "Every detail counts, every frame matters — every stage of the process is done with care.",
    videoSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Every%20detail%20counts%2C%20every%20frame%20matters%21Every%20stage%20of%20the%20process%20is%20done%20with%20care.%20From%20plac-0aQhUmeIEWI32BfXyNdANQy72OkyTw.mp4",
  },
  {
    title: "Interiors",
    sub: "Visualize every room, material, and light — exactly as it will feel in real life.",
    videoSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/interior-K4oSxppSecydQwbsEP3MkhQM7FU54u.mp4",
  },
  {
    title: "Vision",
    sub: "Take your audience on a cinematic journey.",
    videoSrc: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cinematic-o21Pr562TclgLhHHER6gvzHRNBUnj2.mp4",
  },
  {
    title: "Cinematics",
    sub: "Camera moves for emotion.",
  },
  {
    title: "Site Plans",
    sub: "Masterplans with context.",
  },
]
