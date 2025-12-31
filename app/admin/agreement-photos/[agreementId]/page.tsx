"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Upload, X, Loader2, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { put } from "@vercel/blob"

export default function AgreementPhotosPage() {
  const params = useParams()
  const router = useRouter()
  const agreementId = params?.agreementId as string

  const [loading, setLoading] = useState(true)
  const [agreement, setAgreement] = useState<any>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    const loadAgreement = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("agreements").select("*").eq("id", agreementId).single()

        if (error) throw error

        setAgreement(data)
        setPhotos(data.vehicle_photos || [])
        setLoading(false)
      } catch (error: any) {
        console.error("[v0] Error loading agreement:", error)
        alert("Failed to load agreement")
        router.push("/admin/requests")
      }
    }

    if (agreementId) {
      loadAgreement()
    }
  }, [agreementId, router])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      setUploading(true)
      const uploadedUrls: string[] = []

      for (const file of Array.from(files)) {
        const blob = await put(file.name, file, {
          access: "public",
        })
        uploadedUrls.push(blob.url)
      }

      setPhotos([...photos, ...uploadedUrls])
      setUploading(false)
    } catch (error: any) {
      console.error("[v0] Error uploading photos:", error)
      alert(`Failed to upload photos: ${error.message}`)
      setUploading(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)
      const supabase = createClient()

      // Update agreement with photos
      const { error: agreementError } = await supabase
        .from("agreements")
        .update({
          vehicle_photos: photos,
          status: "Active",
        })
        .eq("id", agreementId)

      if (agreementError) throw agreementError

      // Update booking status
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          status: "Active",
        })
        .eq("id", agreement.booking_id)

      if (bookingError) throw bookingError

      alert("Agreement completed successfully!")
      router.push("/admin/requests")
    } catch (error: any) {
      console.error("[v0] Error completing agreement:", error)
      alert(`Failed to complete agreement: ${error.message}`)
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-black via-red-950/20 to-black">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/admin/agreement-steps/${agreement.booking_id}`)}
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Camera className="h-6 w-6 text-red-500" />
                  Vehicle Photos / Videos
                </h1>
                <p className="text-sm text-white/60">Document the vehicle's current condition</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="liquid-glass rounded-3xl p-8">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Upload Photos or Videos</h2>

            <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-red-500/50 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center gap-4">
                {uploading ? (
                  <>
                    <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
                    <p className="text-white/60">Uploading...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                      <Upload className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold mb-1">Click to upload photos or videos</p>
                      <p className="text-sm text-white/60">or drag and drop files here</p>
                    </div>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Photo Grid */}
          {photos.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-4">Uploaded Media ({photos.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((url, index) => (
                  <div key={index} className="relative group aspect-square">
                    <img
                      src={url || "/placeholder.svg"}
                      alt={`Vehicle photo ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/agreement-steps/${agreement.booking_id}`)}
              className="flex-1 border-white/20 text-white hover:bg-white/5"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleComplete}
              disabled={completing || photos.length === 0}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {completing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Agreement
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
