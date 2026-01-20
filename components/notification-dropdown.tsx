"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Bell, CheckCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  type Notification,
} from "@/app/actions/notifications"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"

// Helper to play a notification sound using Web Audio API
const playNotificationSound = () => {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = "sine"
    // Gentle "ding" sound
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5
    oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5) // A4

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start()
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch (e) {
    console.warn("Audio feedback failed:", e)
  }
}

export function NotificationDropdown() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Set up Realtime subscription
    const supabase = createClient()
    if (!supabase) {
      console.warn("[Notifications] Supabase client not available for realtime")
      return
    }

    console.log("[Notifications] Subscribing to real-time notifications...")
    const channel = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("[Notifications] New notification received:", payload.new)
          const newNotification = payload.new as Notification

          // Update local state
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)

          // Sound and Animation (Toast)
          playNotificationSound()
          toast.message(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
            action: newNotification.link
              ? {
                label: "View",
                onClick: () => {
                  if (newNotification.link) router.push(newNotification.link)
                },
              }
              : undefined,
          })
        },
      )
      .subscribe((status) => {
        console.log("[Notifications] Subscription status:", status)
      })

    // Set up Polling Fallback
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 10000) // Poll for unread count every 10 seconds

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getNotifications(50)
    if (result.success) {
      setNotifications(result.data)
    }
    setLoading(false)
  }

  const loadUnreadCount = async () => {
    const result = await getUnreadCount()
    if (result.success) {
      setUnreadCount(result.count)
    }
  }

  const handleMarkAsRead = async (notificationId: string, link?: string) => {
    await markAsRead(notificationId)
    await loadNotifications()
    await loadUnreadCount()

    if (link) {
      router.push(link)
      setOpen(false)
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead()
    if (result.success) {
      toast.success("All notifications marked as read")
      await loadNotifications()
      await loadUnreadCount()
    } else {
      toast.error("Failed to mark all as read")
    }
  }

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await deleteNotification(notificationId)
    if (result.success) {
      toast.success("Notification deleted")
      await loadNotifications()
      await loadUnreadCount()
    } else {
      toast.error("Failed to delete notification")
    }
  }

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      booking: "📅",
      damage: "⚠️",
      payment: "💳",
      system: "🔔",
      pcn: "🎫",
      deposit: "💰",
      agreement: "📄",
    }
    return icons[type] || "🔔"
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96 liquid-glass border-white/20 p-0">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs text-white/60 hover:text-white hover:bg-white/10"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/60 text-sm">Loading notifications...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Bell className="h-12 w-12 text-white/20 mb-3" />
              <p className="text-white/60 text-sm text-center">No notifications yet</p>
              <p className="text-white/40 text-xs text-center mt-1">
                You'll see updates about bookings, payments, and more here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleMarkAsRead(notification.id, notification.link)}
                  className={`p-4 hover:bg-white/5 cursor-pointer transition-colors ${!notification.read ? "bg-white/5" : ""
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl mt-0.5 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0 text-white/40 hover:text-white hover:bg-white/10"
                          onClick={(e) => handleDelete(notification.id, e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-white/60 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-white/40">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        {!notification.read && <Badge className="h-1.5 w-1.5 p-0 rounded-full bg-red-500" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-white/10">
          <Button
            variant="ghost"
            className="w-full text-xs text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => {
              router.push("/admin/notifications")
              setOpen(false)
            }}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
