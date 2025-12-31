"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      className="rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 h-9 w-9 sm:h-10 sm:w-10 p-0"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  )
}
