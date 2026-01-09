import { NextRequest, NextResponse } from "next/server"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const fetchCache = 'force-no-store'
export const revalidate = 0

function createAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tableName = searchParams.get("table")

    if (!tableName) {
      return NextResponse.json(
        { exists: false, error: "Table name is required" },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabase()

    // Try to query the table - if it exists, this will succeed
    // If it doesn't exist, we'll get an error
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1)

    if (error) {
      // Check if error is "table doesn't exist"
      if (
        error.code === "42P01" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("schema cache")
      ) {
        return NextResponse.json({ exists: false, error: error.message })
      }
      // Other errors might mean the table exists but has no data or RLS issues
      // For our purposes, if we can query it (even with an error), the table likely exists
      // But let's be conservative and say it doesn't exist if we get a clear "not found" error
      return NextResponse.json({ exists: false, error: error.message })
    }

    // If we got data or no error, the table exists
    return NextResponse.json({ exists: true })
  } catch (error) {
    console.error("Error checking table:", error)
    return NextResponse.json(
      {
        exists: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

