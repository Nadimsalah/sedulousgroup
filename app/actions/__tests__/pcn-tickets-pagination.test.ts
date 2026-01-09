/**
 * Tests for PCN Tickets Pagination
 * 
 * Run with: npm test -- app/actions/__tests__/pcn-tickets-pagination.test.ts
 * 
 * These tests verify:
 * 1. Initial load returns 5 tickets with nextCursor
 * 2. Load more fetches next 5 tickets
 * 3. hasMore is false when no more tickets
 * 4. Cursor pagination works correctly
 */

import { getAllPCNTicketsPaginatedAction } from "../pcn-tickets"
import { db } from "@/lib/database"

// Mock dependencies
jest.mock("@/lib/database", () => ({
  db: {
    getAllPCNTicketsPaginated: jest.fn(),
  },
}))

describe("getAllPCNTicketsPaginatedAction", () => {
  const mockTickets = Array.from({ length: 10 }, (_, i) => ({
    id: `ticket-${i}`,
    agreementId: `agreement-${i}`,
    bookingId: `booking-${i}`,
    ticketType: "parking" as const,
    issueDate: new Date(2024, 0, i + 1).toISOString().split("T")[0],
    amount: 100 + i,
    status: "pending" as const,
    ticketDocumentUrl: `https://example.com/ticket-${i}.pdf`,
    customerNotified: false,
    createdAt: new Date(2024, 0, i + 1).toISOString(),
    updatedAt: new Date(2024, 0, i + 1).toISOString(),
  }))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should return first 5 tickets with nextCursor on initial load", async () => {
    const firstPage = mockTickets.slice(0, 5)
    const nextCursor = Buffer.from(`${firstPage[4].createdAt}|${firstPage[4].id}`).toString("base64")

    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockResolvedValue({
      items: firstPage,
      nextCursor,
      hasMore: true,
    })

    const result = await getAllPCNTicketsPaginatedAction(5)

    expect(result.items).toHaveLength(5)
    expect(result.nextCursor).toBeTruthy()
    expect(result.hasMore).toBe(true)
    expect(db.getAllPCNTicketsPaginated).toHaveBeenCalledWith(5, undefined, undefined)
  })

  it("should return next 5 tickets when cursor is provided", async () => {
    const secondPage = mockTickets.slice(5, 10)
    const cursor = Buffer.from(`${mockTickets[4].createdAt}|${mockTickets[4].id}`).toString("base64")

    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockResolvedValue({
      items: secondPage,
      nextCursor: null,
      hasMore: false,
    })

    const result = await getAllPCNTicketsPaginatedAction(5, cursor)

    expect(result.items).toHaveLength(5)
    expect(result.nextCursor).toBeNull()
    expect(result.hasMore).toBe(false)
    expect(db.getAllPCNTicketsPaginated).toHaveBeenCalledWith(5, cursor, undefined)
  })

  it("should return empty result when no tickets exist", async () => {
    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockResolvedValue({
      items: [],
      nextCursor: null,
      hasMore: false,
    })

    const result = await getAllPCNTicketsPaginatedAction(5)

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
    expect(result.hasMore).toBe(false)
  })

  it("should pass filters to database method", async () => {
    const filters = { status: "pending", searchTerm: "PCN123" }

    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockResolvedValue({
      items: mockTickets.slice(0, 5),
      nextCursor: "cursor123",
      hasMore: true,
    })

    await getAllPCNTicketsPaginatedAction(5, undefined, filters)

    expect(db.getAllPCNTicketsPaginated).toHaveBeenCalledWith(5, undefined, filters)
  })

  it("should handle errors gracefully", async () => {
    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockRejectedValue(new Error("Database error"))

    const result = await getAllPCNTicketsPaginatedAction(5)

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
    expect(result.hasMore).toBe(false)
  })

  it("should respect limit parameter (max 50)", async () => {
    ;(db.getAllPCNTicketsPaginated as jest.Mock).mockResolvedValue({
      items: mockTickets.slice(0, 50),
      nextCursor: null,
      hasMore: false,
    })

    await getAllPCNTicketsPaginatedAction(100) // Request 100, should be clamped to 50

    expect(db.getAllPCNTicketsPaginated).toHaveBeenCalledWith(50, undefined, undefined)
  })
})


