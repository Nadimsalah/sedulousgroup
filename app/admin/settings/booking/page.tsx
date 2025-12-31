"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function BookingSettingsPage() {
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

  return (
    <div className="space-y-6">
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
            <Button className="bg-red-500 hover:bg-red-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
