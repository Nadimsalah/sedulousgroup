"use server"

import { createClient } from "@/lib/supabase/server"

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: "booking" | "damage" | "payment" | "system" | "pcn" | "deposit" | "agreement"
  read: boolean
  link?: string
  created_at: string
  updated_at: string
}

export async function getNotifications(limit = 10) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data: data as Notification[] }
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error)
    return { success: false, error: "Failed to fetch notifications", data: [] }
  }
}

export async function getUnreadCount() {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false)

    if (error) throw error

    return { success: true, count: count || 0 }
  } catch (error) {
    console.error("[v0] Error fetching unread count:", error)
    return { success: false, count: 0 }
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("id", notificationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[v0] Error marking notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

export async function markAllAsRead() {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from("notifications")
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq("read", false)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[v0] Error marking all notifications as read:", error)
    return { success: false, error: "Failed to mark all notifications as read" }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("notifications").delete().eq("id", notificationId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting notification:", error)
    return { success: false, error: "Failed to delete notification" }
  }
}

export async function createNotification(notification: Omit<Notification, "id" | "created_at" | "updated_at">) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.from("notifications").insert(notification).select().single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error creating notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
}
