"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function GeneralSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: "Sedulous Group Ltd",
    siteUrl: "https://sedulousgroup.net",
    currency: "GBP",
    timezone: "Europe/London",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    maintenanceMode: false,
    registrationEnabled: true,
  })

  const handleSave = async () => {
    // Save settings logic
    console.log("Saving settings:", settings)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/settings">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">General Settings</h1>
          <p className="text-white/60 mt-1">Configure basic system settings</p>
        </div>
      </div>

      <Card className="liquid-glass border-white/10 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="siteName" className="text-white">
                Site Name
              </Label>
              <Input
                id="siteName"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteUrl" className="text-white">
                Site URL
              </Label>
              <Input
                id="siteUrl"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency" className="text-white">
                Currency
              </Label>
              <select
                id="currency"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
              >
                <option value="GBP">GBP (£)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-white">
                Timezone
              </Label>
              <select
                id="timezone"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
              >
                <option value="Europe/London">London (GMT)</option>
                <option value="America/New_York">New York (EST)</option>
                <option value="America/Los_Angeles">Los Angeles (PST)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFormat" className="text-white">
                Date Format
              </Label>
              <select
                id="dateFormat"
                value={settings.dateFormat}
                onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeFormat" className="text-white">
                Time Format
              </Label>
              <select
                id="timeFormat"
                value={settings.timeFormat}
                onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-2"
              >
                <option value="24h">24 Hour</option>
                <option value="12h">12 Hour (AM/PM)</option>
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">Maintenance Mode</Label>
                <p className="text-sm text-white/60">Disable site access for maintenance</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white font-medium">User Registration</Label>
                <p className="text-sm text-white/60">Allow new users to register</p>
              </div>
              <Switch
                checked={settings.registrationEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, registrationEnabled: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} className="bg-red-500 hover:bg-red-600 text-white">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
