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
import { getDamageReports, createDamageReport } from "@/app/actions/damage-reports"
import { getCarsAction } from "@/app/actions/database"
import { toast } from "sonner"

export default function DamageReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [isCreating, setIsCreating] = useState(false)

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
    const [fetchedReports, fetchedVehicles] = await Promise.all([getDamageReports(), getCarsAction()])
    setReports(fetchedReports)
    setVehicles(fetchedVehicles)
    setIsLoading(false)
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
    if (!newReport.vehicleId || !newReport.description) {
      toast.error("Please fill required fields")
      return
    }

    setIsCreating(true)
    const result = await createDamageReport({
      ...newReport,
      bookingId: "",
      agreementId: "",
      damagePhotos: uploadedPhotos,
      damageVideos: [],
      responsibleParty: "customer",
      notes: "",
    })

    if (result.success) {
      toast.success("Report created!")
      setShowCreateDialog(false)
      loadData()
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
    } else {
      toast.error("Failed to create report")
    }
    setIsCreating(false)
  }

  const filteredReports = reports.filter(
    (r) =>
      r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.damageType?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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

        {/* Search */}
        <div className="liquid-glass rounded-xl p-3 border border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search by description or damage type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
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
      </div>
    </div>
  )
}
