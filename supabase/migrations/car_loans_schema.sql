-- Car Loans Module Database Schema

-- Main car loans table
CREATE TABLE IF NOT EXISTS car_loans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  vehicle_id TEXT REFERENCES cars(id),
  
  -- Loan Details
  bank_name VARCHAR(255) NOT NULL,
  loan_amount DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  loan_term_months INTEGER NOT NULL,
  monthly_payment DECIMAL(10,2) NOT NULL,
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  first_payment_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  total_paid DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loan payments table
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES car_loans(id) ON DELETE CASCADE,
  
  -- Payment Details
  payment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending',
  
  -- Breakdown
  principal_amount DECIMAL(10,2),
  interest_amount DECIMAL(10,2),
  
  -- Metadata
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Loan documents table
CREATE TABLE IF NOT EXISTS loan_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loan_id UUID REFERENCES car_loans(id) ON DELETE CASCADE,
  
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  
  uploaded_by UUID,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_car_loans_vehicle ON car_loans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_car_loans_status ON car_loans(status);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_status ON loan_payments(status);
CREATE INDEX IF NOT EXISTS idx_loan_documents_loan ON loan_documents(loan_id);

-- Enable Row Level Security
ALTER TABLE car_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access)
CREATE POLICY "Admin can do everything on car_loans" ON car_loans
  FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');

CREATE POLICY "Admin can do everything on loan_payments" ON loan_payments
  FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');

CREATE POLICY "Admin can do everything on loan_documents" ON loan_documents
  FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');
