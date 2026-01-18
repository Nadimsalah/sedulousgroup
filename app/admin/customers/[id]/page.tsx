import Link from "next/link";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, CheckCircle, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageProps = { params: { id: string } };

function formatDate(dt?: string | null) {
  if (!dt) return "N/A";
  try {
    return new Date(dt).toLocaleDateString("en-GB", {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dt;
  }
}

function moneyGBP(v?: number | null) {
  if (v == null) return "£0.00";
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(v);
}

export default async function CustomerDetailsPage({ params }: PageProps) {
  const supabase = createAdminSupabase();
  const customerId = params.id;

  // 1) Fetch customer profile
  console.log(`[CustomerDetails] Fetching profile for ${customerId}`);

  let customer: any = null;
  let email: string | null = null;

  // Try fetching from user_profiles
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", customerId)
    .single();

  if (profile) {
    customer = profile;
    email = profile.username; // simplistic fallback based on schema triggers
    // Try to get real email from auth if possible (admin only)
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(customerId);
    if (user) {
      email = user.email || email;
      customer = { ...customer, ...user.user_metadata, email: user.email }; // Merge metadata
    }
  } else {
    // If no profile, try auth directly
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(customerId);
    if (user) {
      customer = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || "Unknown",
        phone: user.phone || user.user_metadata?.phone,
        created_at: user.created_at,
        email: user.email
      };
      email = user.email || null;
    }
  }

  // 2) Fetch bookings
  // We need to match by customer_id OR user_id OR email
  // Since OR across complex conditions is hard in simple Supabase query, we might fetch a broader set or parallel queries.
  // Strategy: Fetch by ID first.

  console.log(`[CustomerDetails] Fetching bookings for ${customerId} / ${email}`);

  let query = supabase
    .from("bookings")
    .select("*")
    .or(`customer_id.eq.${customerId},user_id.eq.${customerId}`)
    .order("created_at", { ascending: false });

  const { data: bookingsById, error: bookingsErr } = await query;

  let finalBookings = bookingsById || [];

  // Fallback by Email if ID yielded nothing or incomplete
  if (email) {
    const { data: bookingsByEmail } = await supabase
      .from("bookings")
      .select("*")
      .ilike("customer_email", email)
      .order("created_at", { ascending: false });

    if (bookingsByEmail && bookingsByEmail.length > 0) {
      // Merge avoiding duplicates
      const existingIds = new Set(finalBookings.map(b => b.id));
      bookingsByEmail.forEach((b: any) => {
        if (!existingIds.has(b.id)) {
          finalBookings.push(b);
        }
      });
    }
  }

  // Normalize dates for sorting
  finalBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // 3) Fetch related data (Agreements, Inspections, Cars)
  const bookingIds = finalBookings.map((b: any) => b.id);
  const carIds = Array.from(new Set(finalBookings.map((b: any) => b.car_id).filter(Boolean)));

  // Fetch Agreements
  const { data: agreements } = bookingIds.length
    ? await supabase
      .from("agreements")
      .select("id, booking_id, status, signed_agreement_url, pdf_url, created_at")
      .in("booking_id", bookingIds)
    : { data: [] };

  // Fetch Inspections
  const { data: inspections } = bookingIds.length
    ? await supabase
      .from("vehicle_inspections")
      .select("id, booking_id, inspection_type, created_at")
      .in("booking_id", bookingIds)
    : { data: [] };

  // Fetch Cars
  const { data: cars } = carIds.length
    ? await supabase
      .from("cars")
      .select("id, brand, registration_number, name")
      .in("id", carIds)
    : { data: [] };


  // Map data
  const agreementByBooking = new Map();
  agreements?.forEach((a: any) => agreementByBooking.set(a.booking_id, a));

  const inspectionsByBooking = new Map();
  inspections?.forEach((i: any) => {
    const arr = inspectionsByBooking.get(i.booking_id) || [];
    arr.push(i);
    inspectionsByBooking.set(i.booking_id, arr);
  });

  const carById = new Map();
  cars?.forEach((c: any) => carById.set(c.id, c));

  // 4) KPIs
  const totalBookings = finalBookings.length;
  const activeStatuses = new Set(["active", "approved", "confirmed", "on rent", "ongoing"]);
  const activeBookings = finalBookings.filter((b: any) => activeStatuses.has((b.status || "").toLowerCase())).length;
  const totalSpent = finalBookings.reduce((sum: number, b: any) => sum + (Number(b.total_amount) || 0), 0);
  const lastBookingDate = finalBookings[0]?.created_at || null;

  if (!customer && totalBookings === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white flex-col gap-4">
        <h1 className="text-xl font-bold">Customer Not Found</h1>
        <p className="text-zinc-400">ID: {customerId}</p>
        <Link href="/admin/customers"><Button variant="outline">Back</Button></Link>
      </div>
    )
  }

  const displayName = customer?.full_name || customer?.name || (bookingsById?.[0]?.customer_name) || "Unknown Customer";
  const displayEmail = email || customer?.email || (bookingsById?.[0]?.customer_email) || "N/A";
  const displayPhone = customer?.phone || (bookingsById?.[0]?.customer_phone) || "N/A";
  const displayJoined = customer?.created_at || (bookingsById?.[bookingsById.length - 1]?.created_at);

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8 space-y-8">
      <div>
        <Link className="text-sm text-zinc-400 hover:text-white flex items-center gap-2" href="/admin/customers">
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </Link>
      </div>

      {/* Header Profile */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{displayName}</h1>
                <code className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded mt-1 block w-fit">{customerId}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-zinc-500" /> {displayEmail}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-zinc-500" /> {displayPhone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-500" /> {customer?.location || "Location N/A"}</div>
              <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-zinc-500" /> Joined {formatDate(displayJoined)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[140px]">
              <div className="text-zinc-500 text-xs uppercase font-medium">Total Bookings</div>
              <div className="text-2xl font-bold mt-1">{totalBookings}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[140px]">
              <div className="text-zinc-500 text-xs uppercase font-medium">Active</div>
              <div className="text-2xl font-bold mt-1 text-green-500">{activeBookings}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[140px]">
              <div className="text-zinc-500 text-xs uppercase font-medium">Total Spent</div>
              <div className="text-2xl font-bold mt-1 text-yellow-500">{moneyGBP(totalSpent)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl min-w-[140px]">
              <div className="text-zinc-500 text-xs uppercase font-medium">Last Booking</div>
              <div className="text-sm font-medium mt-2">{formatDate(lastBookingDate)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking History */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Car className="h-5 w-5" /> Booking History</h2>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">{totalBookings} records</Badge>
        </div>

        {finalBookings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            No bookings found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-950/50 text-zinc-400 capitalize border-b border-zinc-800">
                <tr>
                  <th className="p-4 rounded-tl-lg">Dates</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Agreement</th>
                  <th className="p-4">Inspections</th>
                  <th className="p-4 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {finalBookings.map((b: any) => {
                  const car = b.car_id ? carById.get(b.car_id) : null;
                  const agreement = agreementByBooking.get(b.id);
                  const insps = inspectionsByBooking.get(b.id) || [];
                  const handover = insps.find((i: any) => i.inspection_type === 'handover');
                  const result = insps.find((i: any) => i.inspection_type === 'return');

                  // Fallback strings if car object missing but denormalized data exists in booking?
                  // Assuming booking might have car_name if join failed
                  const carName = car ? `${car.brand} ${car.name}` : (b.car_name || "Unknown Vehicle");
                  const carReg = car ? car.registration_number : (b.car_registration_number || b.vehicle_registration || "N/A");

                  return (
                    <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-zinc-200">
                          {new Date(b.pickup_date).toLocaleDateString()}
                          <span className="text-zinc-600 mx-2">→</span>
                          {new Date(b.dropoff_date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">Booked {new Date(b.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-zinc-200 font-medium">{carName}</div>
                        <div className="text-xs text-zinc-500 font-mono">{carReg}</div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`
                                    ${b.status?.toLowerCase().includes('active') ? 'text-green-400 border-green-500/30 bg-green-500/10' : ''}
                                    ${b.status?.toLowerCase().includes('completed') ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : ''}
                                    ${b.status?.toLowerCase().includes('pending') ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' : ''}
                                `}>
                          {b.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-zinc-300 font-mono">
                        {moneyGBP(b.total_amount)}
                      </td>
                      <td className="p-4">
                        {agreement ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="text-xs w-fit">{agreement.status}</Badge>
                            {(agreement.pdf_url || agreement.signed_agreement_url) && (
                              <a href={agreement.pdf_url || agreement.signed_agreement_url} target="_blank" className="text-xs text-red-400 hover:text-red-300 underline">
                                Download PDF
                              </a>
                            )}
                          </div>
                        ) : <span className="text-zinc-600">-</span>}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-1 ${handover ? "text-green-500" : "text-zinc-600"}`}>
                            <CheckCircle className="h-3 w-3" /> Handover
                            {handover && <span className="text-zinc-500 ml-1">{new Date(handover.created_at).toLocaleDateString()}</span>}
                          </div>
                          <div className={`flex items-center gap-1 ${result ? "text-green-500" : "text-zinc-600"}`}>
                            <CheckCircle className="h-3 w-3" /> Return
                            {result && <span className="text-zinc-500 ml-1">{new Date(result.created_at).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/bookings/${b.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 border border-zinc-700 bg-zinc-800/50">Details</Button>
                          </Link>
                          <Link href={`/admin/inspections/${b.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 border border-zinc-700 bg-zinc-800/50">Insp</Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
