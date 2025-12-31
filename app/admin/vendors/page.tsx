"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit2, Trash2, FileText, Star, Phone, Mail, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getVendors, createVendor, updateVendor, deleteVendor } from "@/app/actions/vendors"
import type { Vendor } from "@/lib/database"

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [newVendor, setNewVendor] = useState({
    name: "",
    vendorType: "mechanic",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  })

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const fetchedVendors = await getVendors()
      setVendors(fetchedVendors)
    } catch (error) {
      console.error("Error loading vendors:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateVendor = async () => {
    try {
      const result = await createVendor(newVendor)

      if (result.success) {
        setShowCreateDialog(false)
        loadVendors()
        setNewVendor({
          name: "",
          vendorType: "mechanic",
          contactPerson: "",
          email: "",
          phone: "",
          address: "",
          notes: "",
        })
      }
    } catch (error) {
      console.error("Error creating vendor:", error)
    }
  }

  const handleUpdateVendor = async () => {
    if (!selectedVendor) return

    try {
      const result = await updateVendor(selectedVendor.id, {
        name: selectedVendor.name,
        contactPerson: selectedVendor.contactPerson,
        email: selectedVendor.email,
        phone: selectedVendor.phone,
        address: selectedVendor.address,
        notes: selectedVendor.notes,
        isActive: selectedVendor.isActive,
      })

      if (result.success) {
        setShowEditDialog(false)
        loadVendors()
      }
    } catch (error) {
      console.error("Error updating vendor:", error)
    }
  }

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return

    try {
      const result = await deleteVendor(vendorId)
      if (result.success) {
        loadVendors()
      }
    } catch (error) {
      console.error("Error deleting vendor:", error)
    }
  }

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.vendorType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.contactPerson && vendor.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.isActive).length,
    inactive: vendors.filter((v) => !v.isActive).length,
    mechanics: vendors.filter((v) => v.vendorType === "mechanic").length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white/60">Loading vendors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Vendors</h1>
            <p className="text-white/60 text-sm mt-1">Manage suppliers, mechanics, and service providers</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-red-500 hover:bg-red-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black border-white/10 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Vendor</DialogTitle>
                <DialogDescription className="text-white/60">Create a new vendor or service provider</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-white/80 text-sm">Vendor Name</Label>
                  <Input
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    placeholder="Enter vendor name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Vendor Type</Label>
                  <Select
                    value={newVendor.vendorType}
                    onValueChange={(v) => setNewVendor({ ...newVendor, vendorType: v })}
                  >
                    <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="mechanic" className="text-white hover:bg-white/10">
                        Mechanic
                      </SelectItem>
                      <SelectItem value="body_shop" className="text-white hover:bg-white/10">
                        Body Shop
                      </SelectItem>
                      <SelectItem value="supplier" className="text-white hover:bg-white/10">
                        Supplier
                      </SelectItem>
                      <SelectItem value="insurance" className="text-white hover:bg-white/10">
                        Insurance
                      </SelectItem>
                      <SelectItem value="other" className="text-white hover:bg-white/10">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Contact Person</Label>
                  <Input
                    value={newVendor.contactPerson}
                    onChange={(e) => setNewVendor({ ...newVendor, contactPerson: e.target.value })}
                    placeholder="Contact person name"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Email</Label>
                  <Input
                    type="email"
                    value={newVendor.email}
                    onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                    placeholder="vendor@example.com"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Phone</Label>
                  <Input
                    type="tel"
                    value={newVendor.phone}
                    onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                    placeholder="+44 20 1234 5678"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Address</Label>
                  <Textarea
                    value={newVendor.address}
                    onChange={(e) => setNewVendor({ ...newVendor, address: e.target.value })}
                    placeholder="Full address..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <div>
                  <Label className="text-white/80 text-sm">Notes</Label>
                  <Textarea
                    value={newVendor.notes}
                    onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })}
                    placeholder="Additional information..."
                    rows={2}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40 mt-1"
                  />
                </div>

                <Button onClick={handleCreateVendor} className="w-full bg-red-500 hover:bg-red-600">
                  Create Vendor
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="liquid-glass rounded-lg p-3 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Total Vendors</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="liquid-glass rounded-lg p-3 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Active</p>
            <p className="text-2xl font-bold text-green-500">{stats.active}</p>
          </div>
          <div className="liquid-glass rounded-lg p-3 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Inactive</p>
            <p className="text-2xl font-bold text-red-500">{stats.inactive}</p>
          </div>
          <div className="liquid-glass rounded-lg p-3 border border-white/10">
            <p className="text-white/60 text-xs mb-1">Mechanics</p>
            <p className="text-2xl font-bold text-blue-500">{stats.mechanics}</p>
          </div>
        </div>

        {/* Search */}
        <div className="liquid-glass rounded-lg p-3 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              type="text"
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Vendors Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="liquid-glass rounded-lg p-4 border border-white/10 hover:border-red-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">{vendor.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {vendor.vendorType.replace("_", " ")}
                    </Badge>
                  </div>
                  <Badge variant={vendor.isActive ? "default" : "secondary"} className="text-xs">
                    {vendor.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  {vendor.contactPerson && (
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      <span className="font-semibold">Contact:</span> {vendor.contactPerson}
                    </p>
                  )}

                  {vendor.email && (
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {vendor.email}
                    </p>
                  )}

                  {vendor.phone && (
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      <Phone className="h-3 w-3" />
                      {vendor.phone}
                    </p>
                  )}

                  {vendor.address && (
                    <p className="text-sm text-white/60 flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      {vendor.address.substring(0, 30)}...
                    </p>
                  )}
                </div>

                {vendor.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < vendor.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}`}
                      />
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-transparent border-white/10 hover:bg-white/5"
                    onClick={() => {
                      setSelectedVendor(vendor)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-500 hover:text-red-600 bg-transparent border-white/10 hover:bg-white/5"
                    onClick={() => handleDeleteVendor(vendor.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="liquid-glass rounded-lg border border-white/10 p-12 text-center">
            <FileText className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-2">No vendors found</p>
            <p className="text-white/60 mb-4">Add your first vendor to get started</p>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-red-500 hover:bg-red-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add First Vendor
            </Button>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {selectedVendor && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-black border-white/10 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label className="text-white/80 text-sm">Vendor Name</Label>
                <Input
                  value={selectedVendor.name}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, name: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Contact Person</Label>
                <Input
                  value={selectedVendor.contactPerson || ""}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, contactPerson: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Email</Label>
                <Input
                  type="email"
                  value={selectedVendor.email || ""}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, email: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Phone</Label>
                <Input
                  type="tel"
                  value={selectedVendor.phone || ""}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, phone: e.target.value })}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Address</Label>
                <Textarea
                  value={selectedVendor.address || ""}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, address: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-white/80 text-sm">Notes</Label>
                <Textarea
                  value={selectedVendor.notes || ""}
                  onChange={(e) => setSelectedVendor({ ...selectedVendor, notes: e.target.value })}
                  rows={2}
                  className="bg-white/5 border-white/10 text-white mt-1"
                />
              </div>
              <Button onClick={handleUpdateVendor} className="w-full bg-red-500 hover:bg-red-600">
                Update Vendor
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
