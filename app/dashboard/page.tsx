"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Car, Clock, TrendingUp, Package, FileText, Camera, Loader2, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { getUserDashboardData, type UserDashboardData } from "@/app/actions/user-dashboard"
import { createClient } from "@/lib/supabase/client"

export default function UserDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<UserDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        console.error("Error loading dashboard:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
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
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "completed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/placeholder-logo.png"
              alt="Sedulous"
              width={120}
              height={40}
              priority
              className="h-10 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 rounded-full">
            <TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-white/10">
              <Package className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full data-[state=active]:bg-white/10">
              <Car className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="agreements" className="rounded-full data-[state=active]:bg-white/10">
              <FileText className="w-4 h-4 mr-2" />
              Agreements
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-full data-[state=active]:bg-white/10">
              <Camera className="w-4 h-4 mr-2" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Profile Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-red-500/30">
                    {user.full_name.charAt(0).toUpperCase()}
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
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Activity Overview</h3>
                  <Badge variant="outline" className="border-red-500/30 text-red-400">
                    Last 30 Days
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <Car className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{safeStats.totalBookings}</p>
                    <p className="text-xs text-gray-500 uppercase">Total Bookings</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <TrendingUp className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-2xl font-bold text-white">{safeStats.activeBookings}</p>
                    <p className="text-xs text-gray-500 uppercase">Active Bookings</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <Clock className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-2xl font-bold text-white">£{safeStats.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 uppercase">Total Spent</p>
                  </div>
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    <Package className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-lg font-bold text-white">
                      {lastBooking ? new Date(lastBooking.created_at).toLocaleDateString("en-GB") : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500 uppercase">Last Booking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking History */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Booking History</h3>
              {bookings.length === 0 ? (
                <div className="text-center py-12">
                  <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No activity yet</p>
                  <p className="text-gray-500 text-sm mb-4">Start by making your first booking</p>
                  <Link href="/">
                    <Button className="bg-red-500 hover:bg-red-600 text-white">Browse Cars</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 bg-black/30 rounded-xl border border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                          {booking.car_image ? (
                            <Image
                              src={booking.car_image || "/placeholder.svg"}
                              alt={booking.car_name || ""}
                              width={48}
                              height={48}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <Car className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {booking.car_brand} {booking.car_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {booking.pickup_date} - {booking.dropoff_date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-white">£{booking.total_amount.toFixed(2)}</p>
                        <Badge className={getStatusColor(booking.status)}>{booking.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Bookings</h2>
              <Link href="/">
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  <Car className="w-4 h-4 mr-2" />
                  New Booking
                </Button>
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No bookings yet</p>
                <p className="text-gray-500 text-sm mb-4">Start by making your first booking</p>
                <Link href="/">
                  <Button className="bg-red-500 hover:bg-red-600 text-white">Browse Cars</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
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
                        <Link href={`/my-bookings/${booking.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/10 text-gray-300 hover:bg-white/5 bg-transparent"
                          >
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <div key={agreement.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
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
                          <Link href={`/agreement/sign/${agreement.id}`}>
                            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white">
                              Sign Agreement
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <h2 className="text-2xl font-bold text-white">My Documents</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">Document management coming soon</p>
                <p className="text-gray-500 text-sm">Upload and manage your driving license, ID, and other documents</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
