"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  Plus,
  Trash2,
  Eye,
  Upload,
  X,
  ImageIcon,
  CarIcon,
  FileText,
  Home,
  LogOut,
  Menu,
  User,
  Bell,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import {
  getStoriesAction,
  getCarsAction,
  addStoryAction,
  deleteStoryAction,
  type Story,
  type Car,
} from "@/app/actions/database"

export default function StoriesManagementPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCarId, setSelectedCarId] = useState("")
  const [selectedRentalType, setSelectedRentalType] = useState<"Rent" | "Flexi Hire" | "PCO Hire" | "Sales">("Rent")
  const [storyFiles, setStoryFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [thumbnailLoading, setThumbnailLoading] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadFile, setCurrentUploadFile] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Rent" | "Flexi Hire" | "PCO Hire" | "Sales">("All")
  const [rentalCarsOpen, setRentalCarsOpen] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log("[v0] Loading stories...")
      const fetchedStories = await getStoriesAction()
      console.log("[v0] Fetched stories:", fetchedStories)

      if (!fetchedStories || fetchedStories.length === 0) {
        console.warn("[v0] No stories returned - this might indicate missing environment variables")
      }

      setStories(fetchedStories)
      const fetchedCars = await getCarsAction()
      setCars(fetchedCars)
      const loadingStates: Record<string, boolean> = {}
      fetchedStories.forEach((story) => {
        loadingStates[story.id] = true
      })
      setThumbnailLoading(loadingStates)
    } catch (error) {
      console.error("[v0] Error loading stories:", error)
      alert(
        "Unable to load stories. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are configured.",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (storyId: string) => {
    if (!window.confirm("Are you sure you want to delete this story? This action cannot be undone.")) {
      return
    }

    console.log("[v0] Deleting story:", storyId)

    setStories((prev) => prev.map((s) => (s.id === storyId ? ({ ...s, deleting: true } as any) : s)))

    try {
      await deleteStoryAction(storyId)

      console.log("[v0] Story deleted successfully, reloading stories...")
      await loadData()
      alert("Story deleted successfully!")
    } catch (error) {
      console.error("[v0] Error during story deletion:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Error deleting story: ${errorMessage}`)

      setStories((prev) => prev.map((s) => (s.id === storyId ? ({ ...s, deleting: false } as any) : s)))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setStoryFiles((prev) => [...prev, ...files])

    const newPreviews = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setStoryFiles((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previewUrls[index])
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddStory = async () => {
    if (!selectedCarId) {
      alert("Please select a car")
      return
    }

    const selectedCar = cars.find((car) => car.id === selectedCarId)
    if (!selectedCar) return

    if (storyFiles.length === 0) {
      alert("Please upload at least one story image or video")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < storyFiles.length; i++) {
        setCurrentUploadFile(storyFiles[i].name)

        const formData = new FormData()
        formData.append("file", storyFiles[i])

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${storyFiles[i].name}`)
        }

        const result = await response.json()
        uploadedUrls.push(result.url)

        const progress = Math.round(((i + 1) / storyFiles.length) * 100)
        setUploadProgress(progress)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      console.log("[v0] Uploaded file URLs:", uploadedUrls)
      console.log("[v0] Publishing story with data:", {
        title: selectedCar.name,
        linkedCarId: selectedCarId,
        carName: selectedCar.name,
        storiesCount: uploadedUrls.length,
      })

      const result = await addStoryAction({
        title: selectedCar.name,
        linkedCarId: selectedCarId,
        carName: selectedCar.name,
        thumbnail: uploadedUrls[0],
        stories: uploadedUrls.map((url) => ({
          image: url,
          duration: 5000,
        })),
        status: "Published",
        rentalType: selectedRentalType,
      })

      console.log("[v0] Story publish result:", result)

      if (!result) {
        throw new Error("Failed to publish story - no result returned")
      }

      await loadData()

      previewUrls.forEach((url) => URL.revokeObjectURL(url))

      setShowAddModal(false)
      setSelectedCarId("")
      setSelectedRentalType("Rent")
      setStoryFiles([])
      setPreviewUrls([])
      alert("Story published successfully and now visible on website!")
    } catch (error) {
      console.error("[v0] Error publishing story:", error)
      alert(`Failed to publish story: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      setCurrentUploadFile("")
    }
  }

  const Sidebar = () => (
    <>
      <div className="p-6 border-b border-neutral-800">
        <Image src="/images/dna-group-logo.png" alt="Sedulous Logo" width={140} height={40} className="h-10 w-auto" />
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-4">MENU</p>

          <Link
            href="/admin"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              pathname === "/admin"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <div>
            <button
              onClick={() => setRentalCarsOpen(!rentalCarsOpen)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition-colors text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-3">
                <CarIcon className="h-5 w-5" />
                <span>Rental Cars</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${rentalCarsOpen ? "rotate-180" : ""}`} />
            </button>

            {rentalCarsOpen && (
              <div className="ml-6 mt-1 space-y-1">
                <Link
                  href="/admin/cars"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    pathname === "/admin/cars"
                      ? "bg-red-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  <span className="text-sm">Rent</span>
                </Link>
                <Link
                  href="/admin/flexi-hire"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    pathname === "/admin/flexi-hire"
                      ? "bg-red-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  <span className="text-sm">Flexi Hire</span>
                </Link>
                <Link
                  href="/admin/pco-hire"
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    pathname === "/admin/pco-hire"
                      ? "bg-red-500 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                >
                  <span className="text-sm">PCO Hire</span>
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/admin/stories"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              pathname === "/admin/stories"
                ? "bg-red-500 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Stories</span>
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-neutral-800">
        <button
          onClick={() => (window.location.href = "/admin/login")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </>
  )

  const filteredStories =
    selectedFilter === "All" ? stories : stories.filter((story) => story.rentalType === selectedFilter)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-[#0f0f0f] border-r border-neutral-800">
            <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
              <Image src="/images/dna-group-logo.png" alt="Sedulous" width={120} height={40} className="h-8 w-auto" />
              <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-white" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <Sidebar />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-[#0f0f0f] border-r border-neutral-800 flex-col fixed left-0 top-0 h-full z-40">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-64 z-30">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="lg:hidden text-gray-900" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Stories</h1>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-gray-900">Sami Hamdan</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stories Content */}
        <div className="flex-1 p-4 lg:p-6 overflow-auto mt-16 bg-gray-50">
          <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Stories Management</h1>
              <p className="text-gray-600 mt-1">
                Manage Instagram-style car stories - {filteredStories.length} stories
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-6 rounded-xl flex items-center gap-2 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add New Story
            </Button>
          </div>

          {/* Rental Type Filter Buttons */}
          <div className="mb-6 flex flex-wrap gap-2">
            {["All", "Rent", "Flexi Hire", "PCO Hire", "Sales"].map((type) => (
              <Button
                key={type}
                onClick={() => setSelectedFilter(type as any)}
                variant={selectedFilter === type ? "default" : "outline"}
                className={`${
                  selectedFilter === type
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } font-medium`}
              >
                {type}
              </Button>
            ))}
          </div>

          {filteredStories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="bg-white rounded-3xl shadow-xl p-12 max-w-lg w-full text-center">
                <div className="mb-6 flex justify-center">
                  <div className="bg-red-50 p-6 rounded-full">
                    <ImageIcon className="h-16 w-16 text-red-500" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Stories Yet</h2>
                <p className="text-gray-600 mb-8">
                  Create engaging Instagram-style stories to showcase your cars. Link stories to vehicles so customers
                  can easily book them.
                </p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-8 py-6 rounded-xl flex items-center gap-2 font-semibold mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Create Your First Story
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {filteredStories.map((story) => {
                const displayThumbnail = story.thumbnail || (story.stories && story.stories[0]?.image) || ""
                const isDeleting = (story as any).deleting

                return (
                  <div
                    key={story.id}
                    className={`bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl transition-shadow duration-300 ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="relative aspect-square bg-gradient-to-br from-red-500 via-red-400 to-red-600 p-1">
                      <div className="relative h-full w-full overflow-hidden rounded-xl bg-black">
                        {thumbnailLoading[story.id] && (
                          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 z-10" />
                        )}
                        {displayThumbnail ? (
                          <Image
                            src={displayThumbnail || "/placeholder.svg"}
                            alt={story.title}
                            fill
                            className="object-cover"
                            onLoad={() => {
                              console.log("[v0] Thumbnail loaded:", story.id)
                              setThumbnailLoading((prev) => ({ ...prev, [story.id]: false }))
                            }}
                            onError={(e) => {
                              console.error("[v0] Failed to load story thumbnail:", story.id, displayThumbnail)
                              setThumbnailLoading((prev) => ({ ...prev, [story.id]: false }))
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                            <ImageIcon className="h-12 w-12 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {story.status}
                      </div>
                    </div>

                    <div className="p-3">
                      <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">{story.title}</h3>
                      <p className="text-xs text-gray-500 mb-1">Linked to: {story.carName}</p>
                      <p className="text-xs text-blue-600 font-medium mb-1">{story.rentalType || "Rent"}</p>
                      <p className="text-xs text-gray-400">{story.stories.length} slides</p>

                      {/* Improved Button Visibility */}
                      <div className="mt-3 flex gap-2">
                        <Link href={`/car/${story.linkedCarId}`} target="_blank" className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-blue-200 font-medium"
                            disabled={isDeleting}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(story.id)}
                          disabled={isDeleting}
                          className="flex-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200 font-medium disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <div className="h-3 w-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {showAddModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Story</h2>
                  <button
                    onClick={() => {
                      setShowAddModal(false)
                      previewUrls.forEach((url) => URL.revokeObjectURL(url))
                      setPreviewUrls([])
                      setStoryFiles([])
                      setSelectedRentalType("Rent")
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Rental Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedRentalType}
                      onChange={(e) => setSelectedRentalType(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    >
                      <option value="Rent">Rent</option>
                      <option value="Flexi Hire">Flexi Hire</option>
                      <option value="PCO Hire">PCO Hire</option>
                      <option value="Sales">Sales</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Stories will only appear when users select this category
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Select Car <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCarId}
                      onChange={(e) => setSelectedCarId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                    >
                      <option value="">Choose a car...</option>
                      {cars.map((car) => (
                        <option key={car.id} value={car.id}>
                          {car.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Story will be linked to this car. Users can book the car from the story.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Story Images/Videos <span className="text-red-500">*</span>
                    </label>

                    <label className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-500 hover:bg-red-50/50 transition-colors">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700 mb-1">Click to upload images or videos</p>
                        <p className="text-xs text-gray-500">JPG, PNG, MP4, or WEBP (Max 10MB each)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>

                    {previewUrls.length > 0 && (
                      <div className="mt-4 grid grid-cols-3 gap-3">
                        {previewUrls.map((url, index) => (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                          >
                            <Image
                              src={url || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-gray-500 mt-2">
                      Upload multiple files for a slideshow effect. Each slide displays for 5 seconds.
                    </p>
                  </div>

                  {isUploading && (
                    <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full" />
                          <span className="text-sm font-semibold text-blue-900">Uploading...</span>
                        </div>
                        <span className="text-sm font-bold text-blue-900">{uploadProgress}%</span>
                      </div>

                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>

                      {currentUploadFile && (
                        <p className="text-xs text-blue-700 truncate">Uploading: {currentUploadFile}</p>
                      )}

                      <p className="text-xs text-blue-600">
                        Your story will appear on the website immediately after upload completes
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddModal(false)
                        previewUrls.forEach((url) => URL.revokeObjectURL(url))
                        setPreviewUrls([])
                        setStoryFiles([])
                        setSelectedRentalType("Rent")
                      }}
                      className="flex-1 bg-black text-white hover:bg-gray-800 border-black"
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStory}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      disabled={isUploading}
                    >
                      {isUploading ? "Publishing..." : "Create Story"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
