"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Play } from "lucide-react"

interface VideoThumbnailProps {
  videoUrl: string
  alt?: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
}

export function VideoThumbnail({
  videoUrl,
  alt = "Video thumbnail",
  className = "",
  fill = false,
  width,
  height,
  onLoad,
}: VideoThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false)
      return
    }

    let isMounted = true
    const video = document.createElement("video")
    video.crossOrigin = "anonymous"
    video.preload = "metadata"
    video.muted = true
    video.playsInline = true
    video.setAttribute("playsinline", "true")

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")

    const handleLoadedMetadata = () => {
      if (!isMounted) return
      try {
        video.currentTime = 0.1 // Seek to 0.1 seconds to get a frame
      } catch (e) {
        console.error("Error seeking video:", e)
        setIsLoading(false)
      }
    }

    const handleSeeked = () => {
      if (!isMounted || !ctx) return
      
      try {
        if (video.videoWidth && video.videoHeight && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
          if (isMounted) {
            setThumbnailUrl(dataUrl)
            setIsLoading(false)
            if (onLoad) onLoad()
          }
        } else {
          if (isMounted) setIsLoading(false)
        }
      } catch (e) {
        console.error("Error generating thumbnail:", e)
        if (isMounted) setIsLoading(false)
      }
    }

    const handleError = (e: any) => {
      console.error("Video thumbnail error:", e)
      if (isMounted) setIsLoading(false)
    }

    const handleLoadedData = () => {
      if (!isMounted) return
      try {
        if (video.readyState >= 2) {
          video.currentTime = 0.1
        }
      } catch (e) {
        console.error("Error setting currentTime:", e)
      }
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("seeked", handleSeeked)
    video.addEventListener("error", handleError)

    // Set source and load
    video.src = videoUrl
    video.load()

    videoRef.current = video
    canvasRef.current = canvas

    // Timeout fallback
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Video thumbnail generation timeout")
        setIsLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => {
      isMounted = false
      video.removeEventListener("loadedmetadata", handleLoadedMetadata)
      video.removeEventListener("loadeddata", handleLoadedData)
      video.removeEventListener("seeked", handleSeeked)
      video.removeEventListener("error", handleError)
      video.src = ""
      video.load()
      clearTimeout(timeout)
    }
  }, [videoUrl])

  if (isLoading) {
    return (
      <div
        className={`bg-black/20 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <div className="animate-pulse bg-white/10 rounded w-full h-full" />
      </div>
    )
  }

  if (!thumbnailUrl) {
    return (
      <div
        className={`bg-black/20 flex items-center justify-center ${className}`}
        style={fill ? {} : { width, height }}
      >
        <Play className="h-8 w-8 text-white/40" />
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={fill ? {} : { width, height }}>
      {fill ? (
        <Image 
          src={thumbnailUrl} 
          alt={alt} 
          fill 
          className="object-cover"
          unoptimized
          onLoad={() => {
            // Thumbnail loaded successfully
          }}
        />
      ) : (
        <Image 
          src={thumbnailUrl} 
          alt={alt} 
          width={width} 
          height={height} 
          className="object-cover"
          unoptimized
        />
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors pointer-events-none">
        <div className="bg-black/50 rounded-full p-2 backdrop-blur-sm">
          <Play className="h-5 w-5 text-white" fill="currentColor" />
        </div>
      </div>
    </div>
  )
}

