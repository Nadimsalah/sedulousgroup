"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Plus, AlertTriangle, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getDamageReports, createDamageReport, updateDamageReportStatus } from "@/app/actions/damage-reports"
import { getCarsAction } from "@/app/actions/database"
import { toast } from "sonner"

export default function DamageReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in_progress" | "completed">("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const [newReport, setNewReport] = useState({
    vehicleId: "",
    damageType: "scratch",
    severity: "minor",
    description: "",
    locationOnVehicle: "",
    incidentDate: new Date().toISOString().split("T")[0],
    estimatedCost: 0,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      console.log("[Damage Reports Page] Loading data...")
      const [fetchedReports, fetchedVehicles] = await Promise.all([getDamageReports(), getCarsAction()])
      console.log("[Damage Reports Page] Loaded reports:", fetchedReports.length)
      console.log("[Damage Reports Page] Loaded vehicles:", fetchedVehicles?.length || 0)
      setReports(fetchedReports || [])
      setVehicles(fetchedVehicles || [])
    } catch (error) {
      console.error("[Damage Reports Page] Error loading data:", error)
      toast.error("Failed to load damage reports")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const urls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const formData = new FormData()
      formData.append("file", files[i])
      const response = await fetch("/api/upload", { method: "POST", body: formData })
      if (response.ok) {
        const { url } = await response.json()
        urls.push(url)
      }
    }
    setUploadedPhotos([...uploadedPhotos, ...urls])
  }

  const handleCreateReport = async () => {
    // Validate required fields
    if (!newReport.vehicleId) {
      toast.error("Please select a vehicle")
      return
    }

    if (!newReport.description || newReport.description.trim() === "") {
      toast.error("Please enter a description")
      return
    }

    setIsCreating(true)
    try {
      console.log("[Damage Reports] Creating report:", {
        vehicleId: newReport.vehicleId,
        damageType: newReport.damageType,
        severity: newReport.severity,
        description: newReport.description,
        photosCount: uploadedPhotos.length,
      })

      const result = await createDamageReport({
        vehicleId: newReport.vehicleId,
        damageType: newReport.damageType,
        severity: newReport.severity,
        description: newReport.description,
        locationOnVehicle: newReport.locationOnVehicle || undefined,
        incidentDate: newReport.incidentDate,
        damagePhotos: uploadedPhotos,
        damageVideos: [],
        estimatedCost: newReport.estimatedCost || undefined,
        responsibleParty: "customer",
        notes: "",
        bookingId: undefined,
        agreementId: undefined,
        customerId: undefined,
        reportedBy: undefined,
      })

      console.log("[Damage Reports] Create result:", result)

      if (result.success) {
        toast.success("Damage report created successfully!")
        setShowCreateDialog(false)
        // Reset form
        setNewReport({
          vehicleId: "",
          damageType: "scratch",
          severity: "minor",
          description: "",
          locationOnVehicle: "",
          incidentDate: new Date().toISOString().split("T")[0],
          estimatedCost: 0,
        })
        setUploadedPhotos([])
        // Reload data
        await loadData()
      } else {
        const errorMessage = result.error instanceof Error ? result.error.message : String(result.error)
        console.error("[Damage Reports] Failed to create report:", errorMessage)
        toast.error(`Failed to create report: ${errorMessage}`, {
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("[Damage Reports] Unexpected error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(`Error: ${errorMessage}`, {
        duration: 5000,
      })
    } finally {
      setIsCreating(false)
    }
  }

  const filteredReports = reports.filter((r) => {
    // Apply status filter
    if (filterStatus === "pending" && r.repairStatus !== "pending") return false
    if (filterStatus === "in_progress" && r.repairStatus !== "in_progress") return false
    if (filterStatus === "completed" && r.repairStatus !== "completed") return false
    // filterStatus === "all" shows everything

    // Apply search query
    const query = searchQuery.toLowerCase()
    return (
      r.description?.toLowerCase().includes(query) ||
      r.damageType?.toLowerCase().includes(query) ||
      r.locationOnVehicle?.toLowerCase().includes(query) ||
      vehicles.find((v) => v.id === r.vehicleId)?.name?.toLowerCase().includes(query)
    )
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "moderate":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20"
      case "severe":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.repairStatus === "pending").length,
    inProgress: reports.filter((r) => r.repairStatus === "in_progress").length,
    completed: reports.filter((r) => r.repairStatus === "completed").length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-red-500 mx-auto" />
          <p className="text-white/60">Loading damage reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-3 md:p-4">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <div className="liquid-glass rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Damage Reports</h1>
              <p className="text-sm text-white/60 mt-1">Track and manage vehicle damage reports</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-red-500 hover:bg-red-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-black border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">Create Damage Report</DialogTitle>
                </DialogHeader>

                <div className="space-y-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm text-white">
                      Vehicle <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={newReport.vehicleId}
                      onValueChange={(v) => setNewReport({ ...newReport, vehicleId: v })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select vehicle" />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        {vehicles.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name} - {v.brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-white">Damage Type</Label>
                      <Select
                        value={newReport.damageType}
                        onValueChange={(v) => setNewReport({ ...newReport, damageType: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          {["scratch", "dent", "accident", "mechanical", "interior", "other"].map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm text-white">Severity</Label>
                      <Select
                        value={newReport.severity}
                        onValueChange={(v) => setNewReport({ ...newReport, severity: v })}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-black border-white/10">
                          {["minor", "moderate", "severe"].map((sev) => (
                            <SelectItem key={sev} value={sev}>
                              {sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-white">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={newReport.description}
                      onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                      placeholder="Describe the damage..."
                      rows={3}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-white">Location on Vehicle</Label>
                    <Input
                      value={newReport.locationOnVehicle}
                      onChange={(e) => setNewReport({ ...newReport, locationOnVehicle: e.target.value })}
                      placeholder="e.g., Front bumper"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm text-white">Incident Date</Label>
                      <Input
                        type="date"
                        value={newReport.incidentDate}
                        onChange={(e) => setNewReport({ ...newReport, incidentDate: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm text-white">Estimated Cost (£)</Label>
                      <Input
                        type="number"
                        value={newReport.estimatedCost}
                        onChange={(e) =>
                          setNewReport({ ...newReport, estimatedCost: Number.parseFloat(e.target.value) })
                        }
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm text-white">Photos</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0"
                    />
                    {uploadedPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {uploadedPhotos.map((url, i) => (
                          <img
                            key={i}
                            src={url || "/placeholder.svg"}
                            alt={`Damage ${i + 1}`}
                            className="w-full aspect-square object-cover rounded-lg border border-white/10"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleCreateReport}
                    disabled={isCreating}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    {isCreating ? "Creating..." : "Create Report"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Total</CardTitle>
              <AlertTriangle className="h-4 w-4 text-white/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">In Progress</CardTitle>
              <AlertTriangle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card className="liquid-glass border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/80">Completed</CardTitle>
              <AlertTriangle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="liquid-glass rounded-xl p-3 border border-white/10 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by description, damage type, or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white/70">Filter:</span>
            {[
              { key: "all", label: "All", count: reports.length },
              { key: "pending", label: "Pending", count: stats.pending },
              { key: "in_progress", label: "In Progress", count: stats.inProgress },
              { key: "completed", label: "Completed", count: stats.completed },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setFilterStatus(filter.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterStatus === filter.key
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Reports List */}
        <div className="liquid-glass rounded-xl border border-white/10 p-3 md:p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Damage Reports</h2>

          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white font-medium">No damage reports found</p>
              <p className="text-sm text-white/40 mt-1">Create your first damage report to get started</p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-4 bg-red-500 hover:bg-red-600 text-white">
                Create First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReports.map((report) => {
                const vehicle = vehicles.find((v) => v.id === report.vehicleId)
                return (
                  <div
                    key={report.id}
                    className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-semibold text-white text-sm">{vehicle?.name || "Unknown Vehicle"}</h3>
                          <Badge className={`text-xs ${getSeverityColor(report.severity)}`}>{report.severity}</Badge>
                          <Badge className={`text-xs ${getStatusColor(report.repairStatus)}`}>
                            {report.repairStatus}
                          </Badge>
                        </div>
                        <p className="text-xs text-white/60 mb-1">
                          {report.damageType} - {report.locationOnVehicle}
                        </p>
                        <p className="text-sm text-white/80">{report.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                          <span>{new Date(report.incidentDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>£{report.estimatedCost}</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowViewDialog(true)
                        }}
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* View/Edit Dialog */}
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="bg-black border border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">Damage Report Details</DialogTitle>
            </DialogHeader>

            {selectedReport && (
              <div className="space-y-4 mt-4">
                {/* Report Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-white/60">Vehicle</Label>
                    <p className="text-white font-medium">
                      {vehicles.find((v) => v.id === selectedReport.vehicleId)?.name || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Damage Type</Label>
                    <p className="text-white font-medium capitalize">{selectedReport.damageType}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Severity</Label>
                    <Badge className={`${getSeverityColor(selectedReport.severity)}`}>{selectedReport.severity}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Current Status</Label>
                    <Badge className={`${getStatusColor(selectedReport.repairStatus)}`}>{selectedReport.repairStatus}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Location</Label>
                    <p className="text-white">{selectedReport.locationOnVehicle || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Incident Date</Label>
                    <p className="text-white">{new Date(selectedReport.incidentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Estimated Cost</Label>
                    <p className="text-white">£{selectedReport.estimatedCost || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-white/60">Actual Cost</Label>
                    <p className="text-white">£{selectedReport.actualCost || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm text-white/60">Description</Label>
                  <p className="text-white bg-white/5 p-3 rounded-lg">{selectedReport.description}</p>
                </div>

                {/* Photos */}
                {selectedReport.damagePhotos && selectedReport.damagePhotos.length > 0 && (
                  <div>
                    <Label className="text-sm text-white/60 mb-2 block">Damage Photos</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedReport.damagePhotos.map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Damage ${i + 1}`}
                          className="w-full aspect-square object-cover rounded-lg border border-white/10"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Update */}
                <div className="border-t border-white/10 pt-4">
                  <Label className="text-sm text-white mb-2 block">Update Status</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedReport.repairStatus}
                      onValueChange={async (value) => {
                        setIsUpdating(true)
                        try {
                          const result = await updateDamageReportStatus(selectedReport.id, {
                            repairStatus: value,
                          })
                          if (result.success) {
                            toast.success("Status updated successfully!")
                            await loadData()
                            setSelectedReport({ ...selectedReport, repairStatus: value })
                          } else {
                            toast.error("Failed to update status")
                          }
                        } catch (error) {
                          console.error("Error updating status:", error)
                          toast.error("An error occurred")
                        } finally {
                          setIsUpdating(false)
                        }
                      }}
                      disabled={isUpdating}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black border-white/10">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="no_repair_needed">No Repair Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-white">Actual Cost (£)</Label>
                    <Input
                      type="number"
                      value={selectedReport.actualCost || ""}
                      onChange={async (e) => {
                        const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                        setIsUpdating(true)
                        try {
                          const result = await updateDamageReportStatus(selectedReport.id, {
                            actualCost: value,
                          })
                          if (result.success) {
                            setSelectedReport({ ...selectedReport, actualCost: value })
                            await loadData()
                          }
                        } catch (error) {
                          console.error("Error updating cost:", error)
                        } finally {
                          setIsUpdating(false)
                        }
                      }}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Enter actual cost"
                      disabled={isUpdating}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-white">Repaired By</Label>
                    <Input
                      value={selectedReport.repairedBy || ""}
                      onChange={async (e) => {
                        setIsUpdating(true)
                        try {
                          const result = await updateDamageReportStatus(selectedReport.id, {
                            repairedBy: e.target.value || undefined,
                          })
                          if (result.success) {
                            setSelectedReport({ ...selectedReport, repairedBy: e.target.value })
                            await loadData()
                          }
                        } catch (error) {
                          console.error("Error updating repaired by:", error)
                        } finally {
                          setIsUpdating(false)
                        }
                      }}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="Enter repairer name"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
