"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Plus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { updateCarAction, saveCarImagesAction, getCarImagesAction } from "@/app/actions/database"

export default function EditCarForm({ car }: { car: any }) {
  const router = useRouter()
  
  // Determine back URL based on rental type
  const getBackUrl = () => {
    const rentalType = car.rental_type || car.rentalType
    switch (rentalType) {
      case "Flexi Hire":
        return "/admin/flexi-hire"
      case "PCO Hire":
        return "/admin/pco-hire"
      case "Sales":
        return "/admin/sales"
      case "Rent":
      default:
        return "/admin/cars"
    }
  }
  
  const backUrl = getBackUrl()
  const getBackLabel = () => {
    switch (backUrl) {
      case "/admin/flexi-hire":
        return "Flexi Hire"
      case "/admin/pco-hire":
        return "PCO Hire"
      case "/admin/sales":
        return "Sales"
      default:
        return "Cars"
    }
  }
  const backLabel = getBackLabel()
  
  const [carData, setCarData] = useState({
    name: car.name || "",
    category: car.category || "Economy",
    brand: car.brand || "",
    year: car.year?.toString() || "",
    pricePerDay: car.price?.toString() || "",
    passengers: car.passengers?.toString() || "",
    luggage: car.luggage?.toString() || "",
    transmission: car.transmission || "Automatic",
    fuelType: car.fuel_type || "Petrol",
    rating: car.rating?.toString() || "4.5",
    description: car.description || "",
    safetyFeatures: car.features?.safety || [""],
    deviceFeatures: car.features?.device || [""],
    convenienceFeatures: car.features?.convenience || [""],
  })

  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadExistingImages = async () => {
      const images = await getCarImagesAction(car.id)

      if (images && images.length > 0) {
        setPreviewImages(images.map((img: any) => img.image_url))
      } else if (car.image) {
        setPreviewImages([car.image])
      }
    }

    loadExistingImages()
  }, [car.id, car.image])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsLoading(true)
    try {
      console.log("[v0] Starting image upload for", files.length, "files")

      const uploadPromises = Array.from(files).map(async (file) => {
        console.log("[v0] Uploading file:", file.name, "Size:", file.size, "Type:", file.type)

        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Upload failed for", file.name, "Status:", response.status, "Error:", errorText)
          throw new Error(`Failed to upload ${file.name}: ${errorText}`)
        }

        const { url } = await response.json()
        console.log("[v0] Successfully uploaded:", file.name, "URL:", url)
        return url
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      setPreviewImages([...previewImages, ...uploadedUrls])
      console.log("[v0] All images uploaded successfully")
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      alert(`Failed to upload images: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  const addSafetyFeature = () => {
    setCarData({ ...carData, safetyFeatures: [...carData.safetyFeatures, ""] })
  }

  const updateSafetyFeature = (index: number, value: string) => {
    const newFeatures = [...carData.safetyFeatures]
    newFeatures[index] = value
    setCarData({ ...carData, safetyFeatures: newFeatures })
  }

  const removeSafetyFeature = (index: number) => {
    setCarData({ ...carData, safetyFeatures: carData.safetyFeatures.filter((_, i: number) => i !== index) })
  }

  const addDeviceFeature = () => {
    setCarData({ ...carData, deviceFeatures: [...carData.deviceFeatures, ""] })
  }

  const updateDeviceFeature = (index: number, value: string) => {
    const newFeatures = [...carData.deviceFeatures]
    newFeatures[index] = value
    setCarData({ ...carData, deviceFeatures: newFeatures })
  }

  const removeDeviceFeature = (index: number) => {
    setCarData({ ...carData, deviceFeatures: carData.deviceFeatures.filter((_, i: number) => i !== index) })
  }

  const addConvenienceFeature = () => {
    setCarData({ ...carData, convenienceFeatures: [...carData.convenienceFeatures, ""] })
  }

  const updateConvenienceFeature = (index: number, value: string) => {
    const newFeatures = [...carData.convenienceFeatures]
    newFeatures[index] = value
    setCarData({ ...carData, convenienceFeatures: newFeatures })
  }

  const removeConvenienceFeature = (index: number) => {
    setCarData({ ...carData, convenienceFeatures: carData.convenienceFeatures.filter((_, i: number) => i !== index) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!carData.name || !carData.brand || !carData.pricePerDay) {
      alert("Please fill in all required fields")
      return
    }

    setIsLoading(true)

    try {
      console.log("[v0] Updating car:", car.id)
      console.log("[v0] Preview images count:", previewImages.length)

      // Update car using server action
      await updateCarAction(car.id, {
        name: carData.name,
        category: carData.category,
        brand: carData.brand,
        year: carData.year,
        image: previewImages[0] || car.image,
        pricePerDay: Number.parseFloat(carData.pricePerDay),
        passengers: Number.parseInt(carData.passengers),
        luggage: Number.parseInt(carData.luggage),
        transmission: carData.transmission,
        fuelType: carData.fuelType,
        rating: Number.parseFloat(carData.rating),
        description: carData.description,
        features: [
          ...carData.safetyFeatures.filter((f: string) => f.trim() !== ""),
          ...carData.deviceFeatures.filter((f: string) => f.trim() !== ""),
          ...carData.convenienceFeatures.filter((f: string) => f.trim() !== ""),
        ],
        safetyFeatures: carData.safetyFeatures.filter((f: string) => f.trim() !== ""),
        deviceFeatures: carData.deviceFeatures.filter((f: string) => f.trim() !== ""),
        convenienceFeatures: carData.convenienceFeatures.filter((f: string) => f.trim() !== ""),
      })

      console.log("[v0] Car updated successfully")

      // Save images using server action
      if (previewImages.length > 0) {
        console.log("[v0] Saving", previewImages.length, "images using server action")

        const imagesResult = await saveCarImagesAction(car.id, previewImages)

        if (!imagesResult.success) {
          console.error("[v0] Error saving images:", imagesResult.error)
          alert(`Car updated successfully, but failed to save images: ${imagesResult.error}`)
        } else {
          console.log("[v0] Images saved successfully!")
          alert("Car updated successfully with all images!")
        }
      } else {
        alert("Car updated successfully!")
      }

      router.push(backUrl)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error updating car:", error)
      alert(`Failed to update car: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border px-4 md:px-8 py-4 md:py-6 sticky top-0 z-[100]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <Link
              href={backUrl}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-sm md:text-base">Back to {backLabel}</span>
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Edit Car</h1>
                <p className="text-xs md:text-sm text-muted-foreground">Update car information</p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="px-4 md:px-6 py-2.5 whitespace-nowrap"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="edit-car-form"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 md:px-6 py-2.5 font-semibold shadow-md whitespace-nowrap"
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Car"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 pb-32 md:pb-8">
        <form id="edit-car-form" onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="bg-card rounded-2xl shadow-sm p-4 md:p-8 space-y-6 md:space-y-8 border border-border">
            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-foreground">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                    Car Name/Model *
                  </Label>
                  <Input
                    id="name"
                    value={carData.name}
                    onChange={(e) => setCarData({ ...carData, name: e.target.value })}
                    placeholder="e.g., Mercedes A-Class"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="brand" className="text-sm font-medium mb-2 block">
                    Brand *
                  </Label>
                  <Input
                    id="brand"
                    value={carData.brand}
                    onChange={(e) => setCarData({ ...carData, brand: e.target.value })}
                    placeholder="e.g., Mercedes-Benz"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium mb-2 block">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={carData.category}
                    onChange={(e) => setCarData({ ...carData, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select category</option>
                    <option value="Economy">Economy</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="year" className="text-sm font-medium mb-2 block">
                    Year *
                  </Label>
                  <Input
                    id="year"
                    value={carData.year}
                    onChange={(e) => setCarData({ ...carData, year: e.target.value })}
                    placeholder="2024"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="pricePerDay" className="text-sm font-medium mb-2 block">
                    Price per Day (£) *
                  </Label>
                  <Input
                    id="pricePerDay"
                    type="number"
                    value={carData.pricePerDay}
                    onChange={(e) => setCarData({ ...carData, pricePerDay: e.target.value })}
                    placeholder="65"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="rating" className="text-sm font-medium mb-2 block">
                    Rating (1-5)
                  </Label>
                  <Input
                    id="rating"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={carData.rating}
                    onChange={(e) => setCarData({ ...carData, rating: e.target.value })}
                    placeholder="4.5"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-foreground">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Label htmlFor="passengers" className="text-sm font-medium mb-2 block">
                    Passengers *
                  </Label>
                  <Input
                    id="passengers"
                    type="number"
                    value={carData.passengers}
                    onChange={(e) => setCarData({ ...carData, passengers: e.target.value })}
                    placeholder="5"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="luggage" className="text-sm font-medium mb-2 block">
                    Luggage Capacity *
                  </Label>
                  <Input
                    id="luggage"
                    type="number"
                    value={carData.luggage}
                    onChange={(e) => setCarData({ ...carData, luggage: e.target.value })}
                    placeholder="3"
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="transmission" className="text-sm font-medium mb-2 block">
                    Transmission *
                  </Label>
                  <select
                    id="transmission"
                    value={carData.transmission}
                    onChange={(e) => setCarData({ ...carData, transmission: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select transmission</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="fuelType" className="text-sm font-medium mb-2 block">
                    Fuel Type *
                  </Label>
                  <select
                    id="fuelType"
                    value={carData.fuelType}
                    onChange={(e) => setCarData({ ...carData, fuelType: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Select fuel type</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-foreground">Description</h2>
              <Textarea
                value={carData.description}
                onChange={(e) => setCarData({ ...carData, description: e.target.value })}
                placeholder="Describe the car and its key features..."
                rows={4}
                className="w-full"
              />
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-foreground">Vehicle Features</h2>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Safety</Label>
                    <Button
                      type="button"
                      onClick={addSafetyFeature}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {carData.safetyFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateSafetyFeature(index, e.target.value)}
                          placeholder="e.g., Backup camera"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeSafetyFeature(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Device connectivity</Label>
                    <Button
                      type="button"
                      onClick={addDeviceFeature}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {carData.deviceFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateDeviceFeature(index, e.target.value)}
                          placeholder="e.g., Apple CarPlay"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeDeviceFeature(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Convenience</Label>
                    <Button
                      type="button"
                      onClick={addConvenienceFeature}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {carData.convenienceFeatures.map((feature: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => updateConvenienceFeature(index, e.target.value)}
                          placeholder="e.g., Keyless entry"
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeConvenienceFeature(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-foreground">Images</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-red-500/50 transition-colors">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <label htmlFor="images" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-foreground font-medium mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                  </label>
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-video rounded-lg overflow-hidden border border-border"
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 md:hidden z-[100]">
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-car-form"
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            disabled={isLoading}
          >
            {isLoading ? "Updating..." : "Update Car"}
          </Button>
        </div>
      </div>
    </div>
  )
}
