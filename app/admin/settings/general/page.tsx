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
import { getGeneralSettings, updateGeneralSettings } from "@/app/actions/settings"

export default function GeneralSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const data = await getGeneralSettings()
      setSettings({
        siteName: data.site_name || "Sedulous Group Ltd",
        siteUrl: data.site_url || "https://sedulousgroup.net",
        currency: data.currency || "GBP",
        timezone: data.timezone || "Europe/London",
        dateFormat: data.date_format || "DD/MM/YYYY",
        timeFormat: data.time_format || "24h",
        maintenanceMode: data.maintenance_mode || false,
        registrationEnabled: data.registration_enabled !== false,
      })
    } catch (error) {
      console.error("Error loading general settings:", error)
      toast.error("Failed to load general settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await updateGeneralSettings({
        site_name: settings.siteName,
        site_url: settings.siteUrl,
        currency: settings.currency,
        timezone: settings.timezone,
        date_format: settings.dateFormat,
        time_format: settings.timeFormat,
        maintenance_mode: settings.maintenanceMode,
        registration_enabled: settings.registrationEnabled,
      })

      if (result.success) {
        toast.success("General settings saved successfully")
      } else {
        const errorMsg = result.error || "Failed to save general settings"
        toast.error(errorMsg, {
          action: errorMsg.includes("table does not exist") ? {
            label: "Setup Database",
            onClick: () => window.location.href = "/admin/settings/setup"
          } : undefined
        })
      }
    } catch (error) {
      console.error("Error saving general settings:", error)
      toast.error("Failed to save general settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading general settings...</p>
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
                className="w-full bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="CAD">CAD - Canadian Dollar (C$)</option>
                <option value="AUD">AUD - Australian Dollar (A$)</option>
                <option value="JPY">JPY - Japanese Yen (¥)</option>
                <option value="CHF">CHF - Swiss Franc (CHF)</option>
                <option value="CNY">CNY - Chinese Yuan (¥)</option>
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="SGD">SGD - Singapore Dollar (S$)</option>
                <option value="HKD">HKD - Hong Kong Dollar (HK$)</option>
                <option value="NZD">NZD - New Zealand Dollar (NZ$)</option>
                <option value="SEK">SEK - Swedish Krona (kr)</option>
                <option value="NOK">NOK - Norwegian Krone (kr)</option>
                <option value="DKK">DKK - Danish Krone (kr)</option>
                <option value="PLN">PLN - Polish Zloty (zł)</option>
                <option value="MXN">MXN - Mexican Peso ($)</option>
                <option value="BRL">BRL - Brazilian Real (R$)</option>
                <option value="ZAR">ZAR - South African Rand (R)</option>
                <option value="AED">AED - UAE Dirham (د.إ)</option>
                <option value="SAR">SAR - Saudi Riyal (﷼)</option>
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
                className="w-full bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <optgroup label="Europe">
                  <option value="Europe/London">London, UK (GMT/BST)</option>
                  <option value="Europe/Paris">Paris, France (CET/CEST)</option>
                  <option value="Europe/Berlin">Berlin, Germany (CET/CEST)</option>
                  <option value="Europe/Rome">Rome, Italy (CET/CEST)</option>
                  <option value="Europe/Madrid">Madrid, Spain (CET/CEST)</option>
                  <option value="Europe/Amsterdam">Amsterdam, Netherlands (CET/CEST)</option>
                  <option value="Europe/Brussels">Brussels, Belgium (CET/CEST)</option>
                  <option value="Europe/Vienna">Vienna, Austria (CET/CEST)</option>
                  <option value="Europe/Zurich">Zurich, Switzerland (CET/CEST)</option>
                  <option value="Europe/Stockholm">Stockholm, Sweden (CET/CEST)</option>
                  <option value="Europe/Oslo">Oslo, Norway (CET/CEST)</option>
                  <option value="Europe/Copenhagen">Copenhagen, Denmark (CET/CEST)</option>
                  <option value="Europe/Helsinki">Helsinki, Finland (EET/EEST)</option>
                  <option value="Europe/Warsaw">Warsaw, Poland (CET/CEST)</option>
                  <option value="Europe/Prague">Prague, Czech Republic (CET/CEST)</option>
                  <option value="Europe/Budapest">Budapest, Hungary (CET/CEST)</option>
                  <option value="Europe/Athens">Athens, Greece (EET/EEST)</option>
                  <option value="Europe/Dublin">Dublin, Ireland (GMT/IST)</option>
                  <option value="Europe/Lisbon">Lisbon, Portugal (WET/WEST)</option>
                  <option value="Europe/Moscow">Moscow, Russia (MSK)</option>
                </optgroup>
                <optgroup label="North America">
                  <option value="America/New_York">New York, USA (EST/EDT)</option>
                  <option value="America/Chicago">Chicago, USA (CST/CDT)</option>
                  <option value="America/Denver">Denver, USA (MST/MDT)</option>
                  <option value="America/Los_Angeles">Los Angeles, USA (PST/PDT)</option>
                  <option value="America/Phoenix">Phoenix, USA (MST)</option>
                  <option value="America/Anchorage">Anchorage, USA (AKST/AKDT)</option>
                  <option value="America/Toronto">Toronto, Canada (EST/EDT)</option>
                  <option value="America/Vancouver">Vancouver, Canada (PST/PDT)</option>
                  <option value="America/Mexico_City">Mexico City, Mexico (CST/CDT)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia/Dubai">Dubai, UAE (GST)</option>
                  <option value="Asia/Riyadh">Riyadh, Saudi Arabia (AST)</option>
                  <option value="Asia/Karachi">Karachi, Pakistan (PKT)</option>
                  <option value="Asia/Kolkata">Mumbai, India (IST)</option>
                  <option value="Asia/Dhaka">Dhaka, Bangladesh (BST)</option>
                  <option value="Asia/Bangkok">Bangkok, Thailand (ICT)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                  <option value="Asia/Shanghai">Shanghai, China (CST)</option>
                  <option value="Asia/Tokyo">Tokyo, Japan (JST)</option>
                  <option value="Asia/Seoul">Seoul, South Korea (KST)</option>
                  <option value="Asia/Manila">Manila, Philippines (PHT)</option>
                  <option value="Asia/Jakarta">Jakarta, Indonesia (WIB)</option>
                </optgroup>
                <optgroup label="Oceania">
                  <option value="Australia/Sydney">Sydney, Australia (AEDT/AEST)</option>
                  <option value="Australia/Melbourne">Melbourne, Australia (AEDT/AEST)</option>
                  <option value="Australia/Brisbane">Brisbane, Australia (AEST)</option>
                  <option value="Australia/Perth">Perth, Australia (AWST)</option>
                  <option value="Pacific/Auckland">Auckland, New Zealand (NZDT/NZST)</option>
                </optgroup>
                <optgroup label="South America">
                  <option value="America/Sao_Paulo">São Paulo, Brazil (BRT/BRST)</option>
                  <option value="America/Buenos_Aires">Buenos Aires, Argentina (ART)</option>
                  <option value="America/Santiago">Santiago, Chile (CLT/CLST)</option>
                  <option value="America/Lima">Lima, Peru (PET)</option>
                  <option value="America/Bogota">Bogotá, Colombia (COT)</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Cairo, Egypt (EET/EEST)</option>
                  <option value="Africa/Johannesburg">Johannesburg, South Africa (SAST)</option>
                  <option value="Africa/Lagos">Lagos, Nigeria (WAT)</option>
                  <option value="Africa/Nairobi">Nairobi, Kenya (EAT)</option>
                </optgroup>
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
                className="w-full bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g., 31/12/2025)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/31/2025)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2025-12-31)</option>
                <option value="DD-MM-YYYY">DD-MM-YYYY (e.g., 31-12-2025)</option>
                <option value="MM-DD-YYYY">MM-DD-YYYY (e.g., 12-31-2025)</option>
                <option value="DD.MM.YYYY">DD.MM.YYYY (e.g., 31.12.2025)</option>
                <option value="MM.DD.YYYY">MM.DD.YYYY (e.g., 12.31.2025)</option>
                <option value="DD MMM YYYY">DD MMM YYYY (e.g., 31 Dec 2025)</option>
                <option value="MMMM DD, YYYY">MMMM DD, YYYY (e.g., December 31, 2025)</option>
                <option value="DD MMMM YYYY">DD MMMM YYYY (e.g., 31 December 2025)</option>
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
                className="w-full bg-black border border-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="24h">24 Hour Format (e.g., 14:30)</option>
                <option value="12h">12 Hour Format with AM/PM (e.g., 2:30 PM)</option>
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
