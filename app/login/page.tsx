"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { SiteHeader } from "@/components/site-header"
import { AnimatedGradient } from "@/components/animated-gradient"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      if (!supabase) {
        console.error("[v0] Supabase client is null - configuration missing")
        toast({
          title: "Configuration Error",
          description: "Authentication system is not available. Please contact support.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("[v0] Attempting login for:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      console.log("[v0] Login response:", { data, error })

      if (error) {
        console.error("[v0] Login error:", error)

        let errorMessage = error.message
        let errorTitle = "Login Failed"

        if (error.message === "Invalid login credentials" || error.message.includes("Invalid")) {
          errorTitle = "Invalid Credentials"
          errorMessage =
            "The email or password is incorrect. Don't have an account yet? Click 'Sign up' below to create one."
        } else if (error.message.includes("Email not confirmed")) {
          errorTitle = "Email Not Verified"
          errorMessage = "Please check your email and click the verification link to activate your account."
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (!data.user) {
        console.error("[v0] No user in response")
        toast({
          title: "Login Failed",
          description: "Unable to log you in. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      console.log("[v0] Login successful, user:", data.user.id)

      toast({
        title: "Welcome back!",
        description: "Login successful",
      })

      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } catch (err) {
      console.error("[v0] Login exception:", err)
      toast({
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <SiteHeader />
      <AnimatedGradient />
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Image
              src="/images/dna-group-logo.png"
              alt="Sedulous Group Ltd"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </div>

          <div className="liquid-glass rounded-3xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="text-white/60">Sign in to your account to continue</p>
            </div>

            <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-200 text-center">
                💡 <strong>Tip:</strong> You can make bookings without logging in! Login is only needed to view your
                booking history.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90 text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                    className="border-white/30 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <label htmlFor="remember" className="text-sm text-white/70 cursor-pointer">
                    Remember me
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                         text-white font-semibold rounded-xl shadow-lg shadow-red-500/30
                         hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]
                         transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
              <p className="text-white/60 text-sm mt-2">
                Want to book without an account?{" "}
                <Link href="/" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Browse vehicles
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
