import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Route segment config - force dynamic rendering (uses cookies)
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
export const revalidate = 0
export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null, error: error?.message || "Not authenticated" }, { status: 401 })
    }

    // Fetch user profile from user_profiles table if exists
    const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single()

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        profile: profile || null,
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching user:", error)
    return NextResponse.json({ user: null, error: "Failed to fetch user" }, { status: 500 })
  }
}
