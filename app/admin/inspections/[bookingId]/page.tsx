"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import {
    ArrowLeft, Download, FileText, Calendar, Car, User,
    CheckCircle, Activity, Fuel, Gauge, Clock, Camera
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

import { getBookingInspectionDetails } from "@/app/actions/inspection-details"

export default function InspectionDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const bookingId = params.bookingId as string

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    useEffect(() => {
        if (bookingId) {
            loadDetails()
        }
    }, [bookingId])

    const loadDetails = async () => {
        try {
            const res = await getBookingInspectionDetails(bookingId)
            if (res.success) {
                setData(res.data)
            } else {
                toast.error(res.error || "Failed to load details")
            }
        } catch (e) {
            toast.error("Error loading details")
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white"><Loader2 className="animate-spin h-8 w-8 text-red-600" /></div>
    if (!data) return <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">Booking not found</div>

    const { booking, handover, return: returnInsp, agreement, vehicleHistory, timeline } = data

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20'
            case 'active': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
            default: return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20'
        }
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-zinc-400 hover:text-white">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-3">
                                Inspection Details
                                <Badge variant="outline" className={getStatusColor(booking.status)}>
                                    {(booking.status || 'Unknown').toUpperCase()}
                                </Badge>
                            </h1>
                            <p className="text-zinc-400 text-sm">Booking ID: {booking.id}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">

                        {agreement && (
                            <Button
                                variant="outline"
                                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800"
                                onClick={() => {
                                    const url = agreement.pdf_url || agreement.signed_agreement_url || agreement.agreement_url;
                                    if (url) {
                                        window.open(url, '_blank');
                                    } else {
                                        toast.error("PDF URL not found");
                                    }
                                }}
                            >
                                <Download className="mr-2 h-4 w-4" /> Agreement PDF
                            </Button>
                        )}
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{booking.customer_name}</div>
                            <div className="text-sm text-zinc-400">{booking.customer_email}</div>
                            <div className="text-sm text-zinc-400">{booking.customer_phone}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Car className="h-4 w-4" /> Vehicle
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{booking.car_name}</div>
                            <div className="text-sm text-zinc-400 font-mono">{booking.car_registration_number}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> Period
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-zinc-300">
                                <span className="text-zinc-500">Pickup:</span> {format(new Date(booking.pickup_date), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-zinc-300">
                                <span className="text-zinc-500">Dropoff:</span> {format(new Date(booking.dropoff_date), 'MMM dd, yyyy')}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger value="overview">Overview & Timeline</TabsTrigger>
                        <TabsTrigger value="history">Full History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-8">

                        {/* 1. Handover (Before) */}
                        <div className="relative border-l-2 border-zinc-800 pl-8 pb-8 space-y-4">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-yellow-500 ring-4 ring-zinc-950" />

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-500">Handover (Pickup)</h3>
                                    <p className="text-zinc-400 text-sm">
                                        {handover ? format(new Date(handover.created_at), "PPp") : "Not Recorded"}
                                    </p>
                                </div>
                            </div>

                            {handover ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800/50">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                                                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Gauge className="h-3 w-3" /> Odometer</div>
                                                <div className="text-xl font-mono">{handover.odometer_reading} km</div>
                                            </div>
                                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                                                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel</div>
                                                <div className="text-xl">{handover.fuel_level}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 text-sm font-medium mb-1">Notes / Damage</p>
                                            <p className="text-sm text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800 min-h-[60px]">
                                                {handover.damage_notes || "No notes"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-zinc-400 text-sm font-medium mb-2">Photos ({handover.exterior_photos?.length + handover.interior_photos?.length || 0})</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {[...(handover.exterior_photos || []), ...(handover.interior_photos || []), ...(handover.damage_photos || [])].map((url: string, i: number) => (
                                                <div key={i} className="relative aspect-square rounded overflow-hidden bg-zinc-950 border border-zinc-800">
                                                    <Image src={url} alt="Handover" fill className="object-cover hover:scale-110 transition-transform cursor-pointer" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic">No handover inspection data found.</div>
                            )}
                        </div>

                        {/* 2. Agreement Assets */}
                        <div className="relative border-l-2 border-zinc-800 pl-8 pb-8 space-y-4">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-purple-500 ring-4 ring-zinc-950" />
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-purple-500">Agreement & Assets</h3>
                                    <p className="text-zinc-400 text-sm">
                                        {agreement ? format(new Date(agreement.created_at), "PPp") : "Not Recorded"}
                                    </p>
                                </div>
                            </div>

                            {agreement ? (
                                <div className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800/50 space-y-4">
                                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        Agreement Status: <span className="uppercase font-bold">{agreement.status}</span>
                                    </div>

                                    {agreement.vehicle_photos && agreement.vehicle_photos.length > 0 && (
                                        <div>
                                            <p className="text-zinc-400 text-sm font-medium mb-2">Verification Photos (Sent to Client)</p>
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                                {agreement.vehicle_photos.map((url: string, i: number) => (
                                                    <div key={i} className="relative aspect-square rounded overflow-hidden bg-zinc-950 border border-zinc-800">
                                                        <Image src={url} alt="Agreement Asset" fill className="object-cover hover:scale-110 transition-transform cursor-pointer" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {agreement.signature_image_url && (
                                        <div>
                                            <p className="text-zinc-400 text-sm font-medium mb-2">Customer Signature</p>
                                            <div className="relative h-24 w-64 bg-white rounded p-2">
                                                <Image src={agreement.signature_image_url} alt="Signature" fill className="object-contain" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic">No agreement record found.</div>
                            )}
                        </div>

                        {/* 3. Return (After) */}
                        <div className="relative border-l-2 border-transparent pl-8 pb-8 space-y-4">
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-500 ring-4 ring-zinc-950" />

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-blue-500">Return (Dropoff)</h3>
                                    <p className="text-zinc-400 text-sm">
                                        {returnInsp ? format(new Date(returnInsp.created_at), "PPp") : "Not Recorded"}
                                    </p>
                                </div>
                            </div>

                            {returnInsp ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800/50">
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                                                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Gauge className="h-3 w-3" /> Odometer</div>
                                                <div className="text-xl font-mono">{returnInsp.odometer_reading} km</div>
                                                {handover && (
                                                    <div className="text-xs text-zinc-500 mt-1">
                                                        Diff: +{returnInsp.odometer_reading - handover.odometer_reading} km
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
                                                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1 flex items-center gap-1"><Fuel className="h-3 w-3" /> Fuel</div>
                                                <div className="text-xl">{returnInsp.fuel_level}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-zinc-400 text-sm font-medium mb-1">Notes / Damage</p>
                                            <p className="text-sm text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800 min-h-[60px]">
                                                {returnInsp.damage_notes || "No notes"}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-zinc-400 text-sm font-medium mb-2">Photos ({returnInsp.exterior_photos?.length + returnInsp.interior_photos?.length || 0})</p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {[...(returnInsp.exterior_photos || []), ...(returnInsp.interior_photos || []), ...(returnInsp.damage_photos || [])].map((url: string, i: number) => (
                                                <div key={i} className="relative aspect-square rounded overflow-hidden bg-zinc-950 border border-zinc-800">
                                                    <Image src={url} alt="Return" fill className="object-cover hover:scale-110 transition-transform cursor-pointer" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic">No return inspection data found.</div>
                            )}
                        </div>

                    </TabsContent>

                    <TabsContent value="history" className="space-y-8">

                        {/* Event Log */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Booking Events</h3>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-zinc-950 text-zinc-400">
                                        <tr>
                                            <th className="p-3">Event</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Author</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-800">
                                        {timeline.map((event: any, i: number) => (
                                            <tr key={i} className="hover:bg-zinc-800/50">
                                                <td className="p-3 font-medium capitalize">{event.type.replace('_', ' ')}</td>
                                                <td className="p-3 text-zinc-400">{format(new Date(event.date), "PPp")}</td>
                                                <td className="p-3 text-zinc-400">{event.author}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Vehicle History */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold">Vehicle History (Previous Bookings)</h3>
                            {vehicleHistory.length > 0 ? (
                                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-950 text-zinc-400">
                                            <tr>
                                                <th className="p-3">Customer</th>
                                                <th className="p-3">Dates</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800">
                                            {vehicleHistory.map((h: any) => (
                                                <tr key={h.id} className="hover:bg-zinc-800/50">
                                                    <td className="p-3 font-medium">{h.customer_name}</td>
                                                    <td className="p-3 text-zinc-400">
                                                        {format(new Date(h.pickup_date), "MMM d")} - {format(new Date(h.dropoff_date), "MMM d, yyyy")}
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-xs">{h.status}</Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/inspections/${h.id}`)}>
                                                            View
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-zinc-500 italic">No previous history found for this vehicle.</div>
                            )}
                        </div>

                    </TabsContent>
                </Tabs>

            </div>
        </div>
    )
}
