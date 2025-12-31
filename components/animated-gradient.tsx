"use client"

import { useEffect, useRef } from "react"

export function AnimatedGradient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    // Set canvas size
    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    setSize()
    window.addEventListener("resize", setSize)

    // Animation variables
    let time = 0
    let animationId: number

    const animate = () => {
      time += 0.003 // Slow smooth animation

      const w = window.innerWidth
      const h = window.innerHeight

      ctx.fillStyle = "#000000"
      ctx.fillRect(0, 0, w, h)

      // Gradient 1: Flowing from top-right
      const gradient1 = ctx.createRadialGradient(
        w * 0.8 + Math.sin(time) * (w * 0.3),
        h * 0.2 + Math.cos(time * 0.8) * (h * 0.3),
        0,
        w * 0.8,
        h * 0.2,
        Math.max(w, h) * 0.6,
      )
      gradient1.addColorStop(0, "rgba(220, 38, 38, 0.15)") // red-600
      gradient1.addColorStop(0.5, "rgba(153, 27, 27, 0.08)") // red-900
      gradient1.addColorStop(1, "rgba(0, 0, 0, 0)")

      // Gradient 2: Flowing from bottom-left
      const gradient2 = ctx.createRadialGradient(
        w * 0.2 + Math.cos(time * 0.7) * (w * 0.3),
        h * 0.8 + Math.sin(time * 0.9) * (h * 0.3),
        0,
        w * 0.2,
        h * 0.8,
        Math.max(w, h) * 0.7,
      )
      gradient2.addColorStop(0, "rgba(239, 68, 68, 0.12)") // red-500
      gradient2.addColorStop(0.5, "rgba(185, 28, 28, 0.06)") // red-800
      gradient2.addColorStop(1, "rgba(0, 0, 0, 0)")

      // Gradient 3: Center pulsing
      const centerX = w / 2 + Math.sin(time * 0.5) * (w * 0.15)
      const centerY = h / 2 + Math.cos(time * 0.4) * (h * 0.15)
      const gradient3 = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(w, h) * 0.5)
      gradient3.addColorStop(0, "rgba(252, 165, 165, 0.08)") // red-300
      gradient3.addColorStop(0.6, "rgba(220, 38, 38, 0.04)") // red-600
      gradient3.addColorStop(1, "rgba(0, 0, 0, 0)")

      // Apply gradients with smooth blending
      ctx.globalCompositeOperation = "lighter"

      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = gradient2
      ctx.fillRect(0, 0, w, h)

      ctx.fillStyle = gradient3
      ctx.fillRect(0, 0, w, h)

      // Reset composite operation
      ctx.globalCompositeOperation = "source-over"

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setSize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    />
  )
}

export default AnimatedGradient
