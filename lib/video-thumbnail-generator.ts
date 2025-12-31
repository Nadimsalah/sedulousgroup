/**
 * Generate thumbnail from video file
 * This function extracts a frame from a video and returns it as a Blob
 */
export async function generateVideoThumbnail(videoFile: File): Promise<Blob | null> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement("video")
      video.preload = "metadata"
      video.muted = true
      video.playsInline = true
      video.crossOrigin = "anonymous"

      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      const handleLoadedMetadata = () => {
        try {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          // Seek to 0.1 seconds to get a frame
          video.currentTime = 0.1
        } catch (error) {
          console.error("Error setting video currentTime:", error)
          reject(error)
        }
      }

      const handleSeeked = () => {
        try {
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob)
                } else {
                  reject(new Error("Failed to generate thumbnail blob"))
                }
              },
              "image/jpeg",
              0.9
            )
          } else {
            reject(new Error("Invalid video dimensions"))
          }
        } catch (error) {
          console.error("Error generating thumbnail:", error)
          reject(error)
        }
      }

      const handleError = (error: Event) => {
        console.error("Video load error:", error)
        reject(new Error("Failed to load video"))
      }

      video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true })
      video.addEventListener("seeked", handleSeeked, { once: true })
      video.addEventListener("error", handleError, { once: true })

      // Create object URL for the video file
      const videoUrl = URL.createObjectURL(videoFile)
      video.src = videoUrl

      // Cleanup function
      const cleanup = () => {
        URL.revokeObjectURL(videoUrl)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("seeked", handleSeeked)
        video.removeEventListener("error", handleError)
      }

      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        cleanup()
        reject(new Error("Thumbnail generation timeout"))
      }, 10000) // 10 second timeout

      // Cleanup after success
      video.addEventListener("seeked", () => {
        clearTimeout(timeout)
        setTimeout(cleanup, 1000) // Cleanup after a delay
      }, { once: true })
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Check if a file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(file.name)
}

