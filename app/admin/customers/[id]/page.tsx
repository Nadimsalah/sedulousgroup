import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin, Calendar } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import CustomerDetailsClient from "./customer-details-client"

async function getCustomerDetails(customerId: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase credentials")
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    console.log("[Customer Details] Fetching data for customer ID:", customerId)

    // Step 1: Get user profile
    let profile: any = null
    const { data: profileData, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", customerId)
      .single()

    if (!profileError && profileData) {
      profile = profileData
      console.log("[Customer Details] Found profile:", {
        id: profile.id,
        name: profile.full_name || profile.username,
        phone: profile.phone,
        email: profile.email,
      })
    } else {
      console.error("[Customer Details] Profile error:", profileError)
    }

    // Step 2: Get email from profile or auth
    let customerEmail = profile?.email || null
    if (!customerEmail) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const authUser = authUsers?.users?.find((u) => u.id === customerId)
        customerEmail = authUser?.email || null
        console.log("[Customer Details] Email from auth:", customerEmail)
      } catch (err) {
        console.error("[Customer Details] Error getting auth user:", err)
      }
    }

    // Step 3: Fetch ALL bookings from Supabase
    console.log("[Customer Details] Fetching ALL bookings from Supabase...")
    const { data: allBookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        cars (
          id,
          make,
          model,
          year,
          brand,
          name,
          image_url
        )
      `,
      )
      .order("created_at", { ascending: false })
      .limit(10000) // Get a large number to ensure we don't miss any

    if (bookingsError) {
      console.error("[Customer Details] Error fetching all bookings:", bookingsError)
    }

    console.log("[Customer Details] Total bookings in database:", allBookingsData?.length || 0)

    // Step 4: Filter bookings that match this customer
    const matchingBookings: any[] = []
    const bookingIds = new Set<string>()

    if (allBookingsData && allBookingsData.length > 0) {
      // Get customer identifiers
      const customerPhone = profile?.phone || ""
      const customerName = profile?.full_name || profile?.username || ""
      const normalizedPhone = customerPhone.replace(/[\s\-\(\)]/g, "").toLowerCase()

      console.log("[Customer Details] Filtering bookings by:", {
        customerId,
        customerEmail,
        customerPhone,
        customerName,
        normalizedPhone,
      })

      allBookingsData.forEach((booking: any) => {
        // Check if already added
        if (bookingIds.has(booking.id)) return

        let isMatch = false

        // Match by user_id
        if (booking.user_id === customerId) {
          isMatch = true
          console.log("[Customer Details] Match by user_id:", booking.id)
        }

        // Match by customer_id
        if (booking.customer_id === customerId) {
          isMatch = true
          console.log("[Customer Details] Match by customer_id:", booking.id)
        }

        // Match by email (exact or case-insensitive)
        if (customerEmail && booking.customer_email) {
          const bookingEmail = (booking.customer_email || "").toLowerCase().trim()
          const customerEmailLower = customerEmail.toLowerCase().trim()
          if (bookingEmail === customerEmailLower) {
            isMatch = true
            console.log("[Customer Details] Match by email:", booking.id, bookingEmail)
          }
        }

        // Match by phone (normalized)
        if (normalizedPhone && booking.customer_phone) {
          const bookingPhone = (booking.customer_phone || "").replace(/[\s\-\(\)]/g, "").toLowerCase()
          if (bookingPhone === normalizedPhone || bookingPhone.includes(normalizedPhone) || normalizedPhone.includes(bookingPhone)) {
            isMatch = true
            console.log("[Customer Details] Match by phone:", booking.id, {
              customerPhone: normalizedPhone,
              bookingPhone: bookingPhone,
            })
          }
        }

        // Match by name (fuzzy)
        if (customerName && booking.customer_name) {
          const bookingName = (booking.customer_name || "").toLowerCase().trim()
          const customerNameLower = customerName.toLowerCase().trim()
          
          // Exact match
          if (bookingName === customerNameLower) {
            isMatch = true
            console.log("[Customer Details] Match by exact name:", booking.id)
          }
          
          // Partial match (name contains customer name or vice versa)
          if (bookingName.includes(customerNameLower) || customerNameLower.includes(bookingName)) {
            isMatch = true
            console.log("[Customer Details] Match by partial name:", booking.id)
          }
          
          // Word-by-word match
          const customerWords = customerNameLower.split(/\s+/).filter(w => w.length > 1)
          const bookingWords = bookingName.split(/\s+/).filter(w => w.length > 1)
          if (customerWords.some(word => bookingWords.includes(word))) {
            isMatch = true
            console.log("[Customer Details] Match by word:", booking.id)
          }
        }

        if (isMatch) {
          matchingBookings.push(booking)
          bookingIds.add(booking.id)
        }
      })
    }

    console.log("[Customer Details] Found", matchingBookings.length, "matching bookings")

    // Sort by created_at descending
    matchingBookings.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    return {
      profile: profile || null,
      bookings: matchingBookings,
      email: customerEmail || "N/A",
    }
  } catch (error) {
    console.error("[Customer Details] Error:", error)
    return {
      profile: null,
      bookings: [],
      email: "N/A",
    }
  }
}

function formatCustomerId(id: string): string {
  if (!id) return "N/A"
  const shortened = id.slice(-4).toUpperCase()
  return `CUS-${shortened}`
}

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  console.log("[Customer Details Page] Loading customer with ID:", id)
  
  const { profile, bookings, email } = await getCustomerDetails(id)
  
  console.log("[Customer Details Page] Fetched data:", {
    hasProfile: !!profile,
    bookingsCount: bookings.length,
    email: email,
    bookings: bookings.map((b: any) => ({
      id: b.id,
      customer_email: b.customer_email,
      customer_name: b.customer_name,
      status: b.status,
      total_amount: b.total_amount,
    })),
  })

  // If no profile but we have bookings, create a minimal profile
  const displayProfile = profile || {
    id: id,
    full_name: bookings.length > 0 ? bookings[0]?.customer_name : "Unknown Customer",
    username: bookings.length > 0 ? bookings[0]?.customer_name : "Unknown",
    phone: profile?.phone || (bookings.length > 0 ? bookings[0]?.customer_phone : "N/A"),
    address: null,
    created_at: bookings.length > 0 ? bookings[0]?.created_at : null,
  }

  // Calculate active bookings for the badge
  const activeBookings = bookings.filter((b: any) => {
    const status = (b.status || "").toLowerCase()
    return ["active", "approved", "pending", "confirmed"].includes(status)
  })

  // Show page even if no profile, as long as we have some data
  if (!profile && bookings.length === 0 && email === "N/A") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Customer Not Found</h2>
          <p className="text-gray-400 mb-4">No profile or bookings found for this customer.</p>
          <p className="text-gray-500 text-sm mb-4">Customer ID: {id}</p>
          <Link href="/admin/customers">
            <Button>Go Back</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Link href="/admin/customers">
          <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Customers
          </Button>
        </Link>

        {/* Customer Profile Card */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-3xl shrink-0">
              {(displayProfile.full_name || displayProfile.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{displayProfile.full_name || displayProfile.username || "Unknown"}</h1>
              <p className="text-gray-400 mt-1">Customer ID: {formatCustomerId(displayProfile.id)}</p>
              <Badge
                className={`mt-3 ${
                  activeBookings.length > 0
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }`}
              >
                {activeBookings.length > 0 ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm text-white break-all">{email !== "N/A" ? email : "Not available"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="text-sm text-white">{displayProfile.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm text-white">{displayProfile.address || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Joined</p>
                <p className="text-sm text-white">
                  {displayProfile.created_at ? new Date(displayProfile.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics and Booking History - Client Component */}
        <CustomerDetailsClient bookings={bookings} customerId={id} email={email} />
      </div>
    </div>
  )
}
