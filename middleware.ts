import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip maintenance check for admin routes and API routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/maintenance"
  ) {
    return NextResponse.next()
  }

  // Check maintenance mode
  try {
    const baseUrl = request.nextUrl.origin
    const response = await fetch(`${baseUrl}/api/settings/maintenance`, {
      cache: "no-store",
    })

    if (response.ok) {
      const data = await response.json()
      if (data.maintenanceMode === true) {
        return NextResponse.redirect(new URL("/maintenance", request.url))
      }
    }
  } catch (error) {
    console.error("Error checking maintenance mode:", error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
