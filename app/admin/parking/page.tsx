"use client"

import { useState, useEffect } from "react"
import {
    getFleetStatusAction,
    addFleetVehicleAction,
    deleteFleetVehicleAction,
    getAllCarModelsAction,
    type ParkingCar,
    type CarModel
} from "@/app/actions/parking"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Car, Calendar, Plus, Trash2, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ParkingPage() {
    const [loading, setLoading] = useState(true)
    const [cars, setCars] = useState<ParkingCar[]>([])
    const [carModels, setCarModels] = useState<CarModel[]>([])
    const [stats, setStats] = useState({ total: 0, onParking: 0, onRent: 0 })
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<"ALL" | "AVAILABLE" | "ON_RENT">("ALL")
    const { toast } = useToast()

    // Add Vehicle State
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [selectedModel, setSelectedModel] = useState("")
    const [newVrn, setNewVrn] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        loadData()
        loadModels()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const result = await getFleetStatusAction()
            if (result.success) {
                setCars(result.cars)
                setStats(result.stats)
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" })
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to load" })
        } finally {
            setLoading(false)
        }
    }

    const loadModels = async () => {
        const res = await getAllCarModelsAction()
        if (res.success) setCarModels(res.models)
    }

    const handleAddVehicle = async () => {
        if (!selectedModel || !newVrn) {
            toast({ title: "Validation Error", description: "Please select a car and enter VRN", variant: "destructive" })
            return
        }

        setIsSubmitting(true)
        const res = await addFleetVehicleAction(selectedModel, newVrn)
        setIsSubmitting(false)

        if (res.success) {
            toast({ title: "Success", description: "Vehicle added to fleet" })
            setIsAddOpen(false)
            setNewVrn("")
            setSelectedModel("")
            loadData() // Reload list
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this vehicle from the fleet?")) return

        const res = await deleteFleetVehicleAction(id)
        if (res.success) {
            toast({ title: "Deleted", description: "Vehicle removed" })
            loadData()
        } else {
            toast({ title: "Error", description: res.error, variant: "destructive" })
        }
    }

    const filteredCars = cars.filter(car => {
        const matchesSearch =
            car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            car.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (car.currentAgreement?.customerName.toLowerCase().includes(searchQuery.toLowerCase()))

        if (filter === "ALL") return matchesSearch
        return matchesSearch && car.status === filter
    })

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-white">Parking Management</h1>
                <div className="flex gap-2">
                    <Button onClick={loadData} variant="outline" className="text-black bg-white hover:bg-white/90">
                        Refresh
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700 text-white">
                                <Plus className="mr-2 h-4 w-4" /> Add Vehicle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-zinc-900 border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Vehicle to Fleet</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Car Model</Label>
                                    <Select value={selectedModel} onValueChange={setSelectedModel}>
                                        <SelectTrigger className="bg-black/40 border-white/20">
                                            <SelectValue placeholder="Select a car model" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                            {carModels.length === 0 ? (
                                                <SelectItem value="none" disabled>No car models found</SelectItem>
                                            ) : (
                                                carModels.map(m => (
                                                    <SelectItem key={m.id} value={m.id}>
                                                        {m.brand} {m.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Registration Number (VRN)</Label>
                                    <Input
                                        value={newVrn}
                                        onChange={e => setNewVrn(e.target.value)}
                                        placeholder="e.g. AB23 CDE"
                                        className="bg-black/40 border-white/20 uppercase"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button onClick={handleAddVehicle} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                                    {isSubmitting ? "Adding..." : "Add Vehicle"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">Total Fleet</CardTitle>
                        <Car className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">On Parking (Available)</CardTitle>
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-400">{stats.onParking}</div>
                    </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-80">On Rent</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-400">{stats.onRent}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tables and Filters */}
            <Card className="bg-white/5 border-white/10 text-white">
                <CardHeader>
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        <CardTitle>Fleet Inventory</CardTitle>
                        <div className="flex gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search fleet..."
                                    className="pl-8 bg-black/20 border-white/10 text-white"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
                                <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
                                    <SelectValue placeholder="Filter Status" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    <SelectItem value="ALL">All Vehicles</SelectItem>
                                    <SelectItem value="AVAILABLE">Available</SelectItem>
                                    <SelectItem value="ON_RENT">On Rent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/10">
                        <Table>
                            <TableHeader className="bg-white/5">
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead className="text-white">Vehicle Info</TableHead>
                                    <TableHead className="text-white">VRN</TableHead>
                                    <TableHead className="text-white">Status</TableHead>
                                    <TableHead className="text-white">Current Agreement</TableHead>
                                    <TableHead className="text-white text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-white/60">Loading fleet data...</TableCell>
                                    </TableRow>
                                ) : filteredCars.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-white/60">No vehicles found matching criteria.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCars.map((car) => (
                                        <TableRow key={car.id} className="border-white/10 hover:bg-white/5">
                                            <TableCell className="font-medium text-white">
                                                <div className="flex items-center gap-3">
                                                    {car.image && (
                                                        <img src={car.image} alt={car.name} className="h-10 w-16 object-cover rounded-md bg-white/10" />
                                                    )}
                                                    <div>
                                                        <div className="font-bold">{car.brand}</div>
                                                        <div className="text-sm text-white/60">{car.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-white font-mono text-lg">
                                                {car.registrationNumber}
                                            </TableCell>
                                            <TableCell>
                                                {car.status === "AVAILABLE" ? (
                                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30">Available</Badge>
                                                ) : (
                                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30">On Rent</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-white/80">
                                                {car.currentAgreement ? (
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium text-blue-300">{car.currentAgreement.customerName}</span>
                                                        </div>
                                                        <span className="text-xs text-white/50">
                                                            Until {new Date(car.currentAgreement.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white/30 italic">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
                                                    onClick={() => handleDelete(car.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
