"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState({
    stripeEnabled: true,
    stripePublicKey: "pk_test_...",
    stripeSecretKey: "sk_test_...",
    currency: "GBP",
    taxRate: "20",
    depositPercentage: "20",
    lateFeePerDay: "50",
    cancellationFee: "25",
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
          <h1 className="text-3xl font-bold text-white">Payment Settings</h1>
          <p className="text-white/60 mt-1">Configure payment gateways and pricing</p>
        </div>
      </div>

      <Card className="liquid-glass border-white/10 p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded">
                <CreditCard className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <Label className="text-white font-medium">Stripe Payment Gateway</Label>
                <p className="text-sm text-white/60">Accept card payments via Stripe</p>
              </div>
            </div>
            <Switch
              checked={settings.stripeEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
            />
          </div>

          {settings.stripeEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-white/5 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="stripePublicKey" className="text-white">
                  Stripe Public Key
                </Label>
                <Input
                  id="stripePublicKey"
                  value={settings.stripePublicKey}
                  onChange={(e) => setSettings({ ...settings, stripePublicKey: e.target.value })}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripeSecretKey" className="text-white">
                  Stripe Secret Key
                </Label>
                <Input
                  id="stripeSecretKey"
                  type="password"
                  value={settings.stripeSecretKey}
                  onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                  className="bg-white/5 border-white/10 text-white font-mono text-sm"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/10">
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-white">
                Default Currency
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
              <Label htmlFor="taxRate" className="text-white">
                Tax Rate (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                value={settings.taxRate}
                onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositPercentage" className="text-white">
                Deposit Percentage (%)
              </Label>
              <Input
                id="depositPercentage"
                type="number"
                value={settings.depositPercentage}
                onChange={(e) => setSettings({ ...settings, depositPercentage: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateFeePerDay" className="text-white">
                Late Fee Per Day (£)
              </Label>
              <Input
                id="lateFeePerDay"
                type="number"
                value={settings.lateFeePerDay}
                onChange={(e) => setSettings({ ...settings, lateFeePerDay: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationFee" className="text-white">
                Cancellation Fee (£)
              </Label>
              <Input
                id="cancellationFee"
                type="number"
                value={settings.cancellationFee}
                onChange={(e) => setSettings({ ...settings, cancellationFee: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
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
