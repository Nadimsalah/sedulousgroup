"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Mail, Phone, Calendar, MapPin, Car, Filter, Download, Eye, MoreVertical, ChevronDown } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const ITEMS_PER_PAGE = 15

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  location: string
  joinedDate: string
  totalBookings: number
  activeBookings: number
  totalSpent: number
  status: string
  lastBooking: string | null
  avatar_url?: string
}

export default function CustomersClient({
  initialCustomers,
  initialStats,
}: {
  initialCustomers: Customer[]
  initialStats: any
}) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "blocked">("all")
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE)

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
  }, [searchQuery, statusFilter])

  const handleLoadMore = useCallback(() => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE)
  }, [])

  const filteredCustomers = initialCustomers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)

    const matchesStatus = statusFilter === "all" || customer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Lazy loading
  const displayedCustomers = filteredCustomers.slice(0, displayCount)
  const hasMore = displayedCustomers.length < filteredCustomers.length

  const exportToCSV = () => {
    try {
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Location",
        "Joined Date",
        "Total Bookings",
        "Active Bookings",
        "Total Spent",
        "Status",
        "Last Booking",
      ]
      const csvData = initialCustomers.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.location,
        new Date(c.joinedDate).toLocaleDateString(),
        c.totalBookings,
        c.activeBookings,
        `£${c.totalSpent}`,
        c.status,
        c.lastBooking ? new Date(c.lastBooking).toLocaleDateString() : "N/A",
      ])

      const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join(
        "\n",
      )

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `customers_export_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Customer data exported successfully!")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border border-green-500/30"
      case "inactive":
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
      case "blocked":
        return "bg-red-500/20 text-red-400 border border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30"
    }
  }

  return (
    <>
      {/* Header */}
      <div className="liquid-glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-400 mt-2">Manage and view all your customers from Supabase</p>
          </div>
          <Button
            onClick={exportToCSV}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="liquid-glass rounded-2xl p-4 md:p-6 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-black/50 border-white/20 text-white placeholder:text-gray-500 focus:border-red-500/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-300">Status:</span>
            {["all", "active", "inactive", "blocked"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                  statusFilter === status
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="liquid-glass rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 md:p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Customers ({filteredCustomers.length})
            {displayedCustomers.length < filteredCustomers.length && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Showing {displayedCustomers.length})
              </span>
            )}
          </h2>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No customers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayedCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:bg-white/10 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-white">{customer.name}</h3>
                        <p className="text-sm text-gray-400">Customer ID: {customer.id.slice(0, 8)}</p>
                        <Badge className={`mt-2 ${getStatusColor(customer.status)}`}>{customer.status}</Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-white/10">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm text-white break-all">{customer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm text-white">{customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Location</p>
                        <p className="text-sm text-white">{customer.location}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Joined</p>
                        <p className="text-sm text-white">{new Date(customer.joinedDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400">Total Bookings</p>
                      <p className="text-lg font-bold text-white">{customer.totalBookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Active Bookings</p>
                      <p className="text-lg font-bold text-green-400">{customer.activeBookings}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Spent</p>
                      <p className="text-lg font-bold text-white">£{customer.totalSpent.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Last Booking</p>
                      <p className="text-lg font-bold text-white">
                        {customer.lastBooking ? new Date(customer.lastBooking).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                    <Link href={`/admin/customers/${customer.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-red-500/50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </Link>
                    <Link href={`/admin/customers/${customer.id}#bookings`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-red-500/50"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        View Bookings
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="pt-4">
                  <Button
                    onClick={handleLoadMore}
                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Load More ({filteredCustomers.length - displayedCustomers.length} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
