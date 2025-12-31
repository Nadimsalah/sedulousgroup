-- Create agreements table for contract management
CREATE TABLE IF NOT EXISTS agreements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agreement_number TEXT UNIQUE NOT NULL,
  booking_id TEXT NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES user_profiles(id),
  vehicle_id TEXT REFERENCES cars(id),
  
  -- Agreement details
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, signed, active, completed, cancelled
  agreement_type TEXT NOT NULL, -- rent, flexi_hire, pco_hire
  
  -- Contract terms
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  deposit_amount NUMERIC(10, 2),
  
  -- Document URLs
  unsigned_agreement_url TEXT,
  signed_agreement_url TEXT,
  customer_signature_data TEXT, -- Base64 signature
  signed_at TIMESTAMP WITH TIME ZONE,
  sent_to_customer_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'signed', 'active', 'completed', 'cancelled'))
);

-- Create vehicle inspections table for handover documentation
CREATE TABLE IF NOT EXISTS vehicle_inspections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agreement_id TEXT NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  vehicle_id TEXT NOT NULL REFERENCES cars(id),
  
  -- Inspection type
  inspection_type TEXT NOT NULL, -- handover, return
  
  -- Vehicle condition at inspection
  odometer_reading INTEGER NOT NULL,
  fuel_level TEXT NOT NULL, -- full, 3/4, 1/2, 1/4, empty
  
  -- Media storage (arrays of blob URLs)
  exterior_photos JSONB DEFAULT '[]'::jsonb,
  interior_photos JSONB DEFAULT '[]'::jsonb,
  damage_photos JSONB DEFAULT '[]'::jsonb,
  video_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Damage notes
  damage_notes TEXT,
  overall_condition TEXT, -- excellent, good, fair, poor
  
  -- Inspector details
  inspected_by UUID,
  inspected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_inspection_type CHECK (inspection_type IN ('handover', 'return')),
  CONSTRAINT valid_fuel_level CHECK (fuel_level IN ('full', '3/4', '1/2', '1/4', 'empty')),
  CONSTRAINT valid_condition CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor'))
);

-- Create PCN/tickets table
CREATE TABLE IF NOT EXISTS pcn_tickets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agreement_id TEXT NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  customer_id UUID REFERENCES user_profiles(id),
  vehicle_id TEXT REFERENCES cars(id),
  
  -- Ticket details
  ticket_type TEXT NOT NULL, -- parking, speeding, congestion, other
  ticket_number TEXT,
  issue_date DATE NOT NULL,
  due_date DATE,
  amount NUMERIC(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent_to_customer, paid, disputed, cancelled
  paid_by TEXT, -- customer, company
  paid_at TIMESTAMP WITH TIME ZONE,
  
  -- Documents
  ticket_document_url TEXT NOT NULL,
  proof_of_payment_url TEXT,
  
  -- Communication
  sent_to_customer_at TIMESTAMP WITH TIME ZONE,
  customer_notified BOOLEAN DEFAULT FALSE,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uploaded_by UUID,
  
  CONSTRAINT valid_ticket_type CHECK (ticket_type IN ('parking', 'speeding', 'congestion', 'other')),
  CONSTRAINT valid_pcn_status CHECK (status IN ('pending', 'sent_to_customer', 'paid', 'disputed', 'cancelled'))
);

