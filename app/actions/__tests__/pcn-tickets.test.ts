/**
 * Tests for PCN Ticket creation
 * 
 * Run with: npm test -- app/actions/__tests__/pcn-tickets.test.ts
 * 
 * These tests verify:
 * 1. Ticket creation with valid UUIDs succeeds
 * 2. Invalid UUID format is rejected with clear error
 * 3. Authenticated user's UUID is used for uploadedBy (not client-provided value)
 * 4. Authentication is required
 */

import { createPCNTicketAction } from "../pcn-tickets"
import { createClient } from "@/lib/supabase/server"

// Mock dependencies
jest.mock("@/lib/supabase/server")
jest.mock("@/lib/database", () => ({
  db: {
    createPCNTicket: jest.fn(),
  },
}))
jest.mock("../email", () => ({
  sendPCNTicketEmail: jest.fn(),
}))

import { db } from "@/lib/database"

describe("createPCNTicketAction", () => {
  const mockUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@test.com",
  }

  const validTicketData = {
    agreementId: "agreement-123",
    bookingId: "booking-123",
    customerId: "550e8400-e29b-41d4-a716-446655440001",
    vehicleId: "vehicle-123",
    ticketType: "parking" as const,
    ticketNumber: "PCN123456",
    issueDate: "2024-01-15",
    dueDate: "2024-02-15",
    amount: 100.0,
    ticketDocumentUrl: "https://example.com/ticket.pdf",
    notes: "Test ticket",
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should create ticket with authenticated user's UUID for uploadedBy", async () => {
    // Mock authenticated user
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Mock successful ticket creation
    ;(db.createPCNTicket as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      ...validTicketData,
      uploadedBy: mockUser.id,
      status: "pending",
    })

    const result = await createPCNTicketAction(validTicketData)

    expect(result.success).toBe(true)
    expect(db.createPCNTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadedBy: mockUser.id, // Should use authenticated user's UUID, not client value
      })
    )
  })

  it("should reject invalid customerId UUID format", async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    const invalidData = {
      ...validTicketData,
      customerId: "Admin", // Invalid UUID
    }

    const result = await createPCNTicketAction(invalidData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("customerId must be a valid UUID")
    expect(db.createPCNTicket).not.toHaveBeenCalled()
  })

  it("should require authentication", async () => {
    // Mock unauthenticated user
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Not authenticated" },
        }),
      },
    })

    const result = await createPCNTicketAction(validTicketData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Authentication required")
    expect(db.createPCNTicket).not.toHaveBeenCalled()
  })

  it("should provide clear error for UUID database errors", async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    // Mock database error with UUID syntax error
    ;(db.createPCNTicket as jest.Mock).mockRejectedValue(
      new Error("invalid input syntax for type uuid: 'Admin'")
    )

    const result = await createPCNTicketAction(validTicketData)

    expect(result.success).toBe(false)
    expect(result.error).toContain("Invalid UUID format")
  })

  it("should ignore client-provided uploadedBy and use authenticated user", async () => {
    ;(createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    })

    ;(db.createPCNTicket as jest.Mock).mockResolvedValue({
      id: "ticket-123",
      ...validTicketData,
    })

    // Client tries to send "Admin" as uploadedBy
    const dataWithAdmin = {
      ...validTicketData,
      uploadedBy: "Admin", // Should be ignored
    }

    const result = await createPCNTicketAction(dataWithAdmin)

    expect(result.success).toBe(true)
    // Verify that "Admin" was NOT used, but authenticated user's UUID was
    expect(db.createPCNTicket).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadedBy: mockUser.id, // Authenticated user's UUID, not "Admin"
      })
    )
  })
})


