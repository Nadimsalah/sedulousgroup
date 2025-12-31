import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  const supabase = await createClient()

  if (supabase) {
    await supabase.auth.signOut()
  }

  const allCookies = cookieStore.getAll()
  allCookies.forEach((cookie) => {
    if (cookie.name.includes("supabase") || cookie.name.includes("auth")) {
      cookieStore.delete(cookie.name)
    }
  })

  // Clear custom cookies
  cookieStore.delete("user-session")
  cookieStore.delete("user-email")

  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"))
}
