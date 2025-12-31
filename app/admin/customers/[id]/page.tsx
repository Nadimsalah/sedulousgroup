import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Car } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

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
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", customerId)
      .single()

    if (profileError) {
      console.error("[Customer Details] Profile error:", profileError)
    }

    // Get email from profile or auth
    let customerEmail = profile?.email || null
    if (!customerEmail) {
      try {
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        const authUser = authUsers?.users?.find((u) => u.id === customerId)
        customerEmail = authUser?.email || null
      } catch (err) {
        console.error("[Customer Details] Error getting auth user:", err)
      }
    }

    // Fetch bookings using multiple strategies
    let allBookings: any[] = []
    const bookingIds = new Set<string>()

    // Strategy 1: Search by customer_email (exact match)
    if (customerEmail) {
      const { data: bookings1 } = await supabase
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
        .eq("customer_email", customerEmail)

      if (bookings1) {
        bookings1.forEach((b: any) => {
          if (!bookingIds.has(b.id)) {
            allBookings.push(b)
            bookingIds.add(b.id)
          }
        })
      }
    }

    // Strategy 2: Search by user_id
    const { data: bookings2 } = await supabase
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
      .eq("user_id", customerId)

    if (bookings2) {
      bookings2.forEach((b: any) => {
        if (!bookingIds.has(b.id)) {
          allBookings.push(b)
          bookingIds.add(b.id)
        }
      })
    }

    // Strategy 3: Search by customer_id
    const { data: bookings3 } = await supabase
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
      .eq("customer_id", customerId)

    if (bookings3) {
      bookings3.forEach((b: any) => {
        if (!bookingIds.has(b.id)) {
          allBookings.push(b)
          bookingIds.add(b.id)
        }
      })
    }

    // Strategy 4: Search by customer_name if available
    if (profile?.full_name) {
      const nameParts = profile.full_name.trim().split(/\s+/)
      if (nameParts.length > 0) {
        const { data: bookings4 } = await supabase
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
          .ilike("customer_name", `%${nameParts[0]}%`)

        if (bookings4) {
          bookings4.forEach((b: any) => {
            if (!bookingIds.has(b.id)) {
              allBookings.push(b)
              bookingIds.add(b.id)
            }
          })
        }
      }
    }

    // Sort bookings by created_at descending
    allBookings.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    return {
      profile: profile || null,
      bookings: allBookings,
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

function getCarDisplayName(car: any): string {
  if (!car) return "Unknown Vehicle"
  const make = car.make || car.brand || ""
  const model = car.model || car.name || ""
  const year = car.year || ""
  return `${make} ${model} ${year}`.trim() || "Unknown Vehicle"
}

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { profile, bookings, email } = await getCustomerDetails(id)

  if (!profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Customer Not Found</h2>
          <Link href="/admin/customers">
            <Button>Go Back</Button>
          </Link>
        </div>
      </div>
    )
  }

  const activeBookings = bookings.filter((b: any) => {
    const status = (b.status || "").toLowerCase()
    return ["active", "approved", "pending", "confirmed"].includes(status)
  })

  const totalSpent = bookings.reduce((sum: number, b: any) => {
    const amount = parseFloat(b.total_amount) || 0
    return sum + amount
  }, 0)

  const lastBooking = bookings.length > 0 ? bookings[0] : null

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
              {(profile.full_name || profile.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{profile.full_name || profile.username || "Unknown"}</h1>
              <p className="text-gray-400 mt-1">Customer ID: {formatCustomerId(profile.id)}</p>
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
                <p className="text-sm text-white">{profile.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Location</p>
                <p className="text-sm text-white">{profile.address || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Joined</p>
                <p className="text-sm text-white">
                  {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="liquid-glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{bookings.length}</p>
            </CardContent>
          </Card>
          <Card className="liquid-glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Active Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">{activeBookings.length}</p>
            </CardContent>
          </Card>
          <Card className="liquid-glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">£{totalSpent.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card className="liquid-glass border-white/10">
            <CardHeader>
              <CardTitle className="text-sm text-gray-400">Last Booking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-bold text-white">
                {lastBooking ? new Date(lastBooking.created_at).toLocaleDateString() : "N/A"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Booking History */}
        <div className="liquid-glass rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Booking History</h2>
          {bookings.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No bookings yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{getCarDisplayName(booking.cars)}</h3>
                    <Badge
                      className={
                        booking.status === "active" || booking.status === "approved"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : booking.status === "completed"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : booking.status === "cancelled"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      }
                    >
                      {booking.status || "pending"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Pickup</p>
                      <p className="text-white">
                        {booking.pickup_date
                          ? new Date(booking.pickup_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Dropoff</p>
                      <p className="text-white">
                        {booking.dropoff_date
                          ? new Date(booking.dropoff_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Amount</p>
                      <p className="text-white">£{parseFloat(booking.total_amount || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Booked</p>
                      <p className="text-white">
                        {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
