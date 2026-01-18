"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { addCarAction, saveCarImagesAction } from "@/app/actions/database"

const CAR_BRANDS = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Nissan",
  "Hyundai",
  "Kia",
  "Lexus",
  "Subaru",
  "Mazda",
  "Porsche",
  "Ferrari",
  "Lamborghini",
  "Maserati",
  "Jaguar",
  "Land Rover",
  "Tesla",
  "Volvo",
  "Jeep",
  "Dodge",
  "RAM",
  "Chrysler",
  "Buick",
  "GMC",
  "Cadillac",
  "Infiniti",
  "Acura",
  "Mini",
  "Alfa Romeo",
  "Fiat",
  "Peugeot",
  "Citroën",
  "Renault",
  "Opel",
  "Skoda",
  "SEAT",
  "Bentley",
  "Rolls-Royce",
  "Aston Martin",
  "McLaren",
  "Bugatti",
  "Pagani",
  "Koenigsegg",
  "BYD",
  "Geely",
  "Great Wall",
  "Chery",
  "MG",
  "Tata Motors",
  "Mahindra",
  "Proton",
  "Perodua",
  "SsangYong",
  "Dacia",
  "Lancia",
  "Smart",
  "Cupra",
  "Polestar",
  "Rivian",
  "Lucid",
  "Fisker",
  "Hummer",
  "Scania",
  "MAN",
  "Iveco",
  "Freightliner",
  "RAM Trucks",
  "Lotus",
  "Genesis",
  "Dodge SRT",
  "Holden",
  "Saturn",
  "Saab",
  "Plymouth",
  "DeLorean",
  "Maybach",
  "Škoda Auto",
  "Daihatsu",
  "Isuzu",
  "Mitsubishi",
  "Suzuki",
  "Tata Daewoo",
  "Scion",
  "Borgward",
  "Haval",
  "NIO",
  "XPeng",
  "VinFast",
  "Faraday Future",
  "Karma Automotive",
  "Singer Vehicle Design",
  "Rezvani",
  "Ariel",
  "Rimac",
  "TVR",
  "Morgan Motor Company",
].sort()

const SAFETY_FEATURES = [
  "Anti-lock Braking System (ABS)",
  "Electronic Stability Control (ESC)",
  "Traction Control",
  "Adaptive Cruise Control",
  "Lane Departure Warning",
  "Lane Keeping Assist",
  "Blind Spot Monitoring",
  "Rear Cross-Traffic Alert",
  "Forward Collision Warning",
  "Automatic Emergency Braking (AEB)",
  "Pedestrian Detection",
  "Driver Attention Monitoring",
  "Tire Pressure Monitoring System (TPMS)",
  "Airbags (Front, Side, Curtain)",
  "Parking Sensors",
  "Rearview Camera",
  "Surround View Camera (360°)",
  "Automatic High Beams",
  "Road Sign Recognition",
  "Hill Descent Control",
  "Hill Start Assist",
  "Electronic Brakeforce Distribution (EBD)",
  "Brake Assist",
  "Roll Stability Control",
  "Child Safety Locks",
  "ISOFIX / LATCH Child Seat Anchors",
  "Traction Management / Drive Mode Safety",
  "Collision Mitigation System",
  "Emergency Call System (eCall)",
].sort()

const DEVICE_CONNECTIVITY_FEATURES = [
  "Bluetooth Connectivity",
  "Apple CarPlay",
  "Android Auto",
  "USB Ports (Type-A / Type-C)",
  "Wireless Charging Pad",
  "Wi-Fi Hotspot",
  "Navigation System (Built-in GPS)",
  "Voice Assistant Integration (Siri, Google Assistant, Alexa)",
  "Over-the-Air Software Updates (OTA)",
  "Smartphone App Remote Control",
  "Auxiliary (AUX) Input",
  "HDMI Input",
  "Cloud Connected Services",
  "Digital Key (phone-as-key)",
  "Multi-device Bluetooth Pairing",
  "In-car Apps (Spotify, Maps, etc.)",
  "Telematics System",
  "Vehicle Tracking System",
  "Media Streaming Support",
  "Wireless Apple CarPlay / Android Auto",
].sort()

