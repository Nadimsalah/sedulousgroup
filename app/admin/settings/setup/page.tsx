"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, Copy, ExternalLink, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface TableStatus {
  name: string
  exists: boolean
  error?: string
}

export default function SettingsSetupPage() {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([])
  const [isChecking, setIsChecking] = useState(true)
  const [copied, setCopied] = useState(false)

  const sqlScript = `-- ============================================
-- CREATE COMPANY_SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL DEFAULT 'Sedulous Group LTD',
  company_address TEXT NOT NULL DEFAULT '200 Burnt Oak Broadway, Edgware, HA8 0AP, United Kingdom',
  company_phone TEXT NOT NULL DEFAULT '020 8952 6908',
  company_email TEXT NOT NULL DEFAULT 'info@sedulousgroupltd.co.uk',
  logo_url TEXT DEFAULT '/sed.jpg',
  vat_number TEXT,
  company_number TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO company_settings (id) 
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_settings_select_public" ON company_settings;
CREATE POLICY "company_settings_select_public"
  ON company_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "company_settings_update_admin" ON company_settings;
CREATE POLICY "company_settings_update_admin"
  ON company_settings FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "company_settings_insert_admin" ON company_settings;
CREATE POLICY "company_settings_insert_admin"
  ON company_settings FOR INSERT
  WITH CHECK (true);

-- ============================================
-- CREATE SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select_public" ON settings;
CREATE POLICY "settings_select_public"
  ON settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "settings_update_admin" ON settings;
CREATE POLICY "settings_update_admin"
  ON settings FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "settings_insert_admin" ON settings;
CREATE POLICY "settings_insert_admin"
  ON settings FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);`

  useEffect(() => {
    checkTables()
  }, [])

  async function checkTables() {
    setIsChecking(true)
    const statuses: TableStatus[] = []

    // Check company_settings table
    try {
      const response = await fetch("/api/check-table?table=company_settings")
      const data = await response.json()
      statuses.push({
        name: "company_settings",
        exists: data.exists,
        error: data.error,
      })
    } catch (error) {
      statuses.push({
        name: "company_settings",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    // Check settings table
    try {
      const response = await fetch("/api/check-table?table=settings")
      const data = await response.json()
      statuses.push({
        name: "settings",
        exists: data.exists,
        error: data.error,
      })
    } catch (error) {
      statuses.push({
        name: "settings",
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }

    setTableStatuses(statuses)
    setIsChecking(false)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(sqlScript)
    setCopied(true)
    toast.success("SQL script copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const allTablesExist = tableStatuses.every((s) => s.exists)
  const anyTableMissing = tableStatuses.some((s) => !s.exists)

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Database Setup</h1>
        <p className="text-white/60 mt-2">Verify and create required tables for Settings</p>
      </div>

      {/* Table Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tableStatuses.map((status) => (
          <Card
            key={status.name}
            className="liquid-glass border-white/10 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {status.exists ? (
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{status.name}</h3>
                  <p className="text-sm text-white/60">
                    {status.exists ? "Table exists" : "Table missing"}
                  </p>
                </div>
              </div>
            </div>
            {status.error && (
              <p className="text-xs text-red-400 mt-2">{status.error}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Setup Instructions */}
      {anyTableMissing && (
        <Card className="liquid-glass border-yellow-500/30 p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Tables Missing - Setup Required
              </h3>
              <p className="text-white/80 text-sm">
                You need to create the missing tables in Supabase. Follow these steps:
              </p>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-white/80 text-sm mb-6 ml-9">
            <li>Open your Supabase Dashboard</li>
            <li>Go to SQL Editor</li>
            <li>Click "New query"</li>
            <li>Copy the SQL script below</li>
            <li>Paste it into the SQL Editor</li>
            <li>Click "Run" (or press Ctrl+Enter)</li>
            <li>Come back here and click "Refresh Status"</li>
          </ol>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied!" : "Copy SQL Script"}
              </Button>
              <Button
                onClick={checkTables}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Refresh Status
              </Button>
              <Button
                onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase
              </Button>
            </div>

            <div className="bg-black/50 rounded-lg p-4 border border-white/10">
              <pre className="text-xs text-white/90 overflow-x-auto whitespace-pre-wrap font-mono">
                {sqlScript}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {/* Success Message */}
      {allTablesExist && !isChecking && (
        <Card className="liquid-glass border-green-500/30 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-white">All Tables Ready!</h3>
              <p className="text-white/80 text-sm mt-1">
                All required tables are created. You can now use all Settings pages.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isChecking && (
        <Card className="liquid-glass border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <p className="text-white/80">Checking table status...</p>
          </div>
        </Card>
      )}
    </div>
  )
}

