-- Unified Finance Module Schema

-- Enums for structured ledger
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_direction') THEN
        CREATE TYPE finance_direction AS ENUM ('in', 'out');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_status') THEN
        CREATE TYPE finance_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_type') THEN
        CREATE TYPE finance_type AS ENUM (
            'booking_payment', 
            'deposit', 
            'refund', 
            'damage_charge', 
            'late_fee', 
            'vendor_cost', 
            'loan_payment', 
            'subscription', 
            'one_time_charge', 
            'manual_adjustment', 
            'other',
            'pcn_ticket'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_source') THEN
        CREATE TYPE finance_source AS ENUM (
            'booking', 
            'agreement', 
            'deposit', 
            'damage_report', 
            'vendor', 
            'loan', 
            'manual'
        );
    END IF;
END $$;

-- Main ledger table
CREATE TABLE IF NOT EXISTS finance_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    direction finance_direction NOT NULL,
    type finance_type NOT NULL,
    source finance_source NOT NULL,
    status finance_status NOT NULL DEFAULT 'paid',
    currency TEXT NOT NULL DEFAULT 'GBP',
    amount_gross NUMERIC(14,2) NOT NULL,
    fees NUMERIC(14,2) DEFAULT 0,
    amount_net NUMERIC(14,2) NOT NULL,
    
    -- Linked Entity References
    booking_id TEXT REFERENCES bookings(id),      -- FIXED: TEXT
    agreement_id TEXT REFERENCES agreements(id),  -- FIXED: TEXT
    vehicle_id TEXT REFERENCES cars(id),          -- FIXED: TEXT
    vendor_id TEXT REFERENCES vendors(id),        -- FIXED: TEXT
    deposit_id TEXT,                              -- FIXED: TEXT (No Direct FK for flexibility)
    damage_report_id TEXT REFERENCES damage_reports(id), -- FIXED: TEXT
    
    -- UUID References
    customer_id UUID REFERENCES user_profiles(id), -- UUID (Auth/User)
    loan_id UUID REFERENCES car_loans(id),         -- UUID (New Schema)
    loan_payment_id UUID REFERENCES loan_payments(id), -- UUID (New Schema)
    reversal_of_transaction_id UUID REFERENCES finance_transactions(id),
    
    -- Payment Details
    method TEXT,
    provider TEXT,
    reference TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documentation mapping
CREATE TABLE IF NOT EXISTS finance_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES finance_transactions(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, -- receipt, invoice, proof, other
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring charges tracker (Vendor ID here also needs to be TEXT)
CREATE TABLE IF NOT EXISTS finance_recurring_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    vendor_id TEXT REFERENCES vendors(id), -- FIXED: TEXT
    amount NUMERIC(14,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    frequency TEXT NOT NULL, -- monthly, weekly, yearly
    next_due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, paused, cancelled
    auto_create_transaction BOOLEAN NOT NULL DEFAULT true,
    category TEXT, -- insurance, SaaS, rent, payroll, utilities, etc.
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_finance_occurred_at ON finance_transactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_finance_status ON finance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_finance_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_finance_source ON finance_transactions(source);
CREATE INDEX IF NOT EXISTS idx_finance_booking ON finance_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_finance_customer ON finance_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_finance_vehicle ON finance_transactions(vehicle_id);

-- Enable RLS
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_recurring_charges ENABLE ROW LEVEL SECURITY;

-- Super Admin Only Access (sami@admin.com)
DROP POLICY IF EXISTS "Super Admin access on finance_transactions" ON finance_transactions;
CREATE POLICY "Super Admin access on finance_transactions" ON finance_transactions
    FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');

DROP POLICY IF EXISTS "Super Admin access on finance_documents" ON finance_documents;
CREATE POLICY "Super Admin access on finance_documents" ON finance_documents
    FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');

DROP POLICY IF EXISTS "Super Admin access on finance_recurring_charges" ON finance_recurring_charges;
CREATE POLICY "Super Admin access on finance_recurring_charges" ON finance_recurring_charges
    FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');
