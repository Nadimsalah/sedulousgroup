"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Plus,
    Trash2,
    MapPin,
    ArrowLeft,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Search
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
    getLocations,
    createLocation,
    deleteLocation,
    toggleLocationStatus
} from "@/app/actions/locations"

interface Location {
    id: string
    name: string
    address?: string
    is_active: boolean
}

export default function LocationsSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [locations, setLocations] = useState<Location[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [newLocation, setNewLocation] = useState({ name: "", address: "" })

    useEffect(() => {
        loadLocations()
    }, [])

    const loadLocations = async () => {
        setIsLoading(true)
        try {
            const data = await getLocations()
            setLocations(data)
        } catch (error) {
            console.error("Error loading locations:", error)
            toast.error("Failed to load locations")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newLocation.name.trim()) {
            toast.error("Location name is required")
            return
        }

        setIsAdding(true)
        try {
            const result = await createLocation(newLocation.name, newLocation.address)
            if (result.success) {
                toast.success("Location added successfully")
                setNewLocation({ name: "", address: "" })
                loadLocations()
            } else {
                toast.error(result.error || "Failed to add location")
            }
        } catch (error) {
            toast.error("An error occurred while adding location")
        } finally {
            setIsAdding(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this location?")) return

        try {
            const result = await deleteLocation(id)
            if (result.success) {
                toast.success("Location updated/removed successfully")
                loadLocations()
            } else {
                toast.error(result.error || "Failed to delete location")
            }
        } catch (error) {
            toast.error("Error deleting location")
        }
    }

    const handleToggle = async (id: string, currentStatus: boolean) => {
        try {
            const result = await toggleLocationStatus(id, currentStatus)
            if (result.success) {
                toast.success(`Location ${currentStatus ? "deactivated" : "activated"} successfully`)
                loadLocations()
            } else {
                toast.error(result.error || "Failed to update status")
            }
        } catch (error) {
            toast.error("Error updating location status")
        }
    }

    const filteredLocations = locations.filter(loc =>
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black p-3 md:p-6 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white/60">Loading locations...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black p-3 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/settings">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Locations</h1>
                        <p className="text-white/60 mt-1">Manage pickup and dropoff locations</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Location Form */}
                <div className="lg:col-span-1">
                    <Card className="liquid-glass border-white/10 p-6 sticky top-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Add New Location</h2>
                        <form onSubmit={handleAddLocation} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-white">Location Name *</Label>
                                <Input
                                    id="name"
                                    value={newLocation.name}
                                    onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                                    placeholder="e.g. Heathrow Airport"
                                    className="bg-white/5 border-white/10 text-white"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-white">Full Address (Optional)</Label>
                                <Input
                                    id="address"
                                    value={newLocation.address}
                                    onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                                    placeholder="Street, City, Postcode"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={isAdding}
                                className="w-full bg-red-500 hover:bg-red-600 text-white"
                            >
                                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                Add Location
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Locations List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search locations..."
                            className="pl-10 bg-white/5 border-white/10 text-white"
                        />
                    </div>

                    <div className="grid gap-4">
                        {filteredLocations.length > 0 ? (
                            filteredLocations.map((loc) => (
                                <Card key={loc.id} className={`liquid-glass border-white/10 p-4 transition-opacity ${!loc.is_active ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${loc.is_active ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/40'}`}>
                                                <MapPin className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white flex items-center gap-2">
                                                    {loc.name}
                                                    {!loc.is_active && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-white/60">Inactive</span>}
                                                </h3>
                                                {loc.address && <p className="text-sm text-white/40">{loc.address}</p>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleToggle(loc.id, loc.is_active)}
                                                className={`${loc.is_active ? 'text-green-400 hover:text-green-300' : 'text-white/40 hover:text-white/60'}`}
                                                title={loc.is_active ? "Deactivate" : "Activate"}
                                            >
                                                {loc.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(loc.id)}
                                                className="text-white/40 hover:text-red-400"
                                                title="Delete/Deactivate"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-12 liquid-glass border-white/10 rounded-xl">
                                <MapPin className="h-12 w-12 text-white/10 mx-auto mb-4" />
                                <p className="text-white/60">No locations found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
