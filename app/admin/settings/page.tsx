"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import {
  Settings,
  Building2,
  Mail,
  CreditCard,
  Calendar,
  Shield,
  Bell,
  Database,
  FileText,
  Palette,
} from "lucide-react"

export default function SettingsPage() {
  const settingsCategories = [
    {
      title: "General Settings",
      description: "Configure basic system settings and preferences",
      icon: Settings,
      href: "/admin/settings/general",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Company Profile",
      description: "Manage company information and branding",
      icon: Building2,
      href: "/admin/settings/company",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Email Templates",
      description: "Customize email notifications and templates",
      icon: Mail,
      href: "/admin/settings/email-templates",
      color: "from-green-500 to-green-600",
    },
    {
      title: "Payment Settings",
      description: "Configure payment gateways and pricing",
      icon: CreditCard,
      href: "/admin/settings/payments",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      title: "Booking Settings",
      description: "Manage booking rules and restrictions",
      icon: Calendar,
      href: "/admin/settings/booking",
      color: "from-red-500 to-red-600",
    },
    {
      title: "Security",
      description: "Configure authentication and security settings",
      icon: Shield,
      href: "/admin/settings/security",
      color: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Notifications",
      description: "Manage notification preferences and alerts",
      icon: Bell,
      href: "/admin/settings/notifications",
      color: "from-pink-500 to-pink-600",
    },
    {
      title: "Backup & Export",
      description: "Database backup and data export options",
      icon: Database,
      href: "/admin/settings/backup",
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "Terms & Policies",
      description: "Manage terms of service and privacy policy",
      icon: FileText,
      href: "/admin/settings/terms",
      color: "from-orange-500 to-orange-600",
    },
    {
      title: "Appearance",
      description: "Customize theme and interface preferences",
      icon: Palette,
      href: "/admin/settings/appearance",
      color: "from-cyan-500 to-cyan-600",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/60 mt-2">Manage your system configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {settingsCategories.map((category) => (
          <Link key={category.href} href={category.href}>
            <Card className="liquid-glass border-white/10 p-6 hover:border-white/20 transition-all duration-300 cursor-pointer group h-full">
              <div className="space-y-4">
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg`}
                >
                  <category.icon className="h-6 w-6 text-white" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-red-400 transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-white/60 mt-1 leading-relaxed">{category.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
