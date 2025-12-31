"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Building2,
  CreditCard,
  Calendar,
  Settings,
  Database,
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [tableStatus, setTableStatus] = useState<{
    company_settings: boolean
    settings: boolean
    checking: boolean
  }>({
    company_settings: true,
    settings: true,
    checking: true,
  })

  useEffect(() => {
    checkTables()
  }, [])

  async function checkTables() {
    setTableStatus({ company_settings: true, settings: true, checking: true })
    
    try {
      const [companyRes, settingsRes] = await Promise.all([
        fetch("/api/check-table?table=company_settings"),
        fetch("/api/check-table?table=settings"),
      ])

      const companyData = await companyRes.json()
      const settingsData = await settingsRes.json()

      setTableStatus({
        company_settings: companyData.exists,
        settings: settingsData.exists,
        checking: false,
      })
    } catch (error) {
      console.error("Error checking tables:", error)
      setTableStatus({
        company_settings: false,
        settings: false,
        checking: false,
      })
    }
  }

  const allTablesExist = tableStatus.company_settings && tableStatus.settings
  const anyTableMissing = !tableStatus.company_settings || !tableStatus.settings

  const settingsCategories = [
    {
      title: "Company Profile",
      description: "Manage company information, logo, and contact details",
      icon: Building2,
      href: "/admin/settings/company",
      color: "from-purple-500 to-purple-600",
      requiresTable: "company_settings",
    },
    {
      title: "Booking Settings",
      description: "Configure booking rules, minimum rental period, and policies",
      icon: Calendar,
      href: "/admin/settings/booking",
      color: "from-red-500 to-red-600",
      requiresTable: "settings",
    },
    {
      title: "Payment Settings",
      description: "Manage deposit percentage, fees, and payment methods",
      icon: CreditCard,
      href: "/admin/settings/payments",
      color: "from-yellow-500 to-yellow-600",
      requiresTable: "settings",
    },
    {
      title: "General Settings",
      description: "Configure site name, currency, timezone, and basic preferences",
      icon: Settings,
      href: "/admin/settings/general",
      color: "from-blue-500 to-blue-600",
      requiresTable: "settings",
    },
  ]

  return (
    <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/60 mt-2">Manage your system configuration and preferences</p>
        </div>
        {anyTableMissing && (
          <Button
            onClick={() => router.push("/admin/settings/setup")}
            className="bg-yellow-500 hover:bg-yellow-600 text-white"
          >
            <Database className="h-4 w-4 mr-2" />
            Setup Database
          </Button>
        )}
      </div>

      {/* Warning Banner */}
      {anyTableMissing && !tableStatus.checking && (
        <Card className="liquid-glass border-yellow-500/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                Database Setup Required
              </h3>
              <p className="text-xs text-white/80 mb-3">
                Some tables are missing. Click "Setup Database" above to create them, or visit{" "}
                <Link
                  href="/admin/settings/setup"
                  className="text-yellow-400 hover:underline"
                >
                  /admin/settings/setup
                </Link>
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsCategories.map((category) => {
          const tableExists =
            category.requiresTable === "company_settings"
              ? tableStatus.company_settings
              : tableStatus.settings

          return (
            <Link key={category.href} href={category.href}>
              <Card
                className={`liquid-glass border-white/10 p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group h-full ${
                  !tableExists ? "opacity-60" : ""
                }`}
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                  >
                    <category.icon className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                        {category.title}
                      </h3>
                      {!tableExists && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Setup Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1 leading-relaxed">
                      {category.description}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
