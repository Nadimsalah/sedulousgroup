"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Plus,
  Trash2,
  Eye,
  Upload,
  X,
  ImageIcon,
  Loader2,
  Search,
  Filter,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import {
  getStoriesAction,
  getCarsAction,
  addStoryAction,
  deleteStoryAction,
  type Story,
  type Car,
} from "@/app/actions/database"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [cars, setCars] = useState<Car[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<"All" | "Rent" | "Flexi Hire" | "PCO Hire" | "Sales">("All")

  // Add story form state
  const [selectedCarId, setSelectedCarId] = useState("")
  const [selectedRentalType, setSelectedRentalType] = useState<"Rent" | "Flexi Hire" | "PCO Hire" | "Sales">("Rent")
  const [storyFiles, setStoryFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentUploadFile, setCurrentUploadFile] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const fetchedStories = await getStoriesAction()
      const fetchedCars = await getCarsAction()
      setStories(fetchedStories || [])
      setCars(fetchedCars || [])
    } catch (error) {
      console.error("Error loading stories:", error)
      toast.error("Failed to load stories")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (story: Story) => {
    setStoryToDelete(story)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!storyToDelete) return

    try {
      await deleteStoryAction(storyToDelete.id)
      toast.success("Story deleted successfully")
      await loadData()
      setShowDeleteModal(false)
      setStoryToDelete(null)
    } catch (error) {
      console.error("Error deleting story:", error)
      toast.error("Failed to delete story")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Validate file sizes
    const maxImageSize = 10 * 1024 * 1024 // 10MB
    const maxVideoSize = 100 * 1024 * 1024 // 100MB
    
    for (const file of files) {
      const isVideo = file.type.startsWith("video/")
      const maxSize = isVideo ? maxVideoSize : maxImageSize
      const maxSizeLabel = isVideo ? "100MB" : "10MB"
      
      if (file.size > maxSize) {
        toast.error(`${file.name} exceeds ${maxSizeLabel} limit. Please choose a smaller file.`)
        return
      }
    }
    
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
      toast.error("Please select a car")
      return
    }

    const selectedCar = cars.find((car) => car.id === selectedCarId)
    if (!selectedCar) {
      toast.error("Selected car not found")
      return
    }

    if (storyFiles.length === 0) {
      toast.error("Please upload at least one story image or video")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < storyFiles.length; i++) {
        const file = storyFiles[i]
        setCurrentUploadFile(file.name)

        // Upload the main file
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const result = await response.json()
        uploadedUrls.push(result.url)

        const progress = Math.round(((i + 1) / storyFiles.length) * 100)
        setUploadProgress(progress)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Use the car's image as the thumbnail
      const carThumbnail = selectedCar.image || (selectedCar.images && selectedCar.images[0]) || uploadedUrls[0]

      await addStoryAction({
        title: selectedCar.name,
        linkedCarId: selectedCarId,
        carName: selectedCar.name,
        thumbnail: carThumbnail, // Use car's image as thumbnail
        stories: uploadedUrls.map((url) => ({
          image: url,
          duration: 5000,
        })),
        status: "Published",
        rentalType: selectedRentalType,
      })

      toast.success("Story created successfully")
      await loadData()

      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      setShowAddModal(false)
      setSelectedCarId("")
      setSelectedRentalType("Rent")
      setStoryFiles([])
      setPreviewUrls([])
      setUploadProgress(0)
      setCurrentUploadFile("")
    } catch (error) {
      console.error("Error creating story:", error)
      toast.error(`Failed to create story: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsUploading(false)
    }
  }

  const filteredStories = stories.filter((story) => {
    const matchesFilter = selectedFilter === "All" || story.rentalType === selectedFilter
    const matchesSearch =
      story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      story.carName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading stories...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stories Management</h1>
          <p className="text-white/60 mt-2">Manage Instagram-style car stories</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Story
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="liquid-glass border-white/10 p-4">
          <div className="text-white/60 text-sm">Total Stories</div>
          <div className="text-2xl font-bold text-white mt-1">{stories.length}</div>
        </Card>
        <Card className="liquid-glass border-white/10 p-4">
          <div className="text-white/60 text-sm">Rent Stories</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stories.filter((s) => s.rentalType === "Rent").length}
          </div>
        </Card>
        <Card className="liquid-glass border-white/10 p-4">
          <div className="text-white/60 text-sm">Flexi Hire</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stories.filter((s) => s.rentalType === "Flexi Hire").length}
          </div>
        </Card>
        <Card className="liquid-glass border-white/10 p-4">
          <div className="text-white/60 text-sm">PCO Hire</div>
          <div className="text-2xl font-bold text-white mt-1">
            {stories.filter((s) => s.rentalType === "PCO Hire").length}
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="liquid-glass border-white/10 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search stories by title or car name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black border-white/10 text-white placeholder:text-white/40"
            />
          </div>
          <div className="flex gap-2">
            {["All", "Rent", "Flexi Hire", "PCO Hire", "Sales"].map((type) => (
              <Button
                key={type}
                onClick={() => setSelectedFilter(type as any)}
                variant={selectedFilter === type ? "default" : "outline"}
                className={
                  selectedFilter === type
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "border-white/10 text-white hover:bg-white/10"
                }
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stories Grid */}
      {filteredStories.length === 0 ? (
        <Card className="liquid-glass border-white/10 p-12 text-center">
          <ImageIcon className="h-16 w-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Stories Found</h3>
          <p className="text-white/60 mb-6">
            {searchQuery || selectedFilter !== "All"
              ? "Try adjusting your search or filter criteria"
              : "Create your first story to showcase your cars"}
          </p>
          {!searchQuery && selectedFilter === "All" && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Story
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredStories.map((story) => {
            const displayThumbnail = story.thumbnail || (story.stories && story.stories[0]?.image) || ""

            return (
              <Card key={story.id} className="liquid-glass border-white/10 overflow-hidden hover:border-white/20 transition-all">
                <div className="relative aspect-square bg-gradient-to-br from-red-500/20 to-red-600/20">
                  {displayThumbnail ? (
                    <Image
                      src={displayThumbnail}
                      alt={story.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-white/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {story.status || "Published"}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 truncate">{story.title}</h3>
                  <p className="text-xs text-white/60 mb-1">Car: {story.carName}</p>
                  <p className="text-xs text-red-400 font-medium mb-2">{story.rentalType || "Rent"}</p>
                  <p className="text-xs text-white/40 mb-3">{story.stories.length} slides</p>
                  <div className="flex gap-2">
                    <Link href={`/car/${story.linkedCarId}`} target="_blank" className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/10 text-white hover:bg-white/10"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(story)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Story Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="liquid-glass border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Story</DialogTitle>
            <DialogDescription className="text-white/60">
              Create an Instagram-style story to showcase your cars
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <Label className="text-white">Rental Category *</Label>
              <select
                value={selectedRentalType}
                onChange={(e) => setSelectedRentalType(e.target.value as any)}
                className="w-full mt-2 bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="Rent">Rent</option>
                <option value="Flexi Hire">Flexi Hire</option>
                <option value="PCO Hire">PCO Hire</option>
                <option value="Sales">Sales</option>
              </select>
              <p className="text-xs text-white/60 mt-1">Stories will only appear when users select this category</p>
            </div>

            <div>
              <Label className="text-white">Select Car *</Label>
              <select
                value={selectedCarId}
                onChange={(e) => setSelectedCarId(e.target.value)}
                className="w-full mt-2 bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Choose a car...</option>
                {cars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-white">Story Images/Videos *</Label>
              <label className="cursor-pointer">
                <div className="mt-2 border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-red-500/50 hover:bg-red-500/5 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-white/40 mb-3" />
                  <p className="text-sm font-medium text-white mb-1">Click to upload images or videos</p>
                  <p className="text-xs text-white/60">JPG, PNG, MP4, WEBM, or WEBP (Images: Max 10MB, Videos: Max 100MB)</p>
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
                  {previewUrls.map((url, index) => {
                    const file = storyFiles[index]
                    const isVideo = file?.type?.startsWith("video/")
                    
                    return (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-white/10">
                        {isVideo ? (
                          <video
                            src={url}
                            className="w-full h-full object-cover"
                            controls={false}
                            muted
                            playsInline
                          />
                        ) : (
                          <Image src={url} alt={`Preview ${index + 1}`} fill className="object-cover" />
                        )}
                        <button
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          {isVideo && <span className="text-red-400">▶</span>}
                          {index + 1}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2 p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                    <span className="text-sm font-medium text-white">Uploading...</span>
                  </div>
                  <span className="text-sm font-bold text-white">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-red-500/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {currentUploadFile && (
                  <p className="text-xs text-white/60 truncate">Uploading: {currentUploadFile}</p>
                )}
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
                className="flex-1 border-white/10 text-white hover:bg-white/10"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddStory}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Story"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="liquid-glass border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription className="text-white/60">
              Are you sure you want to delete "{storyToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false)
                setStoryToDelete(null)
              }}
              className="flex-1 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
