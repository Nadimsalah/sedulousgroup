"use server"

import { db } from "@/lib/database"
import { sendBookingApprovalEmail, sendBookingRejectionEmail } from "./email"

export async function getBookingsAction() {
  console.log("[v0] getBookingsAction called")
  try {
    const bookings = await db.getBookings()
    console.log("[v0] getBookingsAction result:", bookings.length, "bookings")
    return bookings || []
  } catch (error) {
    console.error("[v0] getBookingsAction error:", error)
    return []
  }
}

export async function updateBookingStatusAction(id: string, status: string) {
  try {
    const success = await db.updateBookingStatus(id, status)

    if (success && status === "Confirmed") {
      console.log("[v0] Booking confirmed by admin, sending approval email...")
      const emailResult = await sendBookingApprovalEmail(id)
      if (emailResult.success) {
        console.log("[v0] Approval email sent successfully")
      } else {
        console.error("[v0] Failed to send approval email:", emailResult.error)
      }
    } else if (success && status === "Cancelled") {
      console.log("[v0] Booking cancelled by admin, sending rejection email...")
      const emailResult = await sendBookingRejectionEmail(id)
      if (emailResult.success) {
        console.log("[v0] Rejection email sent successfully")
      } else {
        console.error("[v0] Failed to send rejection email:", emailResult.error)
      }
    }

    return success
  } catch (error) {
    console.error("[v0] updateBookingStatusAction error:", error)
    return false
  }
}

export async function deleteBookingAction(id: string) {
  try {
    return await db.deleteBooking(id)
  } catch (error) {
    console.error("[v0] deleteBookingAction error:", error)
    return false
  }
}

export async function getSalesRequestsAction() {
  console.log("[v0] getSalesRequestsAction called")
  try {
    const requests = await db.getSalesRequests()
    console.log("[v0] getSalesRequestsAction result:", requests.length, "requests")
    return requests || []
  } catch (error) {
    console.error("[v0] getSalesRequestsAction error:", error)
    return []
  }
}

export async function updateSalesRequestStatusAction(id: string, status: string) {
  try {
    return await db.updateSalesRequestStatus(id, status)
  } catch (error) {
    console.error("[v0] updateSalesRequestStatusAction error:", error)
    return false
  }
}

export async function deleteSalesRequestAction(id: string) {
  try {
    return await db.deleteSalesRequest(id)
  } catch (error) {
    console.error("[v0] deleteSalesRequestAction error:", error)
    return false
  }
}
