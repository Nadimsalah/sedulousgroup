"use client"

import { useState, useEffect } from "react"
import { Bell, CheckCheck, X, Calendar, Car, CreditCard, AlertTriangle, FileText, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    type Notification,
} from "@/app/actions/notifications"
import { useRouter } from "next/navigation"

export default function AllNotificationsPage() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadAllNotifications()
    }, [])

    const loadAllNotifications = async () => {
        setLoading(true)
        // Fetch a larger set for the full page
        const result = await getNotifications(100)
        if (result.success) {
            setNotifications(result.data)
        } else {
            toast.error(result.error || "Failed to load notifications")
        }
        setLoading(false)
    }

    const handleMarkAsRead = async (id: string, link?: string) => {
        await markAsRead(id)
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
        if (link) router.push(link)
    }

    const handleMarkAllRead = async () => {
        const result = await markAllAsRead()
        if (result.success) {
            toast.success("All notifications marked as read")
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await deleteNotification(id)
        if (result.success) {
            setNotifications(prev => prev.filter(n => n.id !== id))
            toast.success("Notification deleted")
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'booking': return <Calendar className="h-5 w-5 text-blue-400" />
            case 'damage': return <AlertTriangle className="h-5 w-5 text-red-400" />
            case 'payment': return <CreditCard className="h-5 w-5 text-green-400" />
            case 'pcn': return <Ticket className="h-5 w-5 text-orange-400" />
            case 'agreement': return <FileText className="h-5 w-5 text-purple-400" />
            case 'deposit': return <CreditCard className="h-5 w-5 text-yellow-400" />
            default: return <Bell className="h-5 w-5 text-zinc-400" />
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        Notifications
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white/60">
                            {notifications.length} Total
                        </Badge>
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage and track all administrative alerts.</p>
                </div>
                {/* Developer Alert: Reminder to run SQL fix */}
                {/* Developer Alert Removed */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={loadAllNotifications}
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                    <Button
                        onClick={handleMarkAllRead}
                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                        disabled={notifications.filter(n => !n.read).length === 0}
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Mark All Read
                    </Button>
                </div>
            </div>

            <Card className="bg-zinc-900/50 border-white/10 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-zinc-500">
                            Loading all notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-4">
                            <Bell className="h-12 w-12 opacity-20" />
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkAsRead(n.id, n.link)}
                                    className={`p-6 hover:bg-white/5 transition-all cursor-pointer flex items-start gap-4 ${!n.read ? "bg-red-500/5 border-l-2 border-red-500" : ""}`}
                                >
                                    <div className="mt-1 p-2 rounded-lg bg-zinc-800/50 border border-white/5">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-4">
                                            <h3 className={`font-semibold text-lg ${!n.read ? "text-white" : "text-zinc-400"}`}>
                                                {n.title}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-zinc-500 whitespace-nowrap">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-white/10"
                                                    onClick={(e) => handleDelete(n.id, e)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-zinc-400 mt-1 leading-relaxed">
                                            {n.message}
                                        </p>
                                        {n.link && (
                                            <div className="mt-4">
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto text-red-400 hover:text-red-300 font-medium text-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        router.push(n.link!)
                                                    }}
                                                >
                                                    View Details →
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
