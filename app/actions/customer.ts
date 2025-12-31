"use server"

import { db } from "@/lib/database"
import { createClient } from "@/lib/supabase/server"

export async function getCustomerBookingsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return []
  }

  try {
    const { data, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("[v0] Error fetching customer bookings:", fetchError)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Exception fetching customer bookings:", err)
    return []
  }
}

export async function getCustomerAgreementsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return []
  }

  try {
    // Get all user bookings first
    const { data: bookings } = await supabase.from("bookings").select("id").eq("user_id", user.id)

    if (!bookings || bookings.length === 0) {
      return []
    }

    const bookingIds = bookings.map((b) => b.id)

    // Get agreements for those bookings
    const agreements = []
    for (const bookingId of bookingIds) {
      const bookingAgreements = await db.getAgreementsByBookingId(bookingId)
      agreements.push(...bookingAgreements)
    }

    return agreements
  } catch (err) {
    console.error("[v0] Exception fetching customer agreements:", err)
    return []
  }
}

export async function getCustomerInspectionsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return []
  }

  try {
    // Get all user bookings first
    const { data: bookings } = await supabase.from("bookings").select("id").eq("user_id", user.id)

    if (!bookings || bookings.length === 0) {
      return []
    }

    const bookingIds = bookings.map((b) => b.id)

    // Get inspections for those bookings
    const inspections = []
    for (const bookingId of bookingIds) {
      const bookingInspections = await db.getInspectionsByBooking(bookingId)
      inspections.push(...bookingInspections)
    }

    return inspections
  } catch (err) {
    console.error("[v0] Exception fetching customer inspections:", err)
    return []
  }
}

export async function getCustomerPCNsAction() {
  const supabase = await createClient()

  if (!supabase) {
    return []
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return []
  }

  try {
    // Get all user agreements first
    const agreements = await getCustomerAgreementsAction()

    if (agreements.length === 0) {
      return []
    }

    // Get PCN tickets for those agreements
    const tickets = []
    for (const agreement of agreements) {
      const agreementTickets = await db.getPCNsByAgreementId(agreement.id)
      tickets.push(...agreementTickets)
    }

    return tickets
  } catch (err) {
    console.error("[v0] Exception fetching customer PCNs:", err)
    return []
  }
}
