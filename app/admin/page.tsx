"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import {
  Home,
  Calendar,
  CheckCircle,
  Car,
  Users,
  FileText,
  Camera,
  AlertTriangle,
  Wrench,
  CreditCard,
  Ticket,
  ImageIcon,
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
  Activity,
  ArrowRight,
} from "lucide-react"
import { getAdminStats } from "@/app/actions/admin"

interface DashboardPage {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
  gradient: string
  stats?: {
    label: string
    value: number | string
    isLoading?: boolean
  }
}

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
    profit: {
      all: 0,
      today: 0,
      yesterday: 0,
      week: 0,
      month: 0,
    },
  })

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Stats loading timed out")), 10000)
      )

      const data = await Promise.race([getAdminStats(), timeoutPromise]) as Awaited<ReturnType<typeof getAdminStats>>

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
        profit: data.stats.profit || {
          all: 0,
          today: 0,
          yesterday: 0,
          week: 0,
          month: 0,
        },
      })
    } catch (error) {
      console.error("Error loading stats:", error)
      // Set default stats on error so page still loads
      setStats({
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
        profit: {
          all: 0,
          today: 0,
          yesterday: 0,
          week: 0,
          month: 0,
        },
      })
    } finally {
      setIsLoading(false)
    }
  }


  const dashboardPages: DashboardPage[] = [
    {
      name: "Bookings Schedule",
      href: "/admin/requests",
      icon: Calendar,
      description: "View and manage all booking requests",
      color: "from-blue-500/20 to-blue-600/20",
      gradient: "bg-gradient-to-br",
      stats: {
        label: "Pending Requests",
        value: stats.pending,
        isLoading,
      },
    },
    {
      name: "Active Bookings",
      href: "/admin/active-bookings",
      icon: CheckCircle,
      description: "Monitor currently active rentals",
      color: "from-green-500/20 to-green-600/20",
      gradient: "bg-gradient-to-br",
      stats: {
        label: "On Rent",
        value: stats.onRent,
        isLoading,
      },
    },
    {
      name: "Vehicles",
      href: "/admin/vehicles",
      icon: Car,
      description: "Manage your entire vehicle fleet",
      color: "from-purple-500/20 to-purple-600/20",
      gradient: "bg-gradient-to-br",
      stats: {
        label: "Total Vehicles",
        value: stats.totalCars,
        isLoading,
      },
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: Users,
      description: "View customer profiles and history",
      color: "from-cyan-500/20 to-cyan-600/20",
      gradient: "bg-gradient-to-br",
      stats: {
        label: "Total Customers",
        value: stats.totalCustomers,
        isLoading,
      },
    },
    {
      name: "Agreements",
      href: "/admin/agreements",
      icon: FileText,
      description: "Generate and manage rental contracts",
      color: "from-orange-500/20 to-orange-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Inspections",
      href: "/admin/inspections",
      icon: Camera,
      description: "Vehicle handover and return inspections",
      color: "from-pink-500/20 to-pink-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Damage Reports",
      href: "/admin/damage-reports",
      icon: AlertTriangle,
      description: "Track and manage vehicle damage",
      color: "from-red-500/20 to-red-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Vendors",
      href: "/admin/vendors",
      icon: Wrench,
      description: "Manage service providers and vendors",
      color: "from-yellow-500/20 to-yellow-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Deposits",
      href: "/admin/deposits",
      icon: CreditCard,
      description: "Manage customer deposits and refunds",
      color: "from-indigo-500/20 to-indigo-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "PCNs / Tickets",
      href: "/admin/pcn-tickets",
      icon: Ticket,
      description: "Handle parking and traffic tickets",
      color: "from-rose-500/20 to-rose-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Stories",
      href: "/admin/stories",
      icon: ImageIcon,
      description: "Manage Instagram-style car stories",
      color: "from-violet-500/20 to-violet-600/20",
      gradient: "bg-gradient-to-br",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      description: "Configure system settings and preferences",
      color: "from-gray-500/20 to-gray-600/20",
      gradient: "bg-gradient-to-br",
    },
  ]

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      {/* Header */}
      <div className="liquid-glass border-white/10 rounded-2xl p-6 md:p-8 bg-gradient-to-br from-red-950/20 to-black">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-white/60 text-sm md:text-base">
          Welcome back! Manage your rental business from one central location.
        </p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="liquid-glass border-white/10 hover:border-red-500/30 transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-red-500" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.totalBookings}
            </div>
            <p className="text-sm text-white/60">Total Bookings</p>
          </div>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-green-500/30 transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Car className="h-6 w-6 text-green-500" />
              </div>
              <Activity className="h-5 w-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.onRent}
            </div>
            <p className="text-sm text-white/60">Active Rentals</p>
          </div>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-yellow-500/30 transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.pending}
            </div>
            <p className="text-sm text-white/60">Pending Requests</p>
          </div>
        </Card>

        <Card className="liquid-glass border-white/10 hover:border-blue-500/30 transition-all">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : stats.totalCustomers}
            </div>
            <p className="text-sm text-white/60">Total Customers</p>
          </div>
        </Card>
      </div>

      {/* Profit Statistics */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-green-400" />
          Profit Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="liquid-glass border-white/10 hover:border-green-500/30 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `£${stats.profit.all.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-white/60">All Time Profit</p>
            </div>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-blue-500/30 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `£${stats.profit.today.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-white/60">Today</p>
            </div>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-purple-500/30 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
                <Clock className="h-5 w-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `£${stats.profit.yesterday.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-white/60">Yesterday</p>
            </div>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-cyan-500/30 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-cyan-500" />
                </div>
                <Activity className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `£${stats.profit.week.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-white/60">This Week</p>
            </div>
          </Card>

          <Card className="liquid-glass border-white/10 hover:border-orange-500/30 transition-all">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-orange-500" />
                </div>
                <TrendingUp className="h-5 w-5 text-orange-400" />
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  `£${stats.profit.month.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-sm text-white/60">This Month</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {isLoading ? "..." : stats.approved}
          </div>
          <p className="text-xs text-white/60">Approved</p>
        </Card>
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-gray-400 mb-1">
            {isLoading ? "..." : stats.completed}
          </div>
          <p className="text-xs text-white/60">Completed</p>
        </Card>
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {isLoading ? "..." : stats.overdue}
          </div>
          <p className="text-xs text-white/60">Overdue</p>
        </Card>
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-red-400 mb-1">
            {isLoading ? "..." : stats.rejected}
          </div>
          <p className="text-xs text-white/60">Rejected</p>
        </Card>
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {isLoading ? "..." : stats.totalCars}
          </div>
          <p className="text-xs text-white/60">Total Cars</p>
        </Card>
        <Card className="liquid-glass border-white/10 p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400 mb-1">
            {isLoading ? "..." : stats.availableCars}
          </div>
          <p className="text-xs text-white/60">Available</p>
        </Card>
      </div>

      {/* All Pages Overview */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dashboardPages.map((page) => {
            const Icon = page.icon
            return (
              <Link key={page.href} href={page.href}>
                <Card className="liquid-glass border-0 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 cursor-pointer group h-full">
                  <div className={`p-6 ${page.gradient} ${page.color} rounded-xl`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-red-400 transition-colors">
                      {page.name}
                    </h3>
                    <p className="text-sm text-white/70 mb-4">{page.description}</p>
                    {page.stats && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="text-2xl font-bold text-white">
                          {page.stats.isLoading ? (
                            <Loader2 className="h-6 w-6 animate-spin inline-block" />
                          ) : (
                            page.stats.value
                          )}
                        </div>
                        <p className="text-xs text-white/60 mt-1">{page.stats.label}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Vehicle Categories Quick Links */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Vehicle Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { name: "Rent", href: "/admin/cars", color: "from-blue-500/20 to-blue-600/20" },
            { name: "Flexi Hire", href: "/admin/flexi-hire", color: "from-green-500/20 to-green-600/20" },
            { name: "PCO Hire", href: "/admin/pco-hire", color: "from-purple-500/20 to-purple-600/20" },
            { name: "Sales", href: "/admin/sales", color: "from-orange-500/20 to-orange-600/20" },
          ].map((category) => (
            <Link key={category.href} href={category.href}>
              <Card className={`liquid-glass border-white/10 hover:border-white/20 transition-all cursor-pointer bg-gradient-to-br ${category.color}`}>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                      <p className="text-sm text-white/60">Manage {category.name} vehicles</p>
                    </div>
                    <Car className="h-8 w-8 text-white/40" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
