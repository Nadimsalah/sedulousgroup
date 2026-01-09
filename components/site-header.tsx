"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import {
  Menu,
  Car,
  Clock,
  Briefcase,
  ShoppingCart,
  Info,
  Phone,
  LogIn,
  UserPlus,
  LayoutDashboard,
  ChevronDown,
  User,
  LogOut,
  X,
  Mail,
} from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function SiteHeader() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()

    const supabase = createClient()
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log("[v0] Auth state changed:", _event, session?.user?.email)
        if (session?.user) {
          setUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      })

      return () => {
        subscription.unsubscribe()
      }
    } else {
      console.warn("[v0] Supabase client not available - auth features disabled")
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    console.log("[v0] Checking auth state in header...")
    const supabase = createClient()

    if (!supabase) {
      console.log("[v0] Supabase client is null")
      setLoading(false)
      return
    }

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      console.log("[v0] Session check result:", session?.user?.email, error)

      if (error) {
        console.error("[v0] Session error:", error)
      }

      if (session?.user) {
        console.log("[v0] User authenticated via Supabase:", session.user.email)
        setUser(session.user)
      } else {
        console.log("[v0] No active session")
        setUser(null)
      }
    } catch (error) {
      console.error("[v0] Error checking session:", error)
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    console.log("[v0] Starting logout process...")

    const supabase = createClient()
    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("[v0] Supabase sign out error:", error)
        } else {
          console.log("[v0] Supabase sign out successful")
        }
      } catch (error) {
        console.error("[v0] Error during Supabase sign out:", error)
      }
    }

    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })

      console.log("[v0] Cookies cleared")
    } catch (error) {
      console.error("[v0] Error clearing cookies:", error)
    }

    setUser(null)

    router.push("/login")

    setTimeout(() => {
      window.location.href = "/login"
    }, 100)
  }

  console.log("[v0] Current auth state - loading:", loading, "user:", user?.email || "none")

  const getUserInitials = () => {
    if (!user) return "U"
    const email = user.email || ""
    const name = user.user_metadata?.name || email
    if (name) {
      const parts = name.split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  const getUserDisplayName = () => {
    if (!user) return ""
    return user.user_metadata?.name || user.email?.split("@")[0] || "User"
  }

  const handleRentalTypeClick = (type: string) => {
    // Dispatch event to change rental type in CarListings
    window.dispatchEvent(new CustomEvent("rentalTypeChange", { detail: type }))
    // Scroll to cars section
    const carsSection = document.getElementById("cars")
    if (carsSection) {
      carsSection.scrollIntoView({ behavior: "smooth" })
    }
    // Close mobile menu if open
    setIsSheetOpen(false)
  }

  const links = [
    { href: "/about-us", label: "About Us", icon: Info },
    { href: "#contact", label: "Contact Us", icon: Phone, onClick: () => setIsContactDialogOpen(true) },
    { label: "Rent", icon: Car, onClick: () => handleRentalTypeClick("Rent") },
    { label: "Flexi Hire", icon: Clock, onClick: () => handleRentalTypeClick("Flexi Hire") },
    { label: "PCO Hire", icon: Briefcase, onClick: () => handleRentalTypeClick("PCO Hire") },
    { label: "Sales", icon: ShoppingCart, onClick: () => handleRentalTypeClick("Sales") },
  ]

  const mobileLinks = [
    { href: "/about-us", label: "About Us", icon: Info },
    { href: "#contact", label: "Contact Us", icon: Phone, onClick: () => setIsContactDialogOpen(true) },
  ]

  const serviceLinks = [
    { label: "Rent", icon: Car, onClick: () => handleRentalTypeClick("Rent") },
    { label: "Flexi Hire", icon: Clock, onClick: () => handleRentalTypeClick("Flexi Hire") },
    { label: "PCO Hire", icon: Briefcase, onClick: () => handleRentalTypeClick("PCO Hire") },
    { label: "Sales", icon: ShoppingCart, onClick: () => handleRentalTypeClick("Sales") },
  ]

  return (
    <header className="sticky top-0 z-50 p-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex h-14 items-center justify-between px-6 liquid-glass-header rounded-full">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/dna-group-logo.png"
              alt="Sedulous Group Ltd logo"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-white/90 md:flex">
            {links.map((l, idx) =>
              l.onClick ? (
                <button
                  key={l.label + idx}
                  onClick={l.onClick}
                  className="hover:text-red-400 transition-colors cursor-pointer"
                >
                  {l.label}
                </button>
              ) : l.href ? (
                <Link key={l.label + idx} href={l.href} className="hover:text-red-400 transition-colors">
                  {l.label}
                </Link>
              ) : null,
            )}
          </nav>

          <div className="hidden md:flex gap-2">
            {loading ? (
              <div className="h-10 w-32 animate-pulse rounded-lg bg-white/10" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium rounded-xl px-5 py-2.5 cursor-pointer transition-all hover:bg-white/15 hover:border-white/30 focus:ring-2 focus:ring-red-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 shadow-lg">
                    <Avatar className="h-8 w-8 ring-2 ring-white/10">
                      <AvatarFallback className="bg-red-500 text-white text-xs font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{getUserDisplayName()}</span>
                    <ChevronDown className="h-4 w-4 opacity-60" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-gray-900/95 backdrop-blur-xl border border-white/20 text-white shadow-xl z-[9999]"
                  sideOffset={12}
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer text-gray-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10"
                  >
                    <Link href="/dashboard" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      My Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer text-gray-200 hover:text-white hover:bg-white/10 focus:text-white focus:bg-white/10"
                  >
                    <Link href="/dashboard/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:text-red-300 focus:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                className="bg-red-500 text-white font-medium rounded-lg px-6 py-2.5 hover:bg-red-600 hover:shadow-md hover:scale-[1.02] transition-all"
              >
                <Link href="/login">Login / Sign up</Link>
              </Button>
            )}
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center gap-2">
            {!loading && user && (
              <div className="flex items-center gap-2 mr-2">
                <Avatar className="h-8 w-8 border-2 border-white/20">
                  <AvatarFallback className="bg-red-500 text-white text-xs">{getUserInitials()}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-white font-medium max-w-[100px] truncate">{getUserDisplayName()}</span>
              </div>
            )}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-gray-700 bg-gray-900/80 text-gray-200 hover:bg-gray-800"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="liquid-glass border-gray-800 p-0 w-full flex flex-col overflow-y-auto"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-gray-900/50">
                  <Image
                    src="/images/dna-group-logo.png"
                    alt="Sedulous Group Ltd logo"
                    width={120}
                    height={40}
                    className="h-8 w-auto"
                  />
                  <button
                    onClick={() => setIsSheetOpen(false)}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6 text-gray-300" />
                  </button>
                </div>

                {/* Main Navigation */}
                <div className="flex-1 overflow-y-auto">
                  <div className="mt-6 px-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Our Services</h3>
                    <div className="flex gap-2 pb-2 overflow-x-auto hide-scrollbar">
                      {serviceLinks.map((l) => (
                        <button
                          key={l.label}
                          onClick={() => {
                            l.onClick()
                            setIsSheetOpen(false)
                          }}
                          className="rounded-full px-4 py-2 text-sm cursor-pointer transition-all duration-300 flex-shrink-0 whitespace-nowrap border border-white/10 bg-white/5 text-white/80 backdrop-blur-xl hover:bg-white/10 hover:border-red-500/50 hover:text-red-400 hover:shadow-lg hover:shadow-red-500/20 active:scale-95 flex items-center gap-2"
                        >
                          <l.icon className="h-3.5 w-3.5" />
                          <span className="font-medium">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <nav className="flex flex-col gap-2 mt-8 px-6 pb-6">
                    {mobileLinks.map((l) =>
                      l.onClick ? (
                        <button
                          key={l.href}
                          onClick={() => {
                            setIsSheetOpen(false)
                            l.onClick()
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95 text-left w-full"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <l.icon className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-gray-200">{l.label}</span>
                        </button>
                      ) : (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <l.icon className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-gray-200">{l.label}</span>
                        </Link>
                      ),
                    )}

                    {loading ? (
                      <div className="h-24 animate-pulse rounded-xl bg-white/5 mt-4" />
                    ) : user ? (
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                          <Avatar className="h-12 w-12 border-2 border-red-500/30">
                            <AvatarFallback className="bg-red-500 text-white font-semibold">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-white truncate">{getUserDisplayName()}</p>
                            <p className="text-sm text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        <Link
                          href="/dashboard"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/dashboard")
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <LayoutDashboard className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-gray-200">My Dashboard</span>
                        </Link>
                        <Link
                          href="/dashboard/profile"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/dashboard/profile")
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-gray-200">Profile Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            setIsSheetOpen(false)
                            handleLogout()
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all active:scale-95 w-full text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <LogOut className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-red-400">Logout</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-2">
                        <Link
                          href="/login"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/login")
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <LogIn className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-semibold text-red-400">Login</span>
                        </Link>

                        <Link
                          href="/signup"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/signup")
                          }}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all active:scale-95"
                        >
                          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-red-400" />
                          </div>
                          <span className="text-base font-medium text-gray-200">Sign up</span>
                        </Link>
                      </div>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="bg-gray-900/95 backdrop-blur-xl border border-white/20 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="h-6 w-6 text-red-400" />
              Contact Us
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {/* Phone Number */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Phone Number</h3>
              <a
                href="tel:02033552561"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Phone className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Call us now</p>
                  <p className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
                    020 3355 2561
                  </p>
                </div>
              </a>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Email</h3>
              <a
                href="mailto:info@sedulousgroupltd.co.uk"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <Mail className="h-6 w-6 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-1">Send us an email</p>
                  <p className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors truncate">
                    info@sedulousgroupltd.co.uk
                  </p>
                </div>
              </a>
            </div>

            {/* Opening Hours */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Opening Hours</h3>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monday – Friday</span>
                  <span className="text-white font-medium">10:00 – 17:30</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Saturday</span>
                  <span className="text-white font-medium">10:00 – 14:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sunday</span>
                  <span className="text-white font-medium">Closed</span>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
