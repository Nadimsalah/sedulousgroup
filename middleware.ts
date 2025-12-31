import type { NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)

  // If Supabase middleware returned a redirect, use it
  if (supabaseResponse.status !== 200) {
    return supabaseResponse
  }

  // Check admin routes separately (admin uses cookie-based auth, not Supabase)
  if (
    request.nextUrl.pathname === "/admin" ||
    (request.nextUrl.pathname.startsWith("/admin/") && !request.nextUrl.pathname.startsWith("/admin/login"))
  ) {
    // Admin routes are now protected by Supabase auth, not cookie
    // The admin layout will handle authentication check
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
