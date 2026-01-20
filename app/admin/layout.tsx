"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import {
  Home,
  Calendar,
  Car,
  Users,
  AlertTriangle,
  Wrench,
  CreditCard,
  Ticket,
  Settings,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  FileText,
  Camera,
  CheckCircle,
  ImageIcon,
  Sparkles,
  Bell,
  Receipt,
  Banknote,
} from "lucide-react"
import { Toaster } from "@/components/ui/sonner"
import { NotificationDropdown } from "@/components/notification-dropdown"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [vehiclesOpen, setVehiclesOpen] = useState(true)
  const [financeOpen, setFinanceOpen] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userEmail, setUserEmail] = useState("")

  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    if (isLoginPage) {
      setIsLoading(false)
      return
    }
    checkAuth()
  }, [isLoginPage])

  const checkAuth = async () => {
    try {
      // 1. Check Session Storage (Legacy/Dev Backdoor)
      if (typeof window !== "undefined") {
        const isAdminAuth = sessionStorage.getItem("admin-authenticated")
        const adminEmail = sessionStorage.getItem("admin-email")

        if (isAdminAuth === "true" && adminEmail === "sami@admin.com") {
          console.log("[v0] Admin session found for:", adminEmail)
          setIsAuthenticated(true)
          setUserEmail(adminEmail)
          setIsLoading(false)
          return
        }
      }

      // 2. Check Supabase Auth
      const supabase = createClient()

      if (!supabase) {
        console.log("[v0] Supabase not configured, redirecting to login")
        router.push("/admin/login")
        setIsLoading(false)
        return
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        console.log("[v0] No authenticated user, redirecting to login")
        router.push("/admin/login")
        return
      }

      // STRICT SECURITY CHECK
      if (user.email !== "sami@admin.com") {
        console.warn("[v0] Unauthorized access attempt by:", user.email)
        toast.error("Unauthorized access. Super Admin only.")
        await supabase.auth.signOut()
        router.push("/admin/login")
        return
      }

      console.log("[v0] Super Admin authenticated:", user.email)
      setIsAuthenticated(true)
      setUserEmail(user.email || "")
    } catch (error) {
      console.error("[v0] Auth check error:", error)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "AI Assistant", href: "/admin/ai-assistant", icon: Sparkles },
    { name: "Bookings Schedule", href: "/admin/requests", icon: Calendar },
    { name: "Active Bookings", href: "/admin/active-bookings", icon: CheckCircle },
    { name: "Parking", href: "/admin/parking", icon: Car },
    {
      name: "Vehicles",
      icon: Car,
      subItems: [
        { name: "Rent", href: "/admin/cars" },
        { name: "Flexi Hire", href: "/admin/flexi-hire" },
        { name: "PCO Hire", href: "/admin/pco-hire" },
        { name: "Sales", href: "/admin/sales" },
      ],
    },
    { name: "Customers", href: "/admin/customers", icon: Users },
    { name: "Agreements", href: "/admin/agreements", icon: FileText },
    { name: "Inspections", href: "/admin/inspections", icon: Camera },
    { name: "Damage Reports", href: "/admin/damage-reports", icon: AlertTriangle },
    { name: "Vendors", href: "/admin/vendors", icon: Wrench },
    {
      name: "Finance",
      icon: Banknote,
      subItems: [
        { name: "Transactions", href: "/admin/finance" },
        { name: "Deposits", href: "/admin/deposits" },
        { name: "Car Loans", href: "/admin/car-loans" },
      ],
    },
    { name: "PCNs / Tickets", href: "/admin/pcn-tickets", icon: Ticket },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Stories", href: "/admin/stories", icon: ImageIcon },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  const handleLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("admin-authenticated")
        sessionStorage.removeItem("admin-email")
      }

      const supabase = createClient()
      if (supabase) {
        await supabase.auth.signOut()
      }
      router.push("/admin/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
      router.push("/admin/login")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    return null
  }

  // SidebarContent component - must be defined before the main return
  function SidebarContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-white/10">
          <Link href="/admin">
            <Image
              src="/images/dna-group-logo.png"
              alt="Sedulous Group Ltd"
              width={150}
              height={50}
              className="h-10 w-auto"
            />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 admin-sidebar-scroll">
          <ul role="list" className="flex flex-col gap-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                {!item.subItems ? (
                  <Link
                    href={item.href!}
                    className={`group flex gap-x-3 rounded-lg p-3 text-sm font-medium transition-colors ${pathname === item.href
                      ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                ) : (
                  <div>
                    <button
                      onClick={() => {
                        if (item.name === "Vehicles") setVehiclesOpen(!vehiclesOpen)
                        if (item.name === "Finance") setFinanceOpen(!financeOpen)
                      }}
                      className="group flex w-full items-center justify-between gap-x-3 rounded-lg p-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-x-3">
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 transition-transform ${(item.name === "Vehicles" && vehiclesOpen) || (item.name === "Finance" && financeOpen)
                            ? "rotate-90"
                            : ""
                          }`}
                      />
                    </button>
                    {((item.name === "Vehicles" && vehiclesOpen) || (item.name === "Finance" && financeOpen)) && (
                      <ul className="mt-1 ml-9 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              href={subItem.href}
                              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${pathname === subItem.href
                                  ? "bg-red-500/20 text-red-300 font-medium"
                                  : "text-white/60 hover:text-white hover:bg-white/5"
                                }`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav >

        <div className="shrink-0 p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-x-3 rounded-lg p-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div >
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 liquid-glass-enhanced border-r border-white/10">
            <SidebarContent />
          </div>
        </div>
      )}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col liquid-glass-enhanced border-r border-white/10">
        <SidebarContent />
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 liquid-glass-header border-b border-white/10 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-white">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationDropdown />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 liquid-glass rounded-full px-4 py-2 hover:bg-white/10 transition-colors">
                    <Avatar className="h-8 w-8 ring-2 ring-white/10">
                      <AvatarFallback className="bg-red-500 text-white text-sm font-bold">
                        {userEmail.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">Super Admin</p>
                      <p className="text-xs text-white/60">{userEmail}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 liquid-glass border-white/20 text-white">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-300">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="bg-black py-6 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Toaster />
    </div>
  )
}