-- Create damage reports table
CREATE TABLE IF NOT EXISTS damage_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agreement_id TEXT REFERENCES agreements(id),
  booking_id TEXT REFERENCES bookings(id),
  vehicle_id TEXT NOT NULL REFERENCES cars(id),
  customer_id UUID REFERENCES user_profiles(id),
  
  -- Damage details
  damage_type TEXT NOT NULL, -- accident, scratch, dent, mechanical, interior, other
  severity TEXT NOT NULL, -- minor, moderate, severe
  description TEXT NOT NULL,
  location_on_vehicle TEXT, -- front, rear, left_side, right_side, interior, engine
  
  -- Incident details
  incident_date DATE NOT NULL,
  reported_date DATE DEFAULT CURRENT_DATE,
  
  -- Media
  damage_photos JSONB DEFAULT '[]'::jsonb,
  damage_videos JSONB DEFAULT '[]'::jsonb,
  
  -- Cost and repair
  estimated_cost NUMERIC(10, 2),
  actual_cost NUMERIC(10, 2),
  repair_status TEXT DEFAULT 'pending', -- pending, in_progress, completed, no_repair_needed
  repaired_by TEXT, -- vendor_id reference
  repaired_at DATE,
  
  -- Responsibility
  responsible_party TEXT, -- customer, company, third_party
  insurance_claim_number TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reported_by UUID,
  
  CONSTRAINT valid_damage_type CHECK (damage_type IN ('accident', 'scratch', 'dent', 'mechanical', 'interior', 'other')),
  CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'severe')),
  CONSTRAINT valid_repair_status CHECK (repair_status IN ('pending', 'in_progress', 'completed', 'no_repair_needed')),
  CONSTRAINT valid_responsible_party CHECK (responsible_party IN ('customer', 'company', 'third_party'))
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Vendor details
  name TEXT NOT NULL,
  vendor_type TEXT NOT NULL, -- mechanic, body_shop, supplier, insurance, other
  
  -- Contact information
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  
  -- Business details
  rating NUMERIC(2, 1) CHECK (rating >= 0 AND rating <= 5),
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT valid_vendor_type CHECK (vendor_type IN ('mechanic', 'body_shop', 'supplier', 'insurance', 'other'))
);

-- Create deposits table
CREATE TABLE IF NOT EXISTS deposits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agreement_id TEXT NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  customer_id UUID NOT NULL REFERENCES user_profiles(id),
  
  -- Deposit details
  amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT, -- card, cash, bank_transfer
  transaction_id TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'held', -- held, refunded, deducted
  
  -- Refund details
  refund_amount NUMERIC(10, 2),
  deduction_amount NUMERIC(10, 2),
  deduction_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  refund_transaction_id TEXT,
  
  -- Notes
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_by UUID,
  
  CONSTRAINT valid_deposit_status CHECK (status IN ('held', 'refunded', 'deducted', 'partially_refunded')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'cash', 'bank_transfer'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agreements_booking_id ON agreements(booking_id);
CREATE INDEX IF NOT EXISTS idx_agreements_customer_id ON agreements(customer_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_agreement_number ON agreements(agreement_number);

CREATE INDEX IF NOT EXISTS idx_inspections_agreement_id ON vehicle_inspections(agreement_id);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_type ON vehicle_inspections(inspection_type);

CREATE INDEX IF NOT EXISTS idx_pcn_agreement_id ON pcn_tickets(agreement_id);
CREATE INDEX IF NOT EXISTS idx_pcn_customer_id ON pcn_tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_pcn_status ON pcn_tickets(status);

CREATE INDEX IF NOT EXISTS idx_damage_vehicle_id ON damage_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_agreement_id ON damage_reports(agreement_id);
CREATE INDEX IF NOT EXISTS idx_damage_status ON damage_reports(repair_status);

CREATE INDEX IF NOT EXISTS idx_deposits_agreement_id ON deposits(agreement_id);
CREATE INDEX IF NOT EXISTS idx_deposits_customer_id ON deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Enable RLS on all tables
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pcn_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agreements (customers can view their own, admins can manage all)
CREATE POLICY "customers_view_own_agreements" ON agreements
  FOR SELECT USING (
    customer_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "admins_manage_agreements" ON agreements
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for inspections
CREATE POLICY "customers_view_own_inspections" ON vehicle_inspections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agreements a
      WHERE a.id = vehicle_inspections.agreement_id
      AND a.customer_id = auth.uid()
    )
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "admins_manage_inspections" ON vehicle_inspections
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for PCN tickets
CREATE POLICY "customers_view_own_pcns" ON pcn_tickets
  FOR SELECT USING (
    customer_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "admins_manage_pcns" ON pcn_tickets
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for damage reports
CREATE POLICY "customers_view_related_damage" ON damage_reports
  FOR SELECT USING (
    customer_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "admins_manage_damage" ON damage_reports
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for vendors (admin only)
CREATE POLICY "admins_manage_vendors" ON vendors
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for deposits
CREATE POLICY "customers_view_own_deposits" ON deposits
  FOR SELECT USING (
    customer_id = auth.uid()
    OR auth.jwt() ->> 'role' = 'admin'
  );

CREATE POLICY "admins_manage_deposits" ON deposits
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
