"use client"

import { useState, useEffect } from "react"
import {
  User,
  Mail,
  Phone,
  Calendar,
  Plus,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  FileText,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@supabase/supabase-js"

interface Driver {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  license_number: string
  license_expiry: string
  status: "active" | "inactive" | "suspended" | "pending"
  total_trips: number
  rating: number
  joined_at: string
  notes: string | null
  profile_image: string | null
}

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [filteredDrivers, setFilteredDrivers] = useState<Driver[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    license_number: "",
    license_expiry: "",
    notes: "",
  })

  useEffect(() => {
    loadDrivers()
  }, [])

  useEffect(() => {
    filterDrivers()
  }, [drivers, searchQuery, statusFilter])

  const loadDrivers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createAdminSupabase()
      const { data, error: fetchError } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) {
        // If table doesn't exist, show empty state
        if (fetchError.code === "42P01") {
          setDrivers([])
          setError("Drivers table not found. Please create the table first.")
        } else {
          setError(fetchError.message)
        }
      } else {
        setDrivers(data || [])
      }
    } catch (err) {
      setError("Failed to load drivers")
    } finally {
      setIsLoading(false)
    }
  }

  const filterDrivers = () => {
    let filtered = drivers
    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.status === statusFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d) =>
          d.full_name?.toLowerCase().includes(query) ||
          d.email?.toLowerCase().includes(query) ||
          d.phone?.toLowerCase().includes(query) ||
          d.license_number?.toLowerCase().includes(query),
      )
    }
    setFilteredDrivers(filtered)
  }

  const handleAddDriver = async () => {
    try {
      const supabase = createAdminSupabase()
      const { error: insertError } = await supabase.from("drivers").insert({
        ...formData,
        status: "pending",
        total_trips: 0,
        rating: 5.0,
        joined_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      setShowAddDialog(false)
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        license_number: "",
        license_expiry: "",
        notes: "",
      })
      loadDrivers()
    } catch (err) {
      setError("Failed to add driver")
    }
  }

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      const supabase = createAdminSupabase()
      const { error: updateError } = await supabase.from("drivers").update({ status: newStatus }).eq("id", driverId)

      if (updateError) throw updateError
      loadDrivers()
    } catch (err) {
      setError("Failed to update driver status")
    }
  }

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return
    try {
      const supabase = createAdminSupabase()
      const { error: deleteError } = await supabase.from("drivers").delete().eq("id", driverId)
      if (deleteError) throw deleteError
      loadDrivers()
    } catch (err) {
      setError("Failed to delete driver")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 border border-green-500/30"
      case "inactive":
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
      case "suspended":
        return "bg-red-500/10 text-red-500 border border-red-500/30"
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border border-yellow-500/30"
      default:
        return "bg-gray-500/10 text-gray-500 border border-gray-500/30"
    }
  }

  const stats = {
    total: drivers.length,
    active: drivers.filter((d) => d.status === "active").length,
    pending: drivers.filter((d) => d.status === "pending").length,
    suspended: drivers.filter((d) => d.status === "suspended").length,
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Drivers Management</h1>
            <p className="text-gray-400 mt-1">Manage all registered drivers and their documents</p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Drivers</CardTitle>
              <User className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.active}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Suspended</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.suspended}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black border-zinc-700 text-white placeholder-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "active", "pending", "inactive", "suspended"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? "bg-red-500 hover:bg-red-600" : "border-zinc-700 text-gray-300"}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
            <Button
              onClick={loadDrivers}
              size="sm"
              variant="outline"
              className="border-zinc-700 bg-transparent"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">{error}</div>}

        {/* Drivers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-4 border-zinc-700 border-t-red-500 rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-400 mt-4">Loading drivers...</p>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="col-span-full bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
              <User className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No drivers found</p>
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 bg-red-500 hover:bg-red-600">
                <Plus className="h-4 w-4 mr-2" />
                Add First Driver
              </Button>
            </div>
          ) : (
            filteredDrivers.map((driver) => (
              <Card key={driver.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                        {driver.profile_image ? (
                          <img
                            src={driver.profile_image || "/placeholder.svg"}
                            alt={driver.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{driver.full_name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDriver(driver)
                            setShowDetailsDialog(true)
                          }}
                          className="text-gray-300 cursor-pointer hover:bg-zinc-800"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(driver.id, "active")}
                          className="text-green-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Activate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(driver.id, "suspended")}
                          className="text-yellow-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteDriver(driver.id)}
                          className="text-red-400 cursor-pointer hover:bg-zinc-800"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{driver.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span>{driver.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileText className="h-4 w-4" />
                      <span>License: {driver.license_number}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Calendar className="h-4 w-4" />
                      <span>Expires: {driver.license_expiry}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-800">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">{driver.total_trips || 0}</p>
                      <p className="text-xs text-gray-400">Trips</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-500">{driver.rating?.toFixed(1) || "5.0"}</p>
                      <p className="text-xs text-gray-400">Rating</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
            <DialogDescription className="text-gray-400">Enter driver details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-400">Full Name</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="John Doe"
              />
            </div>
            <div>
              <Label className="text-gray-400">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label className="text-gray-400">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="+44 7700 900000"
              />
            </div>
            <div>
              <Label className="text-gray-400">Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="123 Main St, London"
              />
            </div>
            <div>
              <Label className="text-gray-400">License Number</Label>
              <Input
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="ABCD123456"
              />
            </div>
            <div>
              <Label className="text-gray-400">License Expiry</Label>
              <Input
                type="date"
                value={formData.license_expiry}
                onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-black border-zinc-700 text-white mt-1"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleAddDriver} className="flex-1 bg-red-500 hover:bg-red-600">
                Add Driver
              </Button>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-zinc-700">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Driver Details</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedDriver.full_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(selectedDriver.status)}`}>
                    {selectedDriver.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-400">Email</Label>
                  <p className="text-white">{selectedDriver.email}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Phone</Label>
                  <p className="text-white">{selectedDriver.phone}</p>
                </div>
                <div>
                  <Label className="text-gray-400">License Number</Label>
                  <p className="text-white">{selectedDriver.license_number}</p>
                </div>
                <div>
                  <Label className="text-gray-400">License Expiry</Label>
                  <p className="text-white">{selectedDriver.license_expiry}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Total Trips</Label>
                  <p className="text-white">{selectedDriver.total_trips}</p>
                </div>
                <div>
                  <Label className="text-gray-400">Rating</Label>
                  <p className="text-white">{selectedDriver.rating?.toFixed(1)}</p>
                </div>
              </div>
              {selectedDriver.notes && (
                <div>
                  <Label className="text-gray-400">Notes</Label>
                  <p className="text-white">{selectedDriver.notes}</p>
                </div>
              )}
              <Button variant="outline" onClick={() => setShowDetailsDialog(false)} className="w-full border-zinc-700">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
