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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BookingSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Rent settings
    rent: {
      enabled: true,
      minBookingDays: "1",
      maxBookingDays: "30",
      advanceBookingDays: "90",
      bufferHours: "2",
    },
    // Flexi Hire settings
    flexiHire: {
      enabled: true,
      minBookingDays: "7",
      maxBookingDays: "90",
      advanceBookingDays: "30",
      bufferHours: "4",
    },
    // PCO settings
    pco: {
      enabled: true,
      minBookingDays: "28",
      maxBookingDays: "365",
      advanceBookingDays: "14",
      bufferHours: "6",
    },
    // General policies
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
        rent: {
          enabled: data.rent_enabled !== false,
          minBookingDays: String(data.rent_min_days || 1),
          maxBookingDays: String(data.rent_max_days || 30),
          advanceBookingDays: String(data.rent_advance_days || 90),
          bufferHours: String(data.rent_buffer_hours || 2),
        },
        flexiHire: {
          enabled: data.flexi_enabled !== false,
          minBookingDays: String(data.flexi_min_days || 7),
          maxBookingDays: String(data.flexi_max_days || 90),
          advanceBookingDays: String(data.flexi_advance_days || 30),
          bufferHours: String(data.flexi_buffer_hours || 4),
        },
        pco: {
          enabled: data.pco_enabled !== false,
          minBookingDays: String(data.pco_min_days || 28),
          maxBookingDays: String(data.pco_max_days || 365),
          advanceBookingDays: String(data.pco_advance_days || 14),
          bufferHours: String(data.pco_buffer_hours || 6),
        },
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
        // Rent settings
        rent_enabled: settings.rent.enabled,
        rent_min_days: Number.parseInt(settings.rent.minBookingDays) || 1,
        rent_max_days: Number.parseInt(settings.rent.maxBookingDays) || 30,
        rent_advance_days: Number.parseInt(settings.rent.advanceBookingDays) || 90,
        rent_buffer_hours: Number.parseInt(settings.rent.bufferHours) || 2,
        // Flexi Hire settings
        flexi_enabled: settings.flexiHire.enabled,
        flexi_min_days: Number.parseInt(settings.flexiHire.minBookingDays) || 7,
        flexi_max_days: Number.parseInt(settings.flexiHire.maxBookingDays) || 90,
        flexi_advance_days: Number.parseInt(settings.flexiHire.advanceBookingDays) || 30,
        flexi_buffer_hours: Number.parseInt(settings.flexiHire.bufferHours) || 4,
        // PCO settings
        pco_enabled: settings.pco.enabled,
        pco_min_days: Number.parseInt(settings.pco.minBookingDays) || 28,
        pco_max_days: Number.parseInt(settings.pco.maxBookingDays) || 365,
        pco_advance_days: Number.parseInt(settings.pco.advanceBookingDays) || 14,
        pco_buffer_hours: Number.parseInt(settings.pco.bufferHours) || 6,
        // General policies
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

  const renderServiceSettings = (serviceKey: 'rent' | 'flexiHire' | 'pco', title: string, description: string) => {
    const service = settings[serviceKey]
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
          <div>
            <Label className="text-white font-medium">{title} Service</Label>
            <p className="text-sm text-white/60">{description}</p>
          </div>
          <Switch
            checked={service.enabled}
            onCheckedChange={(checked) => setSettings({
              ...settings,
              [serviceKey]: { ...service, enabled: checked }
            })}
          />
        </div>

        {service.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-red-500/30">
            <div className="space-y-2">
              <Label htmlFor={`${serviceKey}-min`} className="text-white">
                Minimum Booking (Days)
              </Label>
              <Input
                id={`${serviceKey}-min`}
                type="number"
                value={service.minBookingDays}
                onChange={(e) => setSettings({
                  ...settings,
                  [serviceKey]: { ...service, minBookingDays: e.target.value }
                })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${serviceKey}-max`} className="text-white">
                Maximum Booking (Days)
              </Label>
              <Input
                id={`${serviceKey}-max`}
                type="number"
                value={service.maxBookingDays}
                onChange={(e) => setSettings({
                  ...settings,
                  [serviceKey]: { ...service, maxBookingDays: e.target.value }
                })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${serviceKey}-advance`} className="text-white">
                Advance Booking (Days)
              </Label>
              <Input
                id={`${serviceKey}-advance`}
                type="number"
                value={service.advanceBookingDays}
                onChange={(e) => setSettings({
                  ...settings,
                  [serviceKey]: { ...service, advanceBookingDays: e.target.value }
                })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${serviceKey}-buffer`} className="text-white">
                Buffer Between Bookings (Hours)
              </Label>
              <Input
                id={`${serviceKey}-buffer`}
                type="number"
                value={service.bufferHours}
                onChange={(e) => setSettings({
                  ...settings,
                  [serviceKey]: { ...service, bufferHours: e.target.value }
                })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
        )}
      </div>
    )
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
          <p className="text-white/60 mt-1">Configure booking rules for each service type</p>
        </div>
      </div>

      <Tabs defaultValue="rent" className="w-full">
        <TabsList className="liquid-glass border-white/10">
          <TabsTrigger value="rent">Rent</TabsTrigger>
          <TabsTrigger value="flexi">Flexi Hire</TabsTrigger>
          <TabsTrigger value="pco">PCO</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="rent" className="space-y-6 mt-6">
          <Card className="liquid-glass border-white/10 p-6">
            {renderServiceSettings('rent', 'Rent', 'Standard vehicle rental service')}
          </Card>
        </TabsContent>

        <TabsContent value="flexi" className="space-y-6 mt-6">
          <Card className="liquid-glass border-white/10 p-6">
            {renderServiceSettings('flexiHire', 'Flexi Hire', 'Flexible hire rental service')}
          </Card>
        </TabsContent>

        <TabsContent value="pco" className="space-y-6 mt-6">
          <Card className="liquid-glass border-white/10 p-6">
            {renderServiceSettings('pco', 'PCO Hire', 'PCO (Private Hire) rental service')}
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6 mt-6">
          <Card className="liquid-glass border-white/10 p-6">
            <div className="space-y-6">
              <div>
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
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
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
  )
}