const CONVENIENCE_FEATURES = [
  "Keyless Entry",
  "Push-Button Start",
  "Remote Start",
  "Power Windows",
  "Power Tailgate / Liftgate",
  "Hands-Free Tailgate (kick sensor)",
  "Automatic Climate Control",
  "Dual-Zone / Multi-Zone Climate Control",
  "Heated Seats",
  "Ventilated Seats",
  "Heated Steering Wheel",
  "Power-Adjustable Seats",
  "Memory Seat Settings",
  "Panoramic Sunroof",
  "Ambient Interior Lighting",
  "Cruise Control",
  "Adaptive Cruise Control",
  "Auto-Dimming Rearview Mirror",
  "Rain-Sensing Wipers",
  "Foldable Rear Seats",
  "Smart Trunk / Boot Open",
  "Seat Massaging Function",
  "Parking Assist (Automatic Parking)",
  "Electric Parking Brake",
  "Head-Up Display (HUD)",
  "Premium Sound System",
  "Rear Seat Entertainment Screens",
].sort()

export default function AddCarsPage() {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)

  const [carData, setCarData] = useState({
    name: "",
    category: "Economy",
    brand: "",
    year: "",
    pricePerDay: "",
    passengers: "",
    luggage: "",
    transmission: "Automatic",
    fuelType: "Petrol",
    rating: "4.5",
    description: "",
    safetyFeatures: [] as string[],
    deviceFeatures: [] as string[],
    convenienceFeatures: [] as string[],
    registrationNumber: "",
  })

  const [previewImages, setPreviewImages] = useState<string[]>([])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsPublishing(true)
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
      console.log("[v0] All images uploaded successfully. Total images:", uploadedUrls.length)
    } catch (error) {
      console.error("[v0] Error uploading images:", error)
      alert(`Failed to upload images: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const removeImage = (index: number) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index))
  }

  const toggleSafetyFeature = (feature: string) => {
    setCarData((prev) => ({
      ...prev,
      safetyFeatures: prev.safetyFeatures.includes(feature)
        ? prev.safetyFeatures.filter((f) => f !== feature)
        : [...prev.safetyFeatures, feature],
    }))
  }

  const toggleDeviceFeature = (feature: string) => {
    setCarData((prev) => ({
      ...prev,
      deviceFeatures: prev.deviceFeatures.includes(feature)
        ? prev.deviceFeatures.filter((f) => f !== feature)
        : [...prev.deviceFeatures, feature],
    }))
  }

  const toggleConvenienceFeature = (feature: string) => {
    setCarData((prev) => ({
      ...prev,
      convenienceFeatures: prev.convenienceFeatures.includes(feature)
        ? prev.convenienceFeatures.filter((f) => f !== feature)
        : [...prev.convenienceFeatures, feature],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!carData.name || !carData.brand || !carData.pricePerDay || !carData.passengers || !carData.luggage) {
      alert("Please fill in all required fields")
      return
    }

    setIsPublishing(true)

    try {
      console.log("[v0] Starting car publishing process...")

      await new Promise((resolve) => setTimeout(resolve, 1500))

      const allFeatures = [...carData.safetyFeatures, ...carData.deviceFeatures, ...carData.convenienceFeatures]

      const carToAdd = {
        name: carData.name,
        category: carData.category,
        brand: carData.brand,
        year: carData.year,
        image: previewImages[0] || "/images/cars/car1.webp",
        pricePerDay: Number.parseFloat(carData.pricePerDay),
        passengers: Number.parseInt(carData.passengers),
        luggage: Number.parseInt(carData.luggage),
        transmission: carData.transmission,
        fuelType: carData.fuelType,
        rating: Number.parseFloat(carData.rating),
        description: carData.description,
        status: "Published" as const,
        safetyFeatures: carData.safetyFeatures,
        deviceFeatures: carData.deviceFeatures,
        convenienceFeatures: carData.convenienceFeatures,
        registrationNumber: carData.registrationNumber,
      }

      console.log("[v0] Car data prepared:", carToAdd)

      const result = await addCarAction(carToAdd)

      console.log("[v0] Add car result:", result)

      if (!result) {
        throw new Error("Failed to add car to database")
      }

      if (previewImages.length > 0 && result.id) {
        console.log("[v0] Saving", previewImages.length, "images using server action for car:", result.id)

        const imagesResult = await saveCarImagesAction(result.id, previewImages)

        if (!imagesResult.success) {
          console.error("[v0] Error saving images:", imagesResult.error)
          alert(
            `Car saved successfully, but failed to save images: ${imagesResult.error}. Please edit the car to add images.`,
          )
        } else {
          console.log("[v0] Images saved successfully!")
          alert("Car published successfully with all images!")
        }
      } else {
        console.log("[v0] No images to save or no car ID")
        alert("Car published successfully!")
      }

      router.push("/admin/cars")
    } catch (error) {
      console.error("[v0] Error publishing car:", error)
      alert(`Failed to publish car: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="liquid-glass border-b border-white/10 px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <Link href="/admin/cars" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4">
            <ArrowLeft className="h-5 w-5" />
            Back to Cars
          </Link>
          <h1 className="text-2xl font-bold text-white">Add New Car</h1>
          <p className="text-sm text-white/60">Publish a new car for rent on the website</p>
        </div>
      </header>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
          <div className="liquid-glass rounded-2xl border-white/10 shadow-sm p-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-white/70 mb-2 block">
                    Car Name/Model *
                  </Label>
                  <Input
                    id="name"
                    value={carData.name}
                    onChange={(e) => setCarData({ ...carData, name: e.target.value })}
                    placeholder="e.g., Mercedes A-Class"
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="registrationNumber" className="text-sm font-medium text-white/70 mb-2 block">
                    VRN (Registration Number) <span className="text-white/40 font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="registrationNumber"
                    value={carData.registrationNumber}
                    onChange={(e) => setCarData({ ...carData, registrationNumber: e.target.value })}
                    placeholder="e.g., AB12 CDE"
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="brand" className="text-sm font-medium text-white/70 mb-2 block">
                    Brand *
                  </Label>
                  <select
                    id="brand"
                    value={carData.brand}
                    onChange={(e) => setCarData({ ...carData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="" className="bg-black text-white">
                      Select a brand
                    </option>
                    {CAR_BRANDS.map((brand) => (
                      <option key={brand} value={brand} className="bg-black text-white">
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="year" className="text-sm font-medium text-white/70 mb-2 block">
                    Year *
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    value={carData.year}
                    onChange={(e) => setCarData({ ...carData, year: e.target.value })}
                    placeholder="2024"
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="category" className="text-sm font-medium text-white/70 mb-2 block">
                    Category *
                  </Label>
                  <select
                    id="category"
                    value={carData.category}
                    onChange={(e) => setCarData({ ...carData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="Economy" className="bg-black text-white">
                      Economy
                    </option>
                    <option value="Premium" className="bg-black text-white">
                      Premium
                    </option>
                    <option value="Luxury" className="bg-black text-white">
                      Luxury
                    </option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="price" className="text-sm font-medium text-white/70 mb-2 block">
                    Price Per Day (£) *
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    value={carData.pricePerDay}
                    onChange={(e) => setCarData({ ...carData, pricePerDay: e.target.value })}
                    placeholder="65"
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="rating" className="text-sm font-medium text-white/70 mb-2 block">
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
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="passengers" className="text-sm font-medium text-white/70 mb-2 block">
                    Passengers *
                  </Label>
                  <Input
                    id="passengers"
                    type="number"
                    value={carData.passengers}
                    onChange={(e) => setCarData({ ...carData, passengers: e.target.value })}
                    placeholder="5"
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="luggage" className="text-sm font-medium text-white/70 mb-2 block">
                    Luggage Capacity *
                  </Label>
                  <Input
                    id="luggage"
                    type="number"
                    value={carData.luggage}
                    onChange={(e) => setCarData({ ...carData, luggage: e.target.value })}
                    placeholder="3"
                    required
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label htmlFor="transmission" className="text-sm font-medium text-white/70 mb-2 block">
                    Transmission *
                  </Label>
                  <select
                    id="transmission"
                    value={carData.transmission}
                    onChange={(e) => setCarData({ ...carData, transmission: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="Automatic" className="bg-black text-white">
                      Automatic
                    </option>
                    <option value="Manual" className="bg-black text-white">
                      Manual
                    </option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="fuelType" className="text-sm font-medium text-white/70 mb-2 block">
                    Fuel Type *
                  </Label>
                  <select
                    id="fuelType"
                    value={carData.fuelType}
                    onChange={(e) => setCarData({ ...carData, fuelType: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="Petrol" className="bg-black text-white">
                      Petrol
                    </option>
                    <option value="Diesel" className="bg-black text-white">
                      Diesel
                    </option>
                    <option value="Electric" className="bg-black text-white">
                      Electric
                    </option>
                    <option value="Hybrid" className="bg-black text-white">
                      Hybrid
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-white/70 mb-2 block">
                Description
              </Label>
              <Textarea
                id="description"
                value={carData.description}
                onChange={(e) => setCarData({ ...carData, description: e.target.value })}
                placeholder="Describe the car features and benefits..."
                rows={4}
                className="w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Vehicle Features</h2>

              <div className="space-y-8">
                {/* Safety Features */}
                <div>
                  <Label className="text-base font-semibold text-white mb-4 block">
                    Safety Features ({carData.safetyFeatures.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-white/10 rounded-lg bg-white/5">
                    {SAFETY_FEATURES.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-start gap-2 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={carData.safetyFeatures.includes(feature)}
                          onChange={() => toggleSafetyFeature(feature)}
                          className="mt-1 h-4 w-4 text-red-500 border-white/20 rounded focus:ring-red-500 bg-white/5"
                        />
                        <span className="text-sm text-white/80">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Device Connectivity Features */}
                <div>
                  <Label className="text-base font-semibold text-white mb-4 block">
                    Device Connectivity ({carData.deviceFeatures.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-white/10 rounded-lg bg-white/5">
                    {DEVICE_CONNECTIVITY_FEATURES.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-start gap-2 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={carData.deviceFeatures.includes(feature)}
                          onChange={() => toggleDeviceFeature(feature)}
                          className="mt-1 h-4 w-4 text-red-500 border-white/20 rounded focus:ring-red-500 bg-white/5"
                        />
                        <span className="text-sm text-white/80">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Convenience Features */}
                <div>
                  <Label className="text-base font-semibold text-white mb-4 block">
                    Convenience Features ({carData.convenienceFeatures.length} selected)
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-4 border border-white/10 rounded-lg bg-white/5">
                    {CONVENIENCE_FEATURES.map((feature) => (
                      <label
                        key={feature}
                        className="flex items-start gap-2 cursor-pointer hover:bg-white/10 p-2 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={carData.convenienceFeatures.includes(feature)}
                          onChange={() => toggleConvenienceFeature(feature)}
                          className="mt-1 h-4 w-4 text-red-500 border-white/20 rounded focus:ring-red-500 bg-white/5"
                        />
                        <span className="text-sm text-white/80">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-6">Vehicle Photos</h2>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-red-500/50 transition-colors bg-white/5">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isPublishing}
                  />
                  <label htmlFor="images" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-white/40 mx-auto mb-4" />
                    <p className="text-white/80 font-medium mb-2">Click to upload images</p>
                    <p className="text-sm text-white/60">PNG, JPG, WEBP up to 10MB each</p>
                  </label>
                </div>

                {previewImages.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {previewImages.map((image, index) => (
                      <div
                        key={index}
                        className="relative group aspect-video rounded-lg overflow-hidden border border-white/10"
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-white/10">
              <Link href="/admin/cars" className="flex-1">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-white/70 hover:text-white border-white/20 hover:bg-white/10 bg-transparent"
                  disabled={isPublishing}
                >
                  Cancel
                </Button>
              </Link>
              <Button type="submit" className="flex-1 bg-red-500 hover:bg-red-600 text-white" disabled={isPublishing}>
                {isPublishing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Car"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
