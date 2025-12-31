"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, User, Mail, Phone, Save, Loader2 } from "lucide-react"

export default function ProfileSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    const supabase = createClient()

    if (!supabase) {
      console.log("[v0] Supabase not configured, redirecting to login")
      router.push("/login")
      return
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      console.log("[v0] No authenticated user, redirecting to login")
      router.push("/login")
      return
    }

    setUser(user)
    setFormData({
      name: user.user_metadata?.name || user.user_metadata?.full_name || "",
      email: user.email || "",
      phone: user.user_metadata?.phone || "",
    })
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const supabase = createClient()

      if (!supabase) {
        throw new Error("Supabase not configured")
      }

      if (!user) {
        throw new Error("No user session")
      }

      // Update user metadata in Supabase
      const { error } = await supabase.auth.updateUser({
        data: {
          name: formData.name,
          full_name: formData.name,
          phone: formData.phone,
        },
      })

      if (error) throw error

      alert("Profile updated successfully!")

      // Refresh user data
      await checkAuthAndLoadProfile()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const getUserInitials = () => {
    if (!user) return "U"
    const name = formData.name || formData.email
    if (name) {
      const parts = name.split(" ")
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    return "U"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="liquid-glass-header border-b border-white/10">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center gap-3 text-white hover:text-red-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back to Dashboard</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/dna-group-logo.png"
                alt="Sedulous Group"
                width={120}
                height={40}
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="liquid-glass rounded-2xl p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col items-center gap-6 mb-8">
            <Avatar className="h-24 w-24 border-4 border-red-500/20">
              <AvatarFallback className="bg-red-500 text-white text-2xl">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Profile Settings</h1>
              <p className="text-gray-400">Manage your account information</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white flex items-center gap-2">
                <User className="h-4 w-4 text-red-400" />
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white flex items-center gap-2">
                <Mail className="h-4 w-4 text-red-400" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-white/5 border-white/10 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-400" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500"
                placeholder="Enter your phone number"
              />
            </div>

            <div className="pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-xl transition-all hover:scale-[1.02]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
