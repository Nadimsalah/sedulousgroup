"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CalendarIcon,
  Car,
  Users,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  DollarSign,
  Activity,
} from "lucide-react"
import { getAdminStats } from "@/app/actions/admin"
import { Bar, BarChart, Line, LineChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBookings: 0,
    pending: 0,
    approved: 0,
    onRent: 0,
    overdue: 0,
    completed: 0,
    rejected: 0,
    totalCars: 0,
    availableCars: 0,
    totalCustomers: 0,
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const data = await getAdminStats()

      const now = new Date()
      const overdue =
        data.bookings?.filter((b: any) => {
          const status = (b.status || "").toLowerCase()
          if (!["active", "approved", "confirmed"].includes(status)) return false
          const dropoffDate = new Date(b.dropoff_date)
          return dropoffDate < now
        }).length || 0

      setStats({
        totalBookings: data.stats.totalBookings,
        pending: data.stats.pendingBookings,
        approved: data.bookings?.filter((b: any) => (b.status || "").toLowerCase() === "approved").length || 0,
        onRent: data.stats.activeBookings,
        overdue,
        completed: data.bookings?.filter((b: any) => (b.status || "").toLowerCase() === "completed").length || 0,
        rejected: data.bookings?.filter((b: any) => (b.status || "").toLowerCase() === "rejected").length || 0,
        totalCars: data.cars?.length || 0,
        availableCars: data.cars?.filter((c: any) => (c.status || "").toLowerCase() === "available").length || 0,
        totalCustomers: data.stats.totalCustomers,
      })
    } catch (error) {
      console.error("Error loading stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const bookingStatusData = [
    { name: "Pending", value: stats.pending, color: "#facc15" },
    { name: "Approved", value: stats.approved, color: "#60a5fa" },
    { name: "Active", value: stats.onRent, color: "#34d399" },
    { name: "Completed", value: stats.completed, color: "#9ca3af" },
    { name: "Rejected", value: stats.rejected, color: "#ef4444" },
  ]

  const monthlyBookingsData = [
    { month: "Jan", bookings: 12 },
    { month: "Feb", bookings: 19 },
    { month: "Mar", bookings: 15 },
    { month: "Apr", bookings: 25 },
    { month: "May", bookings: 22 },
    { month: "Jun", bookings: 30 },
  ]

  const revenueData = [
    { month: "Jan", revenue: 24000 },
    { month: "Feb", revenue: 38000 },
    { month: "Mar", revenue: 30000 },
    { month: "Apr", revenue: 50000 },
    { month: "May", revenue: 44000 },
    { month: "Jun", revenue: 60000 },
  ]

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Hero Header */}
      <div className="liquid-glass border border-white/10 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-red-950/20 to-black">
        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-white/60 text-sm md:text-lg">
          Welcome back! Here's what's happening with your business today.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="liquid-glass border-white/10 hover:border-red-500/30 transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Bookings</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <CalendarIcon className="h-5 w-5 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{isLoading ? "..." : stats.totalBookings}</div>
            <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-green-500/30 transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Active Rentals</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Car className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{isLoading ? "..." : stats.onRent}</div>
            <p className="text-xs text-white/60 mt-2">Currently on road</p>
          </CardContent>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-yellow-500/30 transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Pending Requests</CardTitle>
            <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{isLoading ? "..." : stats.pending}</div>
            <p className="text-xs text-white/60 mt-2">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-blue-500/30 transition-all hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Customers</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{isLoading ? "..." : stats.totalCustomers}</div>
            <p className="text-xs text-white/60 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+8%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Pie Chart */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="liquid-glass border-white/10">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <Activity className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              Booking Status Distribution
            </CardTitle>
            <CardDescription className="text-white/60 text-sm">Current breakdown of all bookings</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="w-full aspect-square max-h-[350px]">
              <ChartContainer
                config={{
                  pending: { label: "Pending", color: "#facc15" },
                  approved: { label: "Approved", color: "#60a5fa" },
                  active: { label: "Active", color: "#34d399" },
                  completed: { label: "Completed", color: "#9ca3af" },
                  rejected: { label: "Rejected", color: "#ef4444" },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={5}
                      dataKey="value"
                      label={(entry) => (entry.value > 0 ? `${entry.name}: ${entry.value}` : "")}
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Bookings Bar Chart */}
        <Card className="liquid-glass border-white/10">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
              Monthly Bookings Trend
            </CardTitle>
            <CardDescription className="text-white/60 text-sm">Bookings over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="w-full aspect-square max-h-[350px]">
              <ChartContainer
                config={{
                  bookings: { label: "Bookings", color: "#ef4444" },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyBookingsData}>
                    <XAxis dataKey="month" stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
                    <YAxis stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="#ef4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Line Chart */}
        <Card className="liquid-glass border-white/10 lg:col-span-2">
          <CardHeader className="p-4 md:p-6">
            <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              Revenue Overview
            </CardTitle>
            <CardDescription className="text-white/60 text-sm">Monthly revenue performance</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="w-full h-[250px] md:h-[350px]">
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "#34d399" },
                }}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <XAxis dataKey="month" stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
                    <YAxis stroke="#ffffff40" tick={{ fill: "#ffffff80", fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#34d399"
                      strokeWidth={3}
                      dot={{ fill: "#34d399", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Overview Grid */}
      <Card className="liquid-glass border-white/10">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-white text-xl md:text-2xl">Booking Status Overview</CardTitle>
          <CardDescription className="text-white/60 text-sm">
            Detailed breakdown of all booking statuses
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="liquid-glass border border-yellow-500/20 rounded-xl p-6 hover:border-yellow-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Pending</p>
                  <p className="text-4xl font-bold text-yellow-400">{isLoading ? "..." : stats.pending}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </div>

            <div className="liquid-glass border border-blue-500/20 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Approved</p>
                  <p className="text-4xl font-bold text-blue-400">{isLoading ? "..." : stats.approved}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="liquid-glass border border-green-500/20 rounded-xl p-6 hover:border-green-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">On Rent</p>
                  <p className="text-4xl font-bold text-green-400">{isLoading ? "..." : stats.onRent}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Car className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="liquid-glass border border-red-500/20 rounded-xl p-6 hover:border-red-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Overdue</p>
                  <p className="text-4xl font-bold text-red-400">{isLoading ? "..." : stats.overdue}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>

            <div className="liquid-glass border border-gray-500/20 rounded-xl p-6 hover:border-gray-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Completed</p>
                  <p className="text-4xl font-bold text-gray-400">{isLoading ? "..." : stats.completed}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="liquid-glass border border-red-500/20 rounded-xl p-6 hover:border-red-500/50 transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/60 mb-1">Rejected</p>
                  <p className="text-4xl font-bold text-red-400">{isLoading ? "..." : stats.rejected}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Link href="/admin/requests">
          <Card className="liquid-glass border-white/10 hover:border-red-500/50 transition-all hover:scale-105 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <CalendarIcon className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle className="text-white text-xl">View All Requests</CardTitle>
              <CardDescription className="text-white/60">Manage pending and active booking requests</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/cars">
          <Card className="liquid-glass border-white/10 hover:border-red-500/50 transition-all hover:scale-105 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Car className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle className="text-white text-xl">Manage Cars</CardTitle>
              <CardDescription className="text-white/60">View and manage your entire fleet</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/admin/agreements">
          <Card className="liquid-glass border-white/10 hover:border-red-500/50 transition-all hover:scale-105 cursor-pointer h-full">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
              <CardTitle className="text-white text-xl">Rental Agreements</CardTitle>
              <CardDescription className="text-white/60">Generate and manage rental contracts</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
