"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { ShieldCheck } from "lucide-react"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  console.log("[v0] Admin login page loaded")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("[v0] Admin login attempt:", email)

    try {
      const supabase = createClient()

      if (!supabase) {
        console.error("[v0] Supabase client is null")
        setError("Authentication system is not available. Please contact support.")
        setIsLoading(false)
        return
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (authError) {
        console.error("[v0] Admin login error:", authError)

        if (authError.message === "Invalid login credentials" || authError.message.includes("Invalid")) {
          setError(
            "Invalid admin credentials. Please check your email and password. Contact IT support if you need help.",
          )
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Please verify your admin email first. Check your inbox for the verification link.")
        } else {
          setError(authError.message || "Login failed. Please try again.")
        }

        setIsLoading(false)
        return
      }

      if (!data.user) {
        console.error("[v0] No user in response")
        setError("Login failed. Please try again.")
        setIsLoading(false)
        return
      }

      const isAdmin = data.user.email?.endsWith("@admin.com") || data.user.email?.endsWith("@sedulousgroupltd.co.uk")

      if (!isAdmin) {
        console.error("[v0] User is not admin:", data.user.email)
        await supabase.auth.signOut()
        setError("Access denied. This area is for administrators only.")
        setIsLoading(false)
        return
      }

      console.log("[v0] Admin login successful")

      if (typeof window !== "undefined") {
        sessionStorage.setItem("admin-authenticated", "true")
        sessionStorage.setItem("admin-email", data.user.email || "")
      }

      router.push("/admin")
    } catch (error) {
      console.error("[v0] Login exception:", error)
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">SEDULOUS</h1>
          <p className="text-neutral-400">Admin Dashboard Login</p>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-8 border border-neutral-800">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-200">
                Admin Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sedulousgroupltd.co.uk"
                className="bg-[#0a0a0a] border-neutral-700 text-white h-12"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-200">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-[#0a0a0a] border-neutral-700 text-white h-12"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white h-12 font-semibold disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
            <p className="text-neutral-400 text-xs text-center">
              Admin access restricted to @admin.com and @sedulousgroupltd.co.uk emails
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
