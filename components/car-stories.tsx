"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Pause, Play, Volume2, VolumeX, ChevronLeft, ChevronRight, Loader2, ImageIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getStoriesAction, Story } from "@/app/actions/database"

export function CarStories({ rentalType }: { rentalType?: "Rent" | "Flexi Hire" | "PCO Hire" | "Sales" }) {
  const [carStories, setCarStories] = useState<Story[]>([])
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, time: 0 })
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({})
  const [storyImageLoading, setStoryImageLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVideoBuffering, setIsVideoBuffering] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const loadStories = async () => {
      try {
        console.log('[v0] Loading stories from database...')
        setIsLoading(true)
        setError(null)
        
        const stories = await getStoriesAction()
        console.log('[v0] Stories loaded:', stories.length, 'stories')
        
        const filteredStories = rentalType 
          ? stories.filter(story => story.rentalType === rentalType)
          : stories
        
        console.log('[v0] Filtered stories for', rentalType, ':', filteredStories.length)
        setCarStories(filteredStories)
        
        const loadingStates: Record<string, boolean> = {}
        filteredStories.forEach(story => {
          loadingStates[story.id] = true
        })
        setThumbnailLoading(loadingStates)
      } catch (err) {
        console.error('[v0] Error loading stories:', err)
        setError('Failed to load stories')
      } finally {
        setIsLoading(false)
      }
    }
    loadStories()
  }, [rentalType])

  useEffect(() => {
    setStoryImageLoading(true)
    setIsVideoBuffering(false)
    setIsVideoPlaying(false)
    setProgress(0)
    
    // Reset video when story or index changes
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.pause()
    }
  }, [selectedStory, currentIndex])

  useEffect(() => {
    if (videoRef.current && selectedStory) {
      const currentStoryItem = selectedStory.stories[currentIndex]
      const isCurrentVideo = isVideo(currentStoryItem.image || '')
      
      if (isCurrentVideo) {
        if (isPaused) {
          videoRef.current.pause()
        } else {
          videoRef.current.play().catch((err) => {
            console.log('[v0] Video autoplay blocked, user interaction required:', err)
          })
        }
      }
    }
  }, [isPaused, selectedStory, currentIndex])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted
    }
  }, [isMuted])

  useEffect(() => {
    if (!selectedStory || isPaused || isVideoBuffering) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const currentStoryItem = selectedStory.stories[currentIndex]
    const isCurrentVideo = isVideo(currentStoryItem.image || '')

    if (isCurrentVideo && videoRef.current) {
      if (!isVideoPlaying) {
        return
      }

      const updateVideoProgress = () => {
        if (videoRef.current && !isPaused && !isVideoBuffering && isVideoPlaying) {
          const currentTime = videoRef.current.currentTime
          const duration = videoRef.current.duration
          if (duration && !isNaN(duration) && duration > 0) {
            const videoProgress = (currentTime / duration) * 100
            setProgress(videoProgress)
            
            if (currentTime >= duration - 0.1) {
              handleNext()
              return
            }
          }
          animationFrameRef.current = requestAnimationFrame(updateVideoProgress)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(updateVideoProgress)
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    } else {
      const duration = currentStoryItem.duration
      const interval = 50
      const increment = (interval / duration) * 100

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext()
            return 0
          }
          return prev + increment
        })
      }, interval)

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [selectedStory, currentIndex, isPaused, isVideoBuffering, isVideoPlaying])

  useEffect(() => {
    if (selectedStory) {
      const header = document.querySelector('header')
      if (header && window.innerWidth >= 768) {
        header.style.display = 'none'
      }
    } else {
      const header = document.querySelector('header')
      if (header) {
        header.style.display = ''
      }
    }

    return () => {
      const header = document.querySelector('header')
      if (header) {
        header.style.display = ''
      }
    }
  }, [selectedStory])

  const handleNext = () => {
    if (!selectedStory) return
    
    setIsVideoPlaying(false)
    
    if (currentIndex < selectedStory.stories.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setProgress(0)
    } else {
      const currentStoryIndex = carStories.findIndex(s => s.id === selectedStory.id)
      if (currentStoryIndex < carStories.length - 1) {
        setSelectedStory(carStories[currentStoryIndex + 1])
        setCurrentIndex(0)
        setProgress(0)
      } else {
        setSelectedStory(carStories[0])
        setCurrentIndex(0)
        setProgress(0)
      }
    }
  }

  const handlePrevious = () => {
    if (!selectedStory) return
    
    setIsVideoPlaying(false)
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setProgress(0)
    } else {
      const currentStoryIndex = carStories.findIndex(s => s.id === selectedStory.id)
      if (currentStoryIndex > 0) {
        const prevStory = carStories[currentStoryIndex - 1]
        setSelectedStory(prevStory)
        setCurrentIndex(prevStory.stories.length - 1)
        setProgress(0)
      }
    }
  }

  const handleNextStorySet = () => {
    if (!selectedStory) return
    
    setIsVideoPlaying(false)
    
    const currentStoryIndex = carStories.findIndex(s => s.id === selectedStory.id)
    if (currentStoryIndex < carStories.length - 1) {
      setSelectedStory(carStories[currentStoryIndex + 1])
      setCurrentIndex(0)
      setProgress(0)
    } else {
      setSelectedStory(carStories[0])
      setCurrentIndex(0)
      setProgress(0)
    }
  }

  const handlePreviousStorySet = () => {
    if (!selectedStory) return
    
    setIsVideoPlaying(false)
    
    const currentStoryIndex = carStories.findIndex(s => s.id === selectedStory.id)
    if (currentStoryIndex > 0) {
      setSelectedStory(carStories[currentStoryIndex - 1])
      setCurrentIndex(0)
      setProgress(0)
    }
  }

  const closeStory = () => {
    setSelectedStory(null)
    setCurrentIndex(0)
    setProgress(0)
    setIsPaused(false)
    setIsVideoPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    })
    setSwipeOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart.x) return
    
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    const diffX = currentX - touchStart.x
    const diffY = currentY - touchStart.y
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setSwipeOffset(diffX)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEnd = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const diffX = touchStart.x - touchEnd
    const diffY = touchStart.y - touchEndY
    const timeDiff = Date.now() - touchStart.time
    const velocity = Math.abs(diffX) / timeDiff
    
    setSwipeOffset(0)
    
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
      if (velocity > 0.5 || Math.abs(diffX) > 100) {
        if (diffX > 0) {
          handleNextStorySet()
        } else {
          handlePreviousStorySet()
        }
      } else {
        if (diffX > 0) {
          handleNext()
        } else {
          handlePrevious()
        }
      }
    }
  }

  const handleMobileClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 768) return
    
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    if (x < width / 3) {
      handlePrevious()
    } else if (x > (width * 2) / 3) {
      handleNext()
    } else {
      setIsPaused(!isPaused)
    }
  }

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov)$/i)
  }

  const handleVideoWaiting = () => {
    console.log('[v0] Video buffering - pausing progress')
    setIsVideoBuffering(true)
    setIsVideoPlaying(false)
  }

  const handleVideoCanPlay = () => {
    console.log('[v0] Video can play - ready to resume')
    setIsVideoBuffering(false)
    setStoryImageLoading(false)
  }

  const handleVideoPlaying = () => {
    console.log('[v0] Video playing - starting progress')
    setIsVideoBuffering(false)
    setIsVideoPlaying(true)
  }

  const handleVideoPause = () => {
    console.log('[v0] Video paused')
    setIsVideoPlaying(false)
  }

  const handleVideoSeeking = () => {
    console.log('[v0] Video seeking - pausing progress')
    setIsVideoPlaying(false)
  }

  const handleVideoSeeked = () => {
    console.log('[v0] Video seeked')
  }

  if (isLoading) {
    return (
      <div className="mb-8 -mx-4 px-4">
        <div className="flex gap-4 pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-white/10 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    console.error('[v0] Stories error:', error)
    return null
  }

  if (carStories.length === 0) {
    console.log('[v0] No stories to display')
    return null
  }

  return (
    <>
      {/* Stories Carousel */}
      <div className="mb-8 -mx-4 px-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 pb-2">
          {carStories.map((story) => (
            <button
              key={story.id}
              onClick={() => {
                console.log('[v0] Opening story:', story.title)
                setSelectedStory(story)
                setCurrentIndex(0)
                setProgress(0)
              }}
              className="flex-shrink-0 group"
            >
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-red-500 via-red-400 to-red-600 p-[3px] transition-transform duration-200 group-hover:scale-105">
                  <div className="h-full w-full rounded-full bg-black p-[3px]">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      {thumbnailLoading[story.id] && (
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 z-10" />
                      )}
                      {story.thumbnail ? (
                        <Image
                          src={story.thumbnail}
                          alt={story.title}
                          fill
                          className="object-cover"
                          onLoad={() => setThumbnailLoading(prev => ({...prev, [story.id]: false}))}
                          onError={() => {
                            setThumbnailLoading(prev => ({...prev, [story.id]: false}))
                          }}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <ImageIcon className="h-8 w-8 text-white/40" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-white/80 max-w-[80px] truncate">
                {story.title}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <div className="relative h-full w-full max-w-lg overflow-hidden">
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 z-20 flex gap-1">
              {selectedStory.stories.map((_, idx) => (
                <div key={idx} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
                  <div
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{
                      width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Buffering Indicator */}
            {(isVideoBuffering || storyImageLoading) && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                <Loader2 className="h-12 w-12 text-white animate-spin" />
              </div>
            )}

            {/* Header */}
            <div className="absolute top-12 left-4 right-4 z-20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white">
                  <Image
                    src={selectedStory.thumbnail || "/placeholder.svg"}
                    alt={selectedStory.title}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <span className="text-sm font-semibold text-white">
                  {selectedStory.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isVideo(selectedStory.stories[currentIndex].image || '') && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsMuted(!isMuted)}
                    className="h-9 w-9 text-white hover:bg-white/10"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsPaused(!isPaused)}
                  className="h-9 w-9 text-white hover:bg-white/10"
                >
                  {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeStory}
                  className="h-9 w-9 text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="hidden md:flex absolute top-1/2 left-4 right-4 -translate-y-1/2 z-20 justify-between pointer-events-none">
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handlePreviousStorySet()
                }}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 pointer-events-auto"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleNextStorySet()
                }}
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 pointer-events-auto"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            {/* Story Content */}
            <div
              ref={containerRef}
              className="relative h-full w-full md:cursor-default cursor-pointer transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${swipeOffset}px)`
              }}
              onClick={handleMobileClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {isVideo(selectedStory.stories[currentIndex].image || '') ? (
                <>
                  {storyImageLoading && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 z-10" />
                  )}
                  <video
                    ref={videoRef}
                    src={selectedStory.stories[currentIndex].image || ''}
                    className="h-full w-full object-contain"
                    muted={isMuted}
                    playsInline
                    autoPlay={!isPaused}
                    onWaiting={handleVideoWaiting}
                    onCanPlay={handleVideoCanPlay}
                    onPlaying={handleVideoPlaying}
                    onPause={handleVideoPause}
                    onSeeking={handleVideoSeeking}
                    onSeeked={handleVideoSeeked}
                    onLoadedData={() => {
                      setStoryImageLoading(false)
                      setIsVideoBuffering(false)
                      if (!isPaused) {
                        videoRef.current?.play().catch((err) => {
                          console.log('[v0] Video autoplay blocked:', err)
                        })
                      }
                    }}
                    onEnded={() => {
                      handleNext()
                    }}
                  />
                </>
              ) : (
                <>
                  {storyImageLoading && (
                    <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 z-10" />
                  )}
                  <Image
                    src={selectedStory.stories[currentIndex].image || "/placeholder.svg"}
                    alt={`${selectedStory.title} story ${currentIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                    onLoad={() => setStoryImageLoading(false)}
                    onError={() => {
                      console.error('[v0] Image failed to load')
                      setStoryImageLoading(false)
                    }}
                  />
                </>
              )}
              
              {/* Glassmorphism Book Now button */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                <Link href={`/car/${selectedStory.linkedCarId}`}>
                  <Button className="bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 px-8 py-6 text-lg font-semibold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105">
                    Book Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
