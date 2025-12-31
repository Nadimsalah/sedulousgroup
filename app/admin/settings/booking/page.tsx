"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getBookingSettings, updateBookingSettings } from "@/app/actions/settings"

export default function BookingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    minBookingDays: "1",
    maxBookingDays: "30",
    advanceBookingDays: "90",
    bufferHours: "2",
    autoApproval: false,
    requireDocuments: true,
    requireDeposit: true,
    allowModification: true,
    modificationDeadlineHours: "24",
    cancellationDeadlineHours: "48",
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const data = await getBookingSettings()
      setSettings({
        minBookingDays: String(data.min_booking_days || 1),
        maxBookingDays: String(data.max_booking_days || 30),
        advanceBookingDays: String(data.advance_booking_days || 90),
        bufferHours: String(data.buffer_hours || 2),
        autoApproval: data.auto_approval || false,
        requireDocuments: data.require_documents !== false,
        requireDeposit: data.require_deposit !== false,
        allowModification: data.allow_modification !== false,
        modificationDeadlineHours: String(data.modification_deadline_hours || 24),
        cancellationDeadlineHours: String(data.cancellation_deadline_hours || 48),
      })
    } catch (error) {
      console.error("Error loading booking settings:", error)
      toast.error("Failed to load booking settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateBookingSettings({
        min_booking_days: Number.parseInt(settings.minBookingDays) || 1,
        max_booking_days: Number.parseInt(settings.maxBookingDays) || 30,
        advance_booking_days: Number.parseInt(settings.advanceBookingDays) || 90,
        buffer_hours: Number.parseInt(settings.bufferHours) || 2,
        auto_approval: settings.autoApproval,
        require_documents: settings.requireDocuments,
        require_deposit: settings.requireDeposit,
        allow_modification: settings.allowModification,
        modification_deadline_hours: Number.parseInt(settings.modificationDeadlineHours) || 24,
        cancellation_deadline_hours: Number.parseInt(settings.cancellationDeadlineHours) || 48,
      })

      if (result.success) {
        toast.success("Booking settings saved successfully")
      } else {
        const errorMsg = result.error || "Failed to save booking settings"
        toast.error(errorMsg, {
          action: errorMsg.includes("table does not exist") ? {
            label: "Setup Database",
            onClick: () => window.location.href = "/admin/settings/setup"
          } : undefined
        })
      }
    } catch (error) {
      console.error("Error saving booking settings:", error)
      toast.error("Failed to save booking settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading booking settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Booking Settings</h1>
          <p className="text-white/60 mt-1">Configure booking rules and restrictions</p>
        </div>
      </div>

      <Card className="liquid-glass border-white/10 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-white font-semibold mb-4">Duration Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="minBookingDays" className="text-white">
                  Minimum Booking (Days)
                </Label>
                <Input
                  id="minBookingDays"
                  type="number"
                  value={settings.minBookingDays}
                  onChange={(e) => setSettings({ ...settings, minBookingDays: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxBookingDays" className="text-white">
                  Maximum Booking (Days)
                </Label>
                <Input
                  id="maxBookingDays"
                  type="number"
                  value={settings.maxBookingDays}
                  onChange={(e) => setSettings({ ...settings, maxBookingDays: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advanceBookingDays" className="text-white">
                  Advance Booking (Days)
                </Label>
                <Input
                  id="advanceBookingDays"
                  type="number"
                  value={settings.advanceBookingDays}
                  onChange={(e) => setSettings({ ...settings, advanceBookingDays: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bufferHours" className="text-white">
                  Buffer Between Bookings (Hours)
                </Label>
                <Input
                  id="bufferHours"
                  type="number"
                  value={settings.bufferHours}
                  onChange={(e) => setSettings({ ...settings, bufferHours: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h3 className="text-white font-semibold mb-4">Booking Policies</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Auto Approval</Label>
                  <p className="text-sm text-white/60">Automatically approve new bookings</p>
                </div>
                <Switch
                  checked={settings.autoApproval}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoApproval: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Require Documents</Label>
                  <p className="text-sm text-white/60">Customer must upload documents</p>
                </div>
                <Switch
                  checked={settings.requireDocuments}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireDocuments: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Require Deposit</Label>
                  <p className="text-sm text-white/60">Customer must pay deposit</p>
                </div>
                <Switch
                  checked={settings.requireDeposit}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireDeposit: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white font-medium">Allow Modifications</Label>
                  <p className="text-sm text-white/60">Allow customers to modify bookings</p>
                </div>
                <Switch
                  checked={settings.allowModification}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowModification: checked })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
            <div className="space-y-2">
              <Label htmlFor="modificationDeadline" className="text-white">
                Modification Deadline (Hours)
              </Label>
              <Input
                id="modificationDeadline"
                type="number"
                value={settings.modificationDeadlineHours}
                onChange={(e) => setSettings({ ...settings, modificationDeadlineHours: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/40">Hours before pickup when modifications are no longer allowed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationDeadline" className="text-white">
                Cancellation Deadline (Hours)
              </Label>
              <Input
                id="cancellationDeadline"
                type="number"
                value={settings.cancellationDeadlineHours}
                onChange={(e) => setSettings({ ...settings, cancellationDeadlineHours: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-xs text-white/40">Hours before pickup for free cancellation</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
