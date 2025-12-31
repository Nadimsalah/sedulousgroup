"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { signIn, signInWithMagicLink } from "@/app/actions/auth"

export default function SigninPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Admin backdoor
    if (email === "sami@admin.com" && password === "102030") {
      const expiryDate = new Date()
      expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000)
      document.cookie = `admin-session=authenticated; path=/; expires=${expiryDate.toUTCString()}`
      toast({
        title: "Admin login successful",
        description: "Redirecting to admin dashboard...",
      })
      router.push("/admin")
      return
    }

    try {
      if (useMagicLink) {
        const result = await signInWithMagicLink(email)

        if (!result.success) {
          toast({
            title: "Sign in failed",
            description: result.error || "Unknown error",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Check your email!",
          description: "We've sent you a magic link to sign in",
        })
        setIsLoading(false)
      } else {
        const result = await signIn(email, password)

        if (!result.success) {
          toast({
            title: "Sign in failed",
            description: result.error || "Unknown error",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in",
        })

        window.location.href = "/dashboard"
      }
    } catch (err) {
      console.error("[v0] Login exception:", err)
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
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

          <div className="flex gap-2 p-1 bg-white/5 rounded-xl">
            <button
              type="button"
              onClick={() => setUseMagicLink(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                !useMagicLink ? "bg-red-500 text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              <Lock className="inline h-4 w-4 mr-1" />
              Password
            </button>
            <button
              type="button"
              onClick={() => setUseMagicLink(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                useMagicLink ? "bg-red-500 text-white shadow-lg" : "text-white/60 hover:text-white/80"
              }`}
            >
              <Sparkles className="inline h-4 w-4 mr-1" />
              Magic Link
            </button>
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
                  className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                           focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                           transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            {!useMagicLink && (
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
                    className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {!useMagicLink && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-white/30 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                  />
                  <label htmlFor="remember" className="text-sm text-white/70 cursor-pointer">
                    Remember me
                  </label>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                       text-white font-semibold rounded-xl shadow-lg shadow-red-500/30
                       hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]
                       transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {useMagicLink ? "Sending magic link..." : "Signing in..."}
                </>
              ) : useMagicLink ? (
                <>
                  Send Magic Link <Sparkles className="ml-2 h-5 w-5" />
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
          </div>
        </div>
      </div>
    </div>
  )
}
