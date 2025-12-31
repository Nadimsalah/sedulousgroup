"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone, Sparkles } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.agreeToTerms) {
      toast({
        title: "Please accept terms",
        description: "You must agree to the Terms & Conditions to continue",
        variant: "destructive",
      })
      return
    }

    if (!useMagicLink) {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Passwords don't match",
          description: "Please make sure both passwords are the same",
          variant: "destructive",
        })
        return
      }

      if (formData.password.length < 6) {
        toast({
          title: "Password too short",
          description: "Password must be at least 6 characters",
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)

    try {
      const supabase = createClient()

      if (!supabase) {
        toast({
          title: "Configuration error",
          description: "Supabase is not configured. Please contact support.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (useMagicLink) {
        // Magic Link signup - no password required
        const { error: signUpError } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (signUpError) {
          console.error("[v0] Magic Link signup error:", signUpError)
          toast({
            title: "Signup failed",
            description: signUpError.message,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        toast({
          title: "Check your email! ✨",
          description: "We've sent you a magic link to sign in",
        })

        setTimeout(() => {
          window.location.href = "/auth/signin"
        }, 2000)
      } else {
        // Password-based signup
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        })

        if (signUpError) {
          console.error("[v0] Password signup error:", signUpError)
          toast({
            title: "Signup failed",
            description: signUpError.message,
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        if (data.user && !data.session) {
          toast({
            title: "Check your email! 📧",
            description: "Please verify your email before logging in",
          })
          setTimeout(() => {
            window.location.href = "/auth/signin"
          }, 2000)
        } else {
          console.log("[v0] User signup successful, redirecting to dashboard")
          toast({
            title: "Account created! 🎉",
            description: "Welcome to Sedulous Group",
          })
          window.location.href = "/dashboard"
        }
      }
    } catch (err) {
      console.error("[v0] Signup error:", err)
      toast({
        title: "An error occurred",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <h1 className="text-3xl font-bold text-white">Create Account</h1>
            <p className="text-white/60">Join us and start your journey today</p>
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
              <Label htmlFor="fullName" className="text-white/90 text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                           focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                           transition-all rounded-xl"
                  required
                />
              </div>
            </div>

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
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                           focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                           transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white/90 text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+44 7XXX XXXXXX"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                           focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                           transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            {!useMagicLink && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/90 text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField("confirmPassword", e.target.value)}
                      className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                               focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                               transition-all rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                className="border-white/30 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500 mt-1"
                required
              />
              <label htmlFor="terms" className="text-sm text-white/70 cursor-pointer leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-red-400 hover:text-red-300 transition-colors">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-red-400 hover:text-red-300 transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || !formData.agreeToTerms}
              className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700
                       text-white font-semibold rounded-xl shadow-lg shadow-red-500/30
                       hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02]
                       transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                "Creating Account..."
              ) : useMagicLink ? (
                <>
                  Send Magic Link <Sparkles className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
