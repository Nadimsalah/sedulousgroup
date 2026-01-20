-- Company Expenses Module Database Schema

-- Main company expenses table
CREATE TABLE IF NOT EXISTS company_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL, -- e.g., 'Loan Payment', 'Maintenance', 'Office', 'Insurance', 'Other'
  status VARCHAR(20) DEFAULT 'paid', -- 'paid' or 'pending'
  recurrence VARCHAR(20) DEFAULT 'one_time', -- 'one_time' or 'monthly'
  
  -- Tracking & Source
  source VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'car_loan'
  reference_id UUID, -- Reference to loan_payments.id or other related records
  
  -- Metadata
  payment_method VARCHAR(50),
  recipient VARCHAR(255),
  notes TEXT,
  attachment_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_expenses_date ON company_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_company_expenses_category ON company_expenses(category);
CREATE INDEX IF NOT EXISTS idx_company_expenses_source ON company_expenses(source);

-- Enable Row Level Security
ALTER TABLE company_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only access - sami@admin.com)
CREATE POLICY "Admin can do everything on company_expenses" ON company_expenses
  FOR ALL USING (auth.jwt() ->> 'email' = 'sami@admin.com');
