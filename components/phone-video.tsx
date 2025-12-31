"use client"

import { useEffect, useRef, useState } from "react"

export default function PhoneVideo({
  src = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/b0f3222371106db366a14ca1c29cef55-1b1EWVSa4w3FL2zslcaCGYTy9vcxjF.mp4",
  className = "",
  poster,
}: { src?: string; className?: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    const saveData = (navigator as any)?.connection?.saveData === true
    const shouldAutoplay = !(prefersReducedMotion || saveData)

    let observer: IntersectionObserver | null = null

    const onIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting && !loaded) {
          const sourceEl = el.querySelector("source")
          if (sourceEl && !sourceEl.getAttribute("src")) {
            sourceEl.setAttribute("src", src)
            el.load()
          }

          const playVideo = async () => {
            if (!shouldAutoplay) return
            try {
              await el.play()
            } catch {
              // Autoplay blocked, ignore
            }
          }

          if (el.readyState >= 3) {
            playVideo()
          } else {
            el.addEventListener("canplay", playVideo, { once: true })
          }

          setLoaded(true)
        } else if (!entry.isIntersecting && loaded) {
          try {
            el.pause()
          } catch {}
        } else if (entry.isIntersecting && loaded && shouldAutoplay) {
          try {
            await el.play()
          } catch {}
        }
      })
    }

    observer = new IntersectionObserver(onIntersect, {
      rootMargin: "80px",
      threshold: 0.15,
    })
    observer.observe(el)

    const onVisibility = () => {
      if (!el) return
      const hidden = document.visibilityState === "hidden"
      if (hidden) {
        try {
          el.pause()
        } catch {}
      } else if (loaded && shouldAutoplay) {
        el.play().catch(() => {})
      }
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      observer?.disconnect()
    }
  }, [src, loaded])

  return (
    <video
      ref={videoRef}
      className={className}
      muted
      loop
      playsInline
      preload="none"
      poster={poster}
      aria-label="Skitbit app preview video"
      disableRemotePlayback
    >
      <source data-src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
      Your browser does not support the video tag.
    </video>
  )
}
