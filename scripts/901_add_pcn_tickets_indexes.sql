-- Add indexes for PCN tickets table to improve query performance
-- Run this after creating the pcn_tickets table

-- Index for agreement_id (most common filter)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_agreement_id ON pcn_tickets(agreement_id);

-- Index for booking_id (common filter)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_booking_id ON pcn_tickets(booking_id);

-- Index for status (common filter for filtering by status)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_status ON pcn_tickets(status);

-- Index for created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_created_at ON pcn_tickets(created_at DESC);

-- Composite index for agreement_id + status (common query pattern)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_agreement_status ON pcn_tickets(agreement_id, status);

-- Index for uploaded_by (for filtering by user)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_uploaded_by ON pcn_tickets(uploaded_by);

-- Index for customer_id (if filtering by customer)
CREATE INDEX IF NOT EXISTS idx_pcn_tickets_customer_id ON pcn_tickets(customer_id) WHERE customer_id IS NOT NULL;


