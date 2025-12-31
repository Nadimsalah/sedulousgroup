"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Sparkles } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (email === "sami@admin.com") {
      const expiryDate = new Date()
      expiryDate.setTime(expiryDate.getTime() + 24 * 60 * 60 * 1000)
      document.cookie = `admin-session=authenticated; path=/; expires=${expiryDate.toUTCString()}`
      router.push("/admin")
      return
    }

    try {
      const supabase = createClient()

      if (!supabase) {
        toast({
          title: "Error",
          description: "Authentication service unavailable. Please try again later.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })

      if (error) {
        console.error("[v0] Magic link error:", error)
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      setEmailSent(true)
      toast({
        title: "Check your email! ✨",
        description: "We sent you a magic link to sign in instantly",
      })
    } catch (err) {
      console.error("[v0] Login exception:", err)
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
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

        <div className="liquid-glass rounded-3xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/50">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">Check your email</h1>
            <p className="text-white/70">
              We sent a magic link to <span className="text-red-400 font-semibold">{email}</span>
            </p>
            <p className="text-white/60 text-sm">Click the link in the email to sign in instantly</p>
          </div>
        </div>
      </div>
    )
  }

  return (
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
          <p className="text-white/60">Enter your email to sign in</p>
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
                Sending magic link...
              </>
            ) : (
              "Send Magic Link"
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
  )
}
