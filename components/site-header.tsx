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
    // Close mobile menu if open
    setIsSheetOpen(false)

    // Navigate to home page with rental type parameter
    router.push(`/?type=${encodeURIComponent(type)}#cars`)

    // If already on home page, dispatch event and scroll
    if (window.location.pathname === '/') {
      window.dispatchEvent(new CustomEvent("rentalTypeChange", { detail: type }))
      setTimeout(() => {
        const carsSection = document.getElementById("cars")
        if (carsSection) {
          carsSection.scrollIntoView({ behavior: "smooth" })
        }
      }, 100)
    }
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
                className="bg-black/95 border-l border-white/10 p-0 w-[300px] sm:w-[350px] shadow-2xl flex flex-col overflow-y-auto"
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
                <div className="flex-1 overflow-y-auto py-6">
                  <div className="px-6 mb-8">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Our Services</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {serviceLinks.map((l) => (
                        <button
                          key={l.label}
                          onClick={() => {
                            l.onClick()
                            setIsSheetOpen(false)
                          }}
                          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-red-500/30 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 group active:scale-95"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors">
                            <l.icon className="h-4 w-4 text-white/60 group-hover:text-red-400" />
                          </div>
                          <span className="text-xs font-medium text-white/80 group-hover:text-white">{l.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <nav className="flex flex-col space-y-1 px-4">
                    {mobileLinks.map((l) =>
                      l.onClick ? (
                        <button
                          key={l.href}
                          onClick={() => {
                            setIsSheetOpen(false)
                            l.onClick()
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:pl-6 transition-all duration-300 group"
                        >
                          <l.icon className="h-4 w-4 text-white/40 group-hover:text-red-400 transition-colors" />
                          <span className="text-sm font-medium text-white/60 group-hover:text-white">{l.label}</span>
                        </button>
                      ) : (
                        <Link
                          key={l.href}
                          href={l.href}
                          onClick={() => setIsSheetOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 hover:pl-6 transition-all duration-300 group"
                        >
                          <l.icon className="h-4 w-4 text-white/40 group-hover:text-red-400 transition-colors" />
                          <span className="text-sm font-medium text-white/60 group-hover:text-white">{l.label}</span>
                        </Link>
                      ),
                    )}
                  </nav>

                  <div className="px-6 mt-8">
                    <div className="h-px w-full bg-white/5 mb-6" />

                    {loading ? (
                      <div className="h-12 animate-pulse rounded-lg bg-white/5" />
                    ) : user ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 px-2 mb-4">
                          <Avatar className="h-10 w-10 border border-white/10">
                            <AvatarFallback className="bg-red-500/10 text-red-400 font-bold text-xs">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{getUserDisplayName()}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                          </div>
                        </div>

                        <Link
                          href="/dashboard"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/dashboard")
                          }}
                          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors border border-white/5 hover:border-white/10"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Overview
                        </Link>

                        <div className="grid grid-cols-2 gap-3">
                          <Link
                            href="/dashboard/profile"
                            onClick={() => {
                              setIsSheetOpen(false)
                              router.push("/dashboard/profile")
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium text-white transition-colors border border-white/5 hover:border-white/10"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              setIsSheetOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-sm font-medium text-red-400 transition-colors border border-red-500/20 hover:border-red-500/30"
                          >
                            <LogOut className="h-4 w-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link
                          href="/login"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/login")
                          }}
                          className="flex items-center justify-center w-full py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-sm shadow-lg shadow-red-900/20 transition-all active:scale-[0.98]"
                        >
                          Login to Account
                        </Link>

                        <Link
                          href="/signup"
                          onClick={() => {
                            setIsSheetOpen(false)
                            router.push("/signup")
                          }}
                          className="flex items-center justify-center w-full py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white font-medium text-sm transition-all active:scale-[0.98]"
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
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
