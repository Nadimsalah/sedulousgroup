"use client"

import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (browserClient) {
    return browserClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Missing Supabase environment variables - returning null")
    return null
  }

  try {
    browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return browserClient
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    return null
  }
}
