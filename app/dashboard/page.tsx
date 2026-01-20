"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Clock, TrendingUp, Package, FileText, Camera, Loader2, LogOut, Upload, Download, CheckCircle2, XCircle, Eye, AlertTriangle, RotateCcw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getUserDashboardData, type UserDashboardData } from "@/app/actions/user-dashboard"
import { getUserProfileAction } from "@/app/actions/database"
import { createClient } from "@/lib/supabase/client"
import { generateInvoiceAction } from "@/app/actions/invoice"

export default function UserDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null)

  // Refs for file inputs
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleViewInvoice = async (e: React.MouseEvent, bookingId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setGeneratingInvoice(bookingId)

    try {
      const result = await generateInvoiceAction(bookingId)
      if (result.success && result.pdfBase64) {
        // Create Blob from base64
        const byteCharacters = atob(result.pdfBase64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, '_blank');
      } else {
        alert(result.error || "Failed to generate invoice")
      }
    } catch (err) {
      console.error("Invoice generation error:", err)
      alert("Failed to generate invoice")
    } finally {
      setGeneratingInvoice(null)
    }
  }

  // ... (keep existing code)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getUserDashboardData()

        if (!result.success || !result.data) {
          if (result.error === "Not authenticated") {
            router.replace("/login")
            return
          }
          setError(result.error || "Failed to load data")
          return
        }

        setData(result.data)
        console.log("[v0] Dashboard data loaded:", {
          bookings: result.data?.bookings.length,
          agreements: result.data?.agreements.length,
          stats: result.data?.stats,
        })
        // Log all bookings statuses
        console.log("[v0] All booking statuses:", result.data?.bookings.map(b => ({
          id: b.id,
          status: b.status,
          can_resubmit: b.can_resubmit
        })))

        // Log any rejected bookings
        const rejectedBookings = result.data?.bookings.filter(b =>
          b.status.toLowerCase().includes('reject')
        )
        if (rejectedBookings && rejectedBookings.length > 0) {
          console.log("[v0] Rejected bookings found:", rejectedBookings.map(b => ({
            id: b.id,
            status: b.status,
            can_resubmit: b.can_resubmit,
            rejection_reason: b.rejection_reason
          })))
        } else {
          console.log("[v0] No rejected bookings found")
        }
      } catch (err) {
        console.error("Error loading dashboard:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
    loadUserProfile()
  }, [router])

  const loadUserProfile = async () => {
    try {
      setDocumentsLoading(true)
      const profile = await getUserProfileAction()
      setUserProfile(profile)
    } catch (err) {
      console.error("Error loading user profile:", err)
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleFileUpload = async (field: string, file: File | null, inputElement?: HTMLInputElement) => {
    if (!file) {
      console.error("[v0] No file provided")
      return
    }

    console.log("[v0] Starting upload for field:", field, "File:", file.name, "Size:", file.size, "Type:", file.type)

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      alert("File size exceeds 10MB limit. Please choose a smaller file.")
      return
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      alert("Invalid file type. Please upload a JPEG, PNG, WEBP, or PDF file.")
      return
    }

    setUploading(field)
    try {
      const formData = new FormData()
      formData.append("file", file)

      console.log("[v0] Sending upload request to /api/upload")
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("[v0] Upload response status:", response.status)
      const data = await response.json()
      console.log("[v0] Upload response data:", data)

      if (!response.ok) {
        throw new Error(data.error || "Upload failed")
      }

      if (!data.url) {
        throw new Error("No URL returned from upload")
      }

      console.log("[v0] File uploaded successfully, URL:", data.url)
      console.log("[v0] Updating user profile with field:", field)

      // Update user profile with the new document URL
      const { updateUserProfileAction } = await import("@/app/actions/database")
      const updateResult = await updateUserProfileAction({
        [field]: data.url,
      })

      console.log("[v0] Profile update result:", updateResult)

      if (!updateResult.success) {
        throw new Error(updateResult.error || "Failed to update profile")
      }

      // Reset file input
      if (inputElement) {
        inputElement.value = ""
      }

      // Reload profile to show updated documents
      await loadUserProfile()
      alert("Document uploaded successfully!")
    } catch (error) {
      console.error("[v0] Error uploading document:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      alert(`Failed to upload document: ${errorMessage}`)
    } finally {
      setUploading(null)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.replace("/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.replace("/login")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Error</h2>
          <p className="text-gray-400 mb-4">{error || "Failed to load data"}</p>
          <Button onClick={() => router.push("/login")}>Go to Login</Button>
        </div>
      </div>
    )
  }

  const { user, bookings, agreements, stats } = data

  // Ensure stats always have values (default to 0 if undefined)
  const safeStats = {
    totalBookings: stats?.totalBookings ?? 0,
    activeBookings: stats?.activeBookings ?? 0,
    totalAgreements: stats?.totalAgreements ?? 0,
    totalSpent: stats?.totalSpent ?? 0,
  }
  const activeBookings = bookings.filter((b) => ["confirmed", "active", "approved"].includes(b.status.toLowerCase()))
  const completedBookings = bookings.filter((b) => b.status.toLowerCase() === "completed")
  const lastBooking = bookings.length > 0 ? bookings[0] : null

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
      case "approved":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "active":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30"
      case "pending":
      case "pending details":
      case "pending review":
      case "documents submitted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "cancelled":
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      case "documents rejected":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 liquid-glass sticky top-0 z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between relative">
          <Link href="/">
            <Image
              src="/images/dna-group-logo.png"
              alt="Sedulous Group Ltd logo"
              width={120}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 liquid-glass rounded-full px-4 py-2 hover:bg-white/10 transition-all">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 blur-md opacity-50" />
                <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold shadow-lg">
                  {user.full_name.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 bg-transparent transition-all hover:shadow-lg hover:shadow-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
            <TabsList className="liquid-glass p-1.5 gap-2 inline-flex w-auto">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all"
              >
                My Bookings
              </TabsTrigger>
              <TabsTrigger
                value="agreements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all"
              >
                My Agreements
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all"
              >
                My Invoices
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/30 transition-all"
              >
                <Camera className="w-4 h-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="liquid-glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-red-500/50">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{safeStats.totalBookings}</p>
                      <p className="text-xs text-gray-500">Bookings</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{safeStats.totalAgreements}</p>
                      <p className="text-xs text-gray-500">Agreements</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Overview */}
              <div className="md:col-span-2 liquid-glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
                  <div className="flex items-center gap-3">
                    <Link href="/">
                      <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all">
                        <Car className="w-4 h-4 mr-2" />
                        New Booking
                      </Button>
                    </Link>
                    <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/5">
                      Last 30 Days
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="liquid-glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 bg-red-500/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                      <div className="relative bg-red-500/10 rounded-lg p-2.5 group-hover:bg-red-500/20 transition-all">
                        <Car className="w-7 h-7 text-red-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{safeStats.totalBookings}</p>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Total Bookings</p>
                  </div>
                  <div className="liquid-glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 bg-green-500/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                      <div className="relative bg-green-500/10 rounded-lg p-2.5 group-hover:bg-green-500/20 transition-all">
                        <TrendingUp className="w-7 h-7 text-green-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{safeStats.activeBookings}</p>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Active Bookings</p>
                  </div>
                  <div className="liquid-glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                      <div className="relative bg-blue-500/10 rounded-lg p-2.5 group-hover:bg-blue-500/20 transition-all">
                        <Clock className="w-7 h-7 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">£{safeStats.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Total Spent</p>
                  </div>
                  <div className="liquid-glass rounded-xl p-4 hover:bg-white/10 transition-all duration-300 group">
                    <div className="relative w-12 h-12 mb-3">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-lg blur-md group-hover:blur-lg transition-all" />
                      <div className="relative bg-purple-500/10 rounded-lg p-2.5 group-hover:bg-purple-500/20 transition-all">
                        <Package className="w-7 h-7 text-purple-400" />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-white">
                      {lastBooking ? new Date(lastBooking.created_at).toLocaleDateString("en-GB") : "N/A"}
                    </p>
                    <p className="text-xs text-white/50 uppercase tracking-wider mt-1">Last Booking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div className="liquid-glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Recent Bookings</h3>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all">
                    <Car className="w-4 h-4 mr-2" />
                    New Booking
                  </Button>
                </Link>
              </div>
              {bookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                    <div className="relative bg-red-500/10 rounded-full p-4">
                      <Car className="w-12 h-12 text-red-400" />
                    </div>
                  </div>
                  <p className="text-white text-lg font-semibold mb-2">No bookings yet</p>
                  <p className="text-white/50 text-sm mb-6">Start your journey by making your first booking</p>
                  <Link href="/">
                    <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30">Browse Cars</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <Link
                      key={booking.id}
                      href={`/my-bookings/${booking.id}`}
                      className="block liquid-glass rounded-2xl p-6 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer group active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-5">
                        {/* Car Image */}
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative w-24 h-24 liquid-glass rounded-2xl flex items-center justify-center overflow-hidden">
                            {booking.car_image ? (
                              <Image
                                src={booking.car_image || "/placeholder.svg"}
                                alt={booking.car_name || ""}
                                width={96}
                                height={96}
                                className="rounded-2xl object-cover w-full h-full"
                              />
                            ) : (
                              <Car className="w-10 h-10 text-red-400" />
                            )}
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-lg leading-tight mb-1">
                                {booking.car_brand} {booking.car_name}
                              </h3>
                              <div className="flex items-center gap-2 text-sm text-white/50">
                                <span>{booking.pickup_date}</span>
                                <span className="text-white/30">→</span>
                                <span>{booking.dropoff_date}</span>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <div className="text-sm text-white/50">
                              <span className="text-xs uppercase tracking-wider">Total Amount</span>
                            </div>
                            <p className="font-bold text-white text-2xl">£{booking.total_amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {bookings.length > 5 && (
                    <Link href="#" onClick={(e) => { e.preventDefault(); (document.querySelector('[value="bookings"]') as HTMLElement)?.click(); }}>
                      <div className="liquid-glass rounded-xl p-4 hover:bg-white/10 hover:border-red-500/30 transition-all duration-300 cursor-pointer text-center group">
                        <p className="text-white/60 text-sm group-hover:text-white transition-colors">
                          View all {bookings.length} bookings →
                        </p>
                      </div>
                    </Link>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">My Bookings</h2>
              <Link href="/">
                <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all">
                  <Car className="w-4 h-4 mr-2" />
                  New Booking
                </Button>
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="liquid-glass rounded-2xl p-16 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl" />
                  <div className="relative bg-red-500/10 rounded-full p-4">
                    <Car className="w-12 h-12 text-red-400" />
                  </div>
                </div>
                <p className="text-white text-lg font-semibold mb-2">No bookings yet</p>
                <p className="text-white/50 text-sm mb-6">Start your journey by making your first booking</p>
                <Link href="/">
                  <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/30">Browse Cars</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const statusLower = booking.status.toLowerCase()
                  const isDocumentsRejected = statusLower === "documents rejected"
                  const isPermanentlyRejected = statusLower === "rejected"
                  const isRejected = isDocumentsRejected || isPermanentlyRejected
                  // Can resubmit if status is "Documents Rejected" (not permanently "Rejected")
                  // Also check can_resubmit field if it exists
                  const canResubmit = isDocumentsRejected && booking.can_resubmit !== false

                  return (
                    <div key={booking.id} className={`bg-white/5 border rounded-xl overflow-hidden ${isRejected ? (canResubmit ? 'border-orange-500/50' : 'border-red-500/50') : 'border-white/10'}`}>
                      {/* Rejection Alert Banner */}
                      {isRejected && (
                        <div className={`px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${canResubmit ? 'bg-orange-500/10 border-b border-orange-500/20' : 'bg-red-500/10 border-b border-red-500/20'}`}>
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${canResubmit ? 'bg-orange-500/20' : 'bg-red-500/20'}`}>
                              <AlertTriangle className={`w-5 h-5 ${canResubmit ? 'text-orange-400' : 'text-red-400'}`} />
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-sm tracking-tight ${canResubmit ? 'text-orange-400' : 'text-red-400'}`}>
                                {canResubmit ? 'DOCUMENTS NEED ATTENTION' : 'BOOKING PERMANENTLY REJECTED'}
                              </p>
                              <p className="text-gray-300 text-xs mt-1 leading-relaxed">
                                {booking.rejection_reason || (canResubmit
                                  ? 'Some of your documents were not accepted. Please upload clearer copies.'
                                  : 'Your booking has been rejected and cannot be resubmitted. Please contact support for more information.')}
                              </p>
                              {booking.rejection_notes && (
                                <p className="text-gray-500 text-[11px] mt-1.5 italic flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-gray-500" />
                                  Note: {booking.rejection_notes}
                                </p>
                              )}
                            </div>
                          </div>
                          {canResubmit && (
                            <Link href={`/resubmit-documents/${booking.id}`} className="w-full sm:w-auto">
                              <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold h-10 px-6 shadow-lg shadow-orange-600/20">
                                <RotateCcw className="w-3.5 h-3.5 mr-2" />
                                Re-upload Documents
                              </Button>
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Booking Card Content */}
                      <Link
                        href={`/my-bookings/${booking.id}`}
                        className="block p-6 hover:bg-white/5 transition-all cursor-pointer active:scale-[0.99]"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                              {booking.car_image ? (
                                <Image
                                  src={booking.car_image || "/placeholder.svg"}
                                  alt={booking.car_name || ""}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                />
                              ) : (
                                <Car className="w-8 h-8 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-white text-lg">
                                {booking.car_brand} {booking.car_name}
                              </h3>
                              <p className="text-gray-400 text-sm">Booking ID: {booking.id.slice(0, 8)}...</p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>{booking.pickup_date}</span>
                                <span>→</span>
                                <span>{booking.dropoff_date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                            <p className="text-xl font-bold text-white">£{booking.total_amount.toFixed(2)}</p>

                            {/* Invoice Button - Stop propagation to prevent card click */}
                            {["approved", "paid", "confirmed", "active", "completed"].includes(booking.status.toLowerCase()) && (
                              <div onClick={(e) => e.preventDefault()}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs border-white/20 hover:bg-white/10"
                                  onClick={(e) => handleViewInvoice(e, booking.id)}
                                  disabled={generatingInvoice === booking.id}
                                >
                                  {generatingInvoice === booking.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <Download className="w-3 h-3 mr-1" />
                                  )}
                                  Invoice
                                </Button>
                              </div>
                            )}

                            <div className="text-xs text-gray-400 mt-1">Click to view details</div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Agreements Tab */}
          <TabsContent value="agreements" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Agreements</h2>

            {agreements.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No agreements yet</p>
                <p className="text-gray-500 text-sm">Agreements will appear here once your bookings are confirmed</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {agreements.map((agreement) => (
                  <Link
                    key={agreement.id}
                    href={agreement.booking_id ? `/my-bookings/${agreement.booking_id}` : `/agreement/sign/${agreement.id}`}
                    className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-red-500/50 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">Agreement #{agreement.agreement_number}</h3>
                        <p className="text-gray-400 text-sm">
                          {agreement.car_brand} {agreement.car_name}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{agreement.start_date}</span>
                          <span>→</span>
                          <span>{agreement.end_date}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(agreement.status || agreement.agreement_status)}>
                          {agreement.status || agreement.agreement_status}
                        </Badge>
                        <p className="text-xl font-bold text-white">£{agreement.total_amount.toFixed(2)}</p>
                        {agreement.signed_at ? (
                          <span className="text-xs text-green-400">Signed</span>
                        ) : (
                          <span className="text-xs text-yellow-400">Click to view & sign</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Invoices</h2>

            {bookings.filter(b => ["approved", "paid", "confirmed", "active", "completed"].includes(b.status.toLowerCase())).length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No invoices available</p>
                <p className="text-gray-500 text-sm">Invoices will appear here once your bookings are approved</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings
                  .filter(b => ["approved", "paid", "confirmed", "active", "completed"].includes(b.status.toLowerCase()))
                  .map((booking) => (
                    <div
                      key={`inv-${booking.id}`}
                      className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white text-lg">Invoice #{booking.id.slice(0, 8).toUpperCase()}</h3>
                          <p className="text-gray-400 text-sm">
                            {booking.car_brand} {booking.car_name}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{new Date(booking.created_at).toLocaleDateString("en-GB")}</span>
                            <span>•</span>
                            <span className="text-white font-medium">£{booking.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={(e) => handleViewInvoice(e, booking.id)}
                            disabled={generatingInvoice === booking.id}
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            {generatingInvoice === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Download Invoice
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Documents</h2>
            </div>

            {documentsLoading ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading documents...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {/* Driving License Front */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Driving License (Front)</h3>
                        <p className="text-sm text-gray-400">Upload the front of your driving license</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.drivingLicenseFrontUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.drivingLicenseFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["drivingLicenseFrontUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("drivingLicenseFrontUrl", file, input)
                        }}
                        disabled={uploading === "drivingLicenseFrontUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "drivingLicenseFrontUrl"}
                        onClick={() => fileInputRefs.current["drivingLicenseFrontUrl"]?.click()}
                      >
                        {uploading === "drivingLicenseFrontUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.drivingLicenseFrontUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Driving License Back */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Driving License (Back)</h3>
                        <p className="text-sm text-gray-400">Upload the back of your driving license</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.drivingLicenseBackUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.drivingLicenseBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["drivingLicenseBackUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("drivingLicenseBackUrl", file, input)
                        }}
                        disabled={uploading === "drivingLicenseBackUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "drivingLicenseBackUrl"}
                        onClick={() => fileInputRefs.current["drivingLicenseBackUrl"]?.click()}
                      >
                        {uploading === "drivingLicenseBackUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.drivingLicenseBackUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Proof of Address */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Proof of Address</h3>
                        <p className="text-sm text-gray-400">Upload a utility bill or bank statement</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.proofOfAddressUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.proofOfAddressUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["proofOfAddressUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("proofOfAddressUrl", file, input)
                        }}
                        disabled={uploading === "proofOfAddressUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "proofOfAddressUrl"}
                        onClick={() => fileInputRefs.current["proofOfAddressUrl"]?.click()}
                      >
                        {uploading === "proofOfAddressUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.proofOfAddressUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Bank Statement */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Bank Statement</h3>
                        <p className="text-sm text-gray-400">Upload a recent bank statement (optional)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.bankStatementUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.bankStatementUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["bankStatementUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("bankStatementUrl", file, input)
                        }}
                        disabled={uploading === "bankStatementUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "bankStatementUrl"}
                        onClick={() => fileInputRefs.current["bankStatementUrl"]?.click()}
                      >
                        {uploading === "bankStatementUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.bankStatementUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Private Hire License Front */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Private Hire License (Front)</h3>
                        <p className="text-sm text-gray-400">Upload the front of your PCO license (optional)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.privateHireLicenseFrontUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.privateHireLicenseFrontUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["privateHireLicenseFrontUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("privateHireLicenseFrontUrl", file, input)
                        }}
                        disabled={uploading === "privateHireLicenseFrontUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "privateHireLicenseFrontUrl"}
                        onClick={() => fileInputRefs.current["privateHireLicenseFrontUrl"]?.click()}
                      >
                        {uploading === "privateHireLicenseFrontUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.privateHireLicenseFrontUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Private Hire License Back */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Private Hire License (Back)</h3>
                        <p className="text-sm text-gray-400">Upload the back of your PCO license (optional)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {userProfile?.privateHireLicenseBackUrl ? (
                        <>
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Uploaded
                          </Badge>
                          <a
                            href={userProfile.privateHireLicenseBackUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-5 h-5 text-gray-400" />
                          </a>
                        </>
                      ) : (
                        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Uploaded
                        </Badge>
                      )}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        ref={(el) => { fileInputRefs.current["privateHireLicenseBackUrl"] = el }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          const input = e.target as HTMLInputElement
                          if (file) handleFileUpload("privateHireLicenseBackUrl", file, input)
                        }}
                        disabled={uploading === "privateHireLicenseBackUrl"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                        disabled={uploading === "privateHireLicenseBackUrl"}
                        onClick={() => fileInputRefs.current["privateHireLicenseBackUrl"]?.click()}
                      >
                        {uploading === "privateHireLicenseBackUrl" ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {userProfile?.privateHireLicenseBackUrl ? "Replace" : "Upload"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
