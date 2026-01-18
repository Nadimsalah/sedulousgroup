
import { createAdminSupabase } from "@/lib/supabase/admin";
import Link from "next/link";
import { ArrowLeft, Calendar, Car, User, FileText, CheckCircle, Clock, MapPin, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = createAdminSupabase();

    // Fetch Booking with Car & Customer info (from booking columns)
    // Fetch Booking with Car & Customer info (from booking columns)
    const { data: booking, error } = await supabase
        .from("bookings")
        .select(`
            *,
            cars (
                id, brand, name, registration_number, year, image
            )
        `)
        .eq("id", id)
        .single();

    if (error || !booking) {
        return (
            <div className="flex h-screen items-center justify-center bg-zinc-950 text-white flex-col gap-4">
                <div className="text-xl font-bold">Booking Not Found</div>
                <p className="text-zinc-400">ID: {id}</p>
                <Link href="/admin/bookings"><Button variant="outline">Back to Bookings</Button></Link>
            </div>
        );
    }

    // Fetch related records
    const { data: agreement } = await supabase
        .from("agreements")
        .select("*")
        .eq("booking_id", id)
        .maybeSingle();

    const { data: inspections } = await supabase
        .from("vehicle_inspections")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: true });

    const handover = inspections?.find((i: any) => i.inspection_type === 'handover');
    const returnInsp = inspections?.find((i: any) => i.inspection_type === 'return');

    // Helpers
    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : "N/A";

    // Car Info
    const carName = booking.cars ? `${booking.cars.brand} ${booking.cars.name}` : (booking.car_name || "Unknown Vehicle");
    const carReg = booking.cars?.registration_number || booking.car_registration_number || "N/A";

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-8 space-y-6">
            <div>
                <Link href="/admin/bookings" className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back to Bookings
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            Booking Details
                            <Badge variant="outline" className="text-lg uppercase">
                                {booking.status}
                            </Badge>
                        </h1>
                        <p className="text-zinc-500 font-mono text-sm mt-1">{booking.id}</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/admin/inspections/${booking.id}`}>
                            <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                <CheckCircle className="mr-2 h-4 w-4" /> Inspections
                            </Button>
                        </Link>
                        <Link href={`/admin/agreement-steps/${booking.id}`}>
                            <Button variant="outline" className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                <FileText className="mr-2 h-4 w-4" /> Open Agreement
                            </Button>
                        </Link>
                        {agreement && (agreement.pdf_url || agreement.signed_agreement_url) && (
                            <Button
                                variant="outline"
                                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
                                asChild
                            >
                                <a href={agreement.pdf_url || agreement.signed_agreement_url} target="_blank" className="flex items-center">
                                    <FileText className="mr-2 h-4 w-4" /> Download PDF
                                </a>
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Main Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Customer & Vehicle */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><User className="h-4 w-4" /> Customer</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-lg font-bold">{booking.customer_name}</div>
                                <div className="text-sm text-zinc-400">{booking.customer_email}</div>
                                <div className="text-sm text-zinc-400">{booking.customer_phone}</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Car className="h-4 w-4" /> Vehicle</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                <div className="text-lg font-bold">{carName}</div>
                                <div className="text-sm font-mono bg-zinc-950 px-2 py-1 rounded w-fit text-zinc-300 border border-zinc-800">{carReg}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timeline */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><Calendar className="h-4 w-4" /> Schedule</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-8 relative">
                                {/* Connector Line (Desktop) */}
                                <div className="hidden md:block absolute top-3 left-32 right-32 h-0.5 bg-zinc-800 -z-10"></div>

                                <div className="flex-1 flex flex-col md:items-center text-left md:text-center gap-2">
                                    <div className="md:w-6 md:h-6 rounded-full bg-green-500/20 border-2 border-green-500 shrink-0 z-10"></div>
                                    <div>
                                        <div className="text-xs text-zinc-400 uppercase font-bold">Pickup</div>
                                        <div className="font-bold text-lg text-green-400">{formatDate(booking.pickup_date)}</div>
                                        <div className="text-sm text-zinc-500">{booking.pickup_location}</div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col md:items-center text-left md:text-center gap-2">
                                    <div className="md:w-6 md:h-6 rounded-full bg-blue-500/20 border-2 border-blue-500 shrink-0 z-10"></div>
                                    <div>
                                        <div className="text-xs text-zinc-400 uppercase font-bold">Dropoff</div>
                                        <div className="font-bold text-lg text-blue-400">{formatDate(booking.dropoff_date)}</div>
                                        <div className="text-sm text-zinc-500">{booking.dropoff_location}</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Agreement & Docs */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><FileText className="h-4 w-4" /> Agreement Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {agreement ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${agreement.status === 'signed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium">Rental Agreement #{agreement.agreement_number}</div>
                                                <div className="text-xs text-zinc-500">Created {formatDate(agreement.created_at)}</div>
                                            </div>
                                        </div>
                                        <Badge variant="outline">{agreement.status}</Badge>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm text-zinc-400">
                                        <div>Odometer Out: <span className="text-white">{agreement.odometer_reading}</span></div>
                                        <div>Fuel Out: <span className="text-white">{agreement.fuel_level}</span></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic p-4 text-center">No agreement generated yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Financials & Status */}
                <div className="space-y-6">

                    {/* Financials */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Financials</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                                <span className="text-zinc-400">Total Amount</span>
                                <span className="text-xl font-bold">£{Number(booking.total_amount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-1 text-sm">
                                <span className="text-zinc-400">Deposit</span>
                                <span className="text-zinc-200">£{Number(booking.deposit_amount || 0).toFixed(2)}</span>
                            </div>
                            {booking.stripe_payment_intent_id && (
                                <div className="mt-4 p-3 bg-zinc-950 rounded border border-zinc-800 text-xs">
                                    <div className="text-zinc-500 mb-1">Stripe Payment ID</div>
                                    <div className="font-mono text-zinc-300 break-all">{booking.stripe_payment_intent_id}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Inspection Status */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Inspections</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`flex items-center gap-3 p-3 rounded border ${handover ? 'bg-green-500/5 border-green-500/20' : 'bg-zinc-950 border-zinc-800'}`}>
                                <CheckCircle className={`h-5 w-5 ${handover ? 'text-green-500' : 'text-zinc-600'}`} />
                                <div className="flex-1">
                                    <div className={`font-medium ${handover ? 'text-green-400' : 'text-zinc-500'}`}>Handover</div>
                                    <div className="text-xs text-zinc-500">{handover ? formatDate(handover.created_at) : 'Pending'}</div>
                                </div>
                            </div>

                            <div className={`flex items-center gap-3 p-3 rounded border ${returnInsp ? 'bg-blue-500/5 border-blue-500/20' : 'bg-zinc-950 border-zinc-800'}`}>
                                <CheckCircle className={`h-5 w-5 ${returnInsp ? 'text-blue-500' : 'text-zinc-600'}`} />
                                <div className="flex-1">
                                    <div className={`font-medium ${returnInsp ? 'text-blue-400' : 'text-zinc-500'}`}>Return</div>
                                    <div className="text-xs text-zinc-500">{returnInsp ? formatDate(returnInsp.created_at) : 'Pending'}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Metadata */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardContent className="pt-6 space-y-2 text-xs text-zinc-500">
                            <div className="flex justify-between">
                                <span>Created</span>
                                <span>{formatDate(booking.created_at)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Updated</span>
                                <span>{formatDate(booking.updated_at)}</span>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}

