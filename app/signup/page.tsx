"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Phone } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { SiteHeader } from "@/components/site-header"
import { AnimatedGradient } from "@/components/animated-gradient"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      if (!data.user) {
        toast({
          title: "Sign up failed",
          description: "Unable to create account. Please try again.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      try {
        await supabase.from("user_profiles").upsert({
          id: data.user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
      } catch (profileError) {
        console.error("[v0] Profile creation error:", profileError)
      }

      toast({
        title: "Account created! 🎉",
        description: "Please check your email to verify your account",
      })

      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (err) {
      console.error("[v0] Signup exception:", err)
      toast({
        title: "An error occurred",
        description: err instanceof Error ? err.message : "Please try again later",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-white/60">Join us and start your journey today</p>
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
                    disabled={loading}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
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
                    disabled={loading}
                    className="pl-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
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
                    disabled={loading}
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
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    disabled={loading}
                    className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
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
                    disabled={loading}
                    className="pl-11 pr-11 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40
                             focus:bg-white/15 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20
                             transition-all rounded-xl disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateField("agreeToTerms", checked as boolean)}
                  disabled={loading}
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
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account{" "}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/10">
              <p className="text-white/60 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
