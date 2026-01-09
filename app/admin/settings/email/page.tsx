"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save, ArrowLeft, Loader2, Mail, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { getEmailSettings, updateEmailSettings } from "@/app/actions/settings"

export default function EmailSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [settings, setSettings] = useState({
    resendApiKey: "",
    fromEmail: "noreply@sedulousgroup.net",
    fromName: "Sedulous Group Ltd",
    replyTo: "info@sedulousgroupltd.co.uk",
    enabled: false,
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const data = await getEmailSettings()
      setSettings({
        resendApiKey: data.resend_api_key || "",
        fromEmail: data.from_email || "noreply@sedulousgroup.net",
        fromName: data.from_name || "Sedulous Group Ltd",
        replyTo: data.reply_to || "info@sedulousgroupltd.co.uk",
        enabled: data.enabled !== false,
      })
    } catch (error) {
      console.error("Error loading email settings:", error)
      toast.error("Failed to load email settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setTestResult(null)
    try {
      const result = await updateEmailSettings({
        resend_api_key: settings.resendApiKey,
        from_email: settings.fromEmail,
        from_name: settings.fromName,
        reply_to: settings.replyTo,
        enabled: settings.enabled,
      })

      if (result.success) {
        toast.success("Email settings saved successfully")
        // Test the configuration
        await testEmailConfiguration()
      } else {
        const errorMsg = result.error || "Failed to save email settings"
        toast.error(errorMsg, {
          action: errorMsg.includes("table does not exist") ? {
            label: "Setup Database",
            onClick: () => window.location.href = "/admin/settings/setup"
          } : undefined
        })
      }
    } catch (error) {
      console.error("Error saving email settings:", error)
      toast.error("Failed to save email settings")
    } finally {
      setIsSaving(false)
    }
  }

  const testEmailConfiguration = async () => {
    try {
      const response = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: settings.resendApiKey,
          fromEmail: settings.fromEmail,
          fromName: settings.fromName,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setTestResult({ success: true, message: "Email service is configured correctly!" })
      } else {
        setTestResult({ success: false, message: result.error || "Email test failed" })
      }
    } catch (error) {
      setTestResult({ success: false, message: "Failed to test email configuration" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading email settings...</p>
        </div>
      </div>
    )
  }

  const isConfigured = settings.resendApiKey && settings.resendApiKey.length > 0

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">Back to Settings</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Mail className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
            Email Settings
          </h1>
          <p className="text-white/60">Configure your email service provider (Resend) to send transactional emails</p>
        </div>

        {/* Status Card */}
        <Card className="liquid-glass border-white/10 p-6 mb-6">
          <div className="flex items-start gap-4">
            {isConfigured ? (
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                {isConfigured ? "Email Service Configured" : "Email Service Not Configured"}
              </h3>
              <p className="text-xs text-white/80">
                {isConfigured
                  ? "Your email service is ready to send emails. Make sure to test the configuration after saving."
                  : "Configure your Resend API key below to enable email functionality. Get your API key from https://resend.com/api-keys"}
              </p>
            </div>
          </div>
        </Card>

        {/* Test Result */}
        {testResult && (
          <Card className={`liquid-glass border-${testResult.success ? "green" : "red"}-500/30 p-4 mb-6`}>
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                  {testResult.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        <Card className="liquid-glass border-white/10 p-6 md:p-8 space-y-6">
          {/* Enable/Disable Email */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="space-y-0.5">
              <Label htmlFor="enabled" className="text-white cursor-pointer">
                Enable Email Service
              </Label>
              <p className="text-xs text-white/60">
                When disabled, all email sending will be skipped
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
              className="data-[state=checked]:bg-red-500"
            />
          </div>

          {/* Resend API Key */}
          <div className="space-y-2">
            <Label htmlFor="resendApiKey" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-400" />
              Resend API Key
            </Label>
            <div className="relative">
              <Input
                id="resendApiKey"
                type={showApiKey ? "text" : "password"}
                value={settings.resendApiKey}
                onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 pr-10"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxx"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-white/60">
              Get your API key from{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:underline"
              >
                resend.com/api-keys
              </a>
            </p>
          </div>

          {/* From Email */}
          <div className="space-y-2">
            <Label htmlFor="fromEmail" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-400" />
              From Email Address
            </Label>
            <Input
              id="fromEmail"
              type="email"
              value={settings.fromEmail}
              onChange={(e) => setSettings({ ...settings, fromEmail: e.target.value })}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
              placeholder="noreply@sedulousgroup.net"
            />
            <p className="text-xs text-white/60">
              The email address that will appear as the sender. Must be verified in your Resend account.
            </p>
          </div>

          {/* From Name */}
          <div className="space-y-2">
            <Label htmlFor="fromName" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-400" />
              From Name
            </Label>
            <Input
              id="fromName"
              type="text"
              value={settings.fromName}
              onChange={(e) => setSettings({ ...settings, fromName: e.target.value })}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
              placeholder="Sedulous Group Ltd"
            />
            <p className="text-xs text-white/60">
              The display name that will appear as the sender
            </p>
          </div>

          {/* Reply To */}
          <div className="space-y-2">
            <Label htmlFor="replyTo" className="text-white flex items-center gap-2">
              <Mail className="h-4 w-4 text-red-400" />
              Reply To Email
            </Label>
            <Input
              id="replyTo"
              type="email"
              value={settings.replyTo}
              onChange={(e) => setSettings({ ...settings, replyTo: e.target.value })}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
              placeholder="info@sedulousgroupltd.co.uk"
            />
            <p className="text-xs text-white/60">
              The email address where replies will be sent
            </p>
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-red-500 hover:bg-red-600 text-white flex-1 md:flex-none"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            {isConfigured && (
              <Button
                onClick={testEmailConfiguration}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Test Configuration
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}


