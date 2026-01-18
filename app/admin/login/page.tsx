"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"

import { useEffect } from "react"

export default function AdminLogin() {
  const router = useRouter()

  useEffect(() => {
    // SECURITY DISABLED - Auto redirect to dashboard
    router.push("/admin")
  }, [router])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center text-white">
        <h1 className="text-2xl font-bold mb-4">Admin Access Unlocked</h1>
        <p className="text-neutral-400 mb-8">Security check disabled. Redirecting to dashboard...</p>
        <Button
          onClick={() => router.push("/admin")}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Enter Dashboard
        </Button>
      </div>
    </div>
  )
}
